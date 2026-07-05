import { useState, useRef, useEffect } from 'react';
import styles from './VoiceField.module.css';

const BACKEND = 'https://tennis-love-app-production.up.railway.app';

const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

const STEPS = [
  { key: 'upload',     label: 'Sending audio...' },
  { key: 'transcribe', label: 'Transcribing...' },
  { key: 'extract',    label: 'Filling fields...' },
];

function formatTime(sec) {
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = (sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// isBanner  — big tennis ball mic at top, fills all fields from voice
// inline     — compact mic beside a textarea, appends to existing text
// (default)  — full mic + textarea stacked
export default function VoiceField({ label, value, onChange, lang, onFieldsExtracted, onLiveText, onStateChange, onAudioReady, userId, isBanner, inline }) {
  const [state, setState] = useState('idle');
  const [seconds, setSeconds] = useState(0);
  const [step, setStep] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [lastAudio, setLastAudio] = useState(null);
  const [showShortHint, setShowShortHint] = useState(false);
  const secondsRef = useRef(0);

  const [waveform, setWaveform] = useState(Array(24).fill(3));

  const mediaRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const valueRef = useRef(value);
  const speechRef = useRef(null);
  const analyserRef = useRef(null);
  const audioCtxRef = useRef(null);
  const animFrameRef = useRef(null);
  useEffect(() => { valueRef.current = value; }, [value]);
  useEffect(() => { secondsRef.current = seconds; }, [seconds]);
  useEffect(() => () => clearInterval(timerRef.current), []);

  const isRecordingRef = useRef(false);

  const startWaveform = (stream) => {
    const ctx = new AudioContext();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 64;
    ctx.createMediaStreamSource(stream).connect(analyser);
    audioCtxRef.current = ctx;
    analyserRef.current = analyser;
    const data = new Uint8Array(analyser.frequencyBinCount);
    const tick = () => {
      analyser.getByteFrequencyData(data);
      const bars = Array.from({ length: 24 }, (_, i) => {
        const val = data[Math.floor(i * data.length / 24)] / 255;
        return Math.max(3, Math.round(val * 48));
      });
      setWaveform(bars);
      animFrameRef.current = requestAnimationFrame(tick);
    };
    tick();
  };

  const stopWaveform = () => {
    cancelAnimationFrame(animFrameRef.current);
    try { audioCtxRef.current?.close(); } catch {}
    analyserRef.current = null;
    audioCtxRef.current = null;
    setWaveform(Array(24).fill(3));
  };

  const startSpeechRecognition = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    isRecordingRef.current = true;

    const createSR = () => {
      if (!isRecordingRef.current) return;
      const sr = new SR();
      sr.continuous = true;
      sr.interimResults = true;
      sr.lang = 'en-US';
      let final = '';
      sr.onresult = (e) => {
        let interim = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const txt = e.results[i][0].transcript;
          if (e.results[i].isFinal) final += txt + ' ';
          else interim = txt;
        }
        onLiveText?.((final + interim).trim());
      };
      sr.onend = () => {
        // Chrome stops SR after silence — restart if still recording
        if (isRecordingRef.current) createSR();
      };
      sr.onerror = (e) => {
        console.warn('SR error:', e.error);
        if ((e.error === 'no-speech' || e.error === 'aborted') && isRecordingRef.current) createSR();
      };
      sr.start();
      speechRef.current = sr;
    };

    createSR();
  };

  const stopSpeechRecognition = () => {
    isRecordingRef.current = false;
    try { speechRef.current?.stop(); } catch {}
    speechRef.current = null;
  };

  const startRecording = async () => {
    setErrorMsg('');
    setShowShortHint(false);
    onLiveText?.('');
    try {
      if (isBanner && isMobile) startSpeechRecognition();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      chunksRef.current = [];
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = handleStop;
      mr.start(250);
      mediaRef.current = mr;
      setSeconds(0);
      setState('recording');
      onStateChange?.('recording');
      timerRef.current = setInterval(() => setSeconds(s => {
        if (s >= 179) { stopRecording(); return s; }
        return s + 1;
      }), 1000);
      if (isBanner && !isMobile) startWaveform(stream);
    } catch {
      setErrorMsg('Microphone access denied.');
      setState('error');
    }
  };

  const stopRecording = () => {
    clearInterval(timerRef.current);
    stopSpeechRecognition();
    stopWaveform();
    if (mediaRef.current?.state === 'recording') {
      mediaRef.current.stop();
      mediaRef.current.stream?.getTracks().forEach(t => t.stop());
    }
  };

  const handleStop = async () => {
    if (secondsRef.current < 20) setShowShortHint(true);
    onLiveText?.('');
    onStateChange?.('processing');
    setState('processing');
    setStep(0);
    const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
    setLastAudio(blob);
    await uploadAndProcess(blob);
  };

  const uploadAndProcess = async (blob) => {
    setErrorMsg('');
    try {
      setStep(0);
      const fd = new FormData();
      fd.append('audio', blob, 'recording.webm');
      fd.append('today', new Date().toISOString().split('T')[0]);
      if (userId) fd.append('user_id', userId);
      setStep(1);
      const res = await fetch(`${BACKEND}/transcribe`, { method: 'POST', body: fd });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      setStep(2);
      const { transcript, fields, audio_url } = await res.json();
      onAudioReady?.(blob, audio_url);

      if (isBanner) {
        if (onFieldsExtracted && fields) onFieldsExtracted(fields);
      } else if (inline) {
        // Append to existing text
        const existing = valueRef.current?.trim();
        onChange(existing ? existing + '\n' + transcript : transcript);
      } else {
        onChange(transcript);
        if (onFieldsExtracted && fields) onFieldsExtracted(fields);
      }

      setState('done');
      setTimeout(() => setState('idle'), 2000);
    } catch (e) {
      setErrorMsg(e.message || 'Something went wrong');
      setState('error');
    }
  };

  const retry = () => {
    if (lastAudio) { setState('processing'); setStep(0); uploadAndProcess(lastAudio); }
    else setState('idle');
  };

  // ── INLINE mode ──────────────────────────────────────────────
  if (inline) {
    return (
      <div className={styles.container}>
        <label className={styles.label}>{label}</label>
        <div className={styles.inlineRow}>
          <div className={styles.inlineTextWrap}>
            <textarea value={value} onChange={e => onChange(e.target.value)}
              placeholder={lang === 'hi' ? 'यहाँ लिखें या माइक दबाएं' : 'Type here or tap mic to add'}
              className={styles.textarea} />
            {value?.trim() && (
              <button className={styles.clearBtn} onClick={() => onChange('')} title="Clear">✕</button>
            )}
          </div>

          <div className={styles.inlineMicCol}>
            {state === 'idle' && (
              <button className={styles.inlineMicBtn} onClick={startRecording} title="Speak to add">
                🎙
              </button>
            )}
            {state === 'recording' && (
              <div className={styles.inlineRecording}>
                <div className={styles.inlineTimer}>{formatTime(seconds)}</div>
                <span className={styles.pulseDot} style={{ width: 8, height: 8 }} />
                <button className={styles.inlineStopBtn} onClick={stopRecording}>⏹</button>
              </div>
            )}
            {state === 'processing' && (
              <div className={styles.inlineStatus}>⏳</div>
            )}
            {state === 'done' && (
              <div className={styles.inlineStatus} style={{ color: '#2ecc71' }}>✅</div>
            )}
            {state === 'error' && (
              <div className={styles.inlineError}>
                <button className={styles.inlineMicBtn} onClick={retry} title="Retry">🔄</button>
                <button className={styles.inlineMicBtn} onClick={() => { setState('idle'); setLastAudio(null); }} title="Re-record">🎙</button>
              </div>
            )}
          </div>
        </div>
        {state === 'error' && <p className={styles.errorMsg}>❌ {errorMsg}</p>}
      </div>
    );
  }

  // ── BANNER mode ───────────────────────────────────────────────
  if (isBanner) {
    return (
      <div className={styles.container}>
        <label className={styles.label}>{label}</label>
        {state === 'idle' && (
          <div className={styles.bannerIdleWrap}>
            <button className={styles.bigMicBtn} onClick={startRecording}>
              <span className={styles.bigMicIcon}>🎙</span>
            </button>
            <p className={styles.bigMicLabel}>{lang === 'hi' ? 'बोलना शुरू करें' : 'Tap to speak'}</p>
          </div>
        )}
        {state === 'recording' && (
          <div className={styles.recordingBox}>
            {isMobile ? (
              <div className={styles.pulseRow}>
                <span className={styles.pulseDot} />
                <span className={styles.pulseDot} style={{ animationDelay: '0.2s' }} />
                <span className={styles.pulseDot} style={{ animationDelay: '0.4s' }} />
              </div>
            ) : (
              <div className={styles.waveform}>
                {waveform.map((h, i) => (
                  <div key={i} className={styles.waveBar} style={{ height: h }} />
                ))}
              </div>
            )}
            <div className={styles.timer}>{formatTime(seconds)}</div>
            <p className={styles.recordingLabel}>{lang === 'hi' ? 'रिकॉर्डिंग हो रही है' : 'Recording'}</p>
            <button className={styles.stopBtn} onClick={stopRecording}>⏹ {lang === 'hi' ? 'रोकें' : 'Stop'}</button>
            {seconds >= 150 && <p className={styles.maxWarning}>⚠️ Max 3 min — stopping soon</p>}
          </div>
        )}
        {state === 'processing' && (
          <div className={styles.processingBox}>
            {STEPS.map((s, i) => (
              <div key={s.key} className={`${styles.stepRow} ${i < step ? styles.stepDone : i === step ? styles.stepActive : styles.stepPending}`}>
                <span className={styles.stepIcon}>{i < step ? '✅' : i === step ? '⏳' : '○'}</span>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        )}
        {state === 'done' && (
          <div className={styles.doneBox}><span>✅</span><span>{lang === 'hi' ? 'हो गया! फ़ील्ड भर गए' : 'Done! Fields filled in'}</span></div>
        )}
        {showShortHint && (state === 'idle' || state === 'done') && (
          <p className={styles.shortHint}>
            💡 {lang === 'hi'
              ? 'थोड़ा और बोलें — 20 सेकंड से ज़्यादा बोलने से बेहतर जानकारी मिलती है'
              : 'Tip: Try speaking for at least 20 seconds — more detail leads to better analysis'}
          </p>
        )}
        {state === 'error' && (
          <div className={styles.errorBox}>
            <p className={styles.errorMsg}>❌ {errorMsg}</p>
            <div className={styles.errorBtns}>
              {lastAudio && <button className={styles.retryBtn} onClick={retry}>🔄 Retry</button>}
              <button className={styles.rerecordBtn} onClick={() => { setState('idle'); setLastAudio(null); }}>🎙 Re-record</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── DEFAULT mode ──────────────────────────────────────────────
  return (
    <div className={styles.container}>
      <label className={styles.label}>{label}</label>
      <textarea value={value} onChange={e => onChange(e.target.value)}
        placeholder={lang === 'hi' ? 'यहाँ लिखें या माइक दबाएं' : 'Type here or tap mic to speak'}
        className={styles.textarea} />
      {state === 'idle' && (
        <button className={styles.micBtn} onClick={startRecording}>
          <span className={styles.micIcon}>🎙</span>
          <span className={styles.micText}>{lang === 'hi' ? 'माइक से बोलें' : 'Tap to speak'}</span>
        </button>
      )}
      {state === 'recording' && (
        <div className={styles.recordingBox}>
          <div className={styles.pulseRow}>
            <span className={styles.pulseDot} /><span className={styles.pulseDot} style={{ animationDelay: '0.2s' }} /><span className={styles.pulseDot} style={{ animationDelay: '0.4s' }} />
          </div>
          <div className={styles.timer}>{formatTime(seconds)}</div>
          <p className={styles.recordingLabel}>{lang === 'hi' ? 'रिकॉर्डिंग हो रही है' : 'Recording'}</p>
          <button className={styles.stopBtn} onClick={stopRecording}>⏹ {lang === 'hi' ? 'रोकें' : 'Stop'}</button>
          {seconds >= 150 && <p className={styles.maxWarning}>⚠️ Max 3 min — stopping soon</p>}
        </div>
      )}
      {state === 'processing' && (
        <div className={styles.processingBox}>
          {STEPS.map((s, i) => (
            <div key={s.key} className={`${styles.stepRow} ${i < step ? styles.stepDone : i === step ? styles.stepActive : styles.stepPending}`}>
              <span className={styles.stepIcon}>{i < step ? '✅' : i === step ? '⏳' : '○'}</span>
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      )}
      {state === 'done' && (
        <div className={styles.doneBox}><span>✅</span><span>{lang === 'hi' ? 'हो गया!' : 'Done!'}</span></div>
      )}
      {state === 'error' && (
        <div className={styles.errorBox}>
          <p className={styles.errorMsg}>❌ {errorMsg}</p>
          <div className={styles.errorBtns}>
            {lastAudio && <button className={styles.retryBtn} onClick={retry}>🔄 Retry</button>}
            <button className={styles.rerecordBtn} onClick={() => { setState('idle'); setLastAudio(null); }}>🎙 Re-record</button>
          </div>
        </div>
      )}
    </div>
  );
}
