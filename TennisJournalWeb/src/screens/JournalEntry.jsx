import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { t } from '../i18n';
import SentimeterWheel from '../components/SentimeterWheel';
import BodyCondition from '../components/BodyCondition';
import VoiceField from '../components/VoiceField';
import styles from './JournalEntry.module.css';
import LangBtn from '../components/LangBtn';

const LEVELS = ['U-14', 'U-16', 'U-18', 'AITA', 'ATF', 'ITF', 'UTR', 'TPL'];
const SURFACES = ['hard', 'clay', 'grass'];

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function formatDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}-${MONTHS[parseInt(m)-1]}-${y}`;
}

export default function JournalEntry({ lang, setLang, user, onNavigate, editMatch }) {
  const userId = user.id;
  const isEdit = !!editMatch;
  const tr = t[lang];

  function initialForm() {
    if (!editMatch) return {
      date: new Date().toISOString().split('T')[0],
      city: '', venue: '', sessionType: 'practice', tournamentLevel: '',
      surface: '', opponentFirst: '', opponentLast: '',
      outcome: '', score: '', mood: 75, wentWell: '', didntWork: '',
    };
    const [first, ...rest] = (editMatch.opponent_name_raw || '').split(' ');
    return {
      date: editMatch.match_date || new Date().toISOString().split('T')[0],
      city: editMatch.city || '', venue: editMatch.venue || '',
      sessionType: editMatch.session_type || 'practice',
      tournamentLevel: editMatch.tournament_level || '',
      surface: editMatch.surface || '',
      opponentFirst: first || '', opponentLast: rest.join(' '),
      outcome: editMatch.outcome || '', score: editMatch.score || '',
      mood: editMatch.mood_score || 75,
      wentWell: editMatch.went_well || '', didntWork: editMatch.didnt_work || '',
    };
  }

  const [form, setForm] = useState(initialForm);
  const [energy, setEnergy] = useState(editMatch?.energy_level ?? null);
  const [bodyIssues, setBodyIssues] = useState(editMatch?.body_issues ?? []);
  const [moodHint, setMoodHint] = useState('');
  const [revealed, setRevealed] = useState(isEdit);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [voiceState, setVoiceState] = useState('idle'); // idle | recording | processing
  const [opponents, setOpponents] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [cities, setCities] = useState([]);
  const [venues, setVenues] = useState([]);
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [venueSuggestions, setVenueSuggestions] = useState([]);
  const dateInputRef = useRef(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    supabase.from('opponents').select('first_name,last_name')
      .eq('user_id', userId)
      .then(({ data }) => data && setOpponents(data.map(o => `${o.first_name} ${o.last_name || ''}`.trim())));
    supabase.from('matches').select('city,venue').eq('user_id', userId)
      .then(({ data }) => {
        if (!data) return;
        setCities([...new Set(data.map(r => r.city).filter(Boolean))]);
        setVenues([...new Set(data.map(r => r.venue).filter(Boolean))]);
      });
  }, []);

  const handleOpponent = (field, val) => {
    set(field, val);
    const q = (field === 'opponentFirst' ? val : form.opponentFirst).toLowerCase();
    setSuggestions(q.length > 1 ? opponents.filter(n => n.toLowerCase().includes(q)) : []);
  };

  const pickOpponent = (name) => {
    const [first, ...rest] = name.split(' ');
    set('opponentFirst', first); set('opponentLast', rest.join(' '));
    setSuggestions([]);
  };

  const fillFromVoice = (fields) => {
    setRevealed(true);
    setVoiceState('idle');
    if (fields.match_date)     set('date', fields.match_date);
    if (fields.opponent_first) set('opponentFirst', fields.opponent_first);
    if (fields.opponent_last)  set('opponentLast', fields.opponent_last);
    if (fields.outcome)        set('outcome', fields.outcome);
    if (fields.score)          set('score', fields.score);
    if (fields.city)           set('city', fields.city);
    if (fields.venue)          set('venue', fields.venue);
    if (fields.surface)        set('surface', fields.surface);
    if (fields.session_type)   set('sessionType', fields.session_type);
    if (fields.tournament_level) set('tournamentLevel', fields.tournament_level);
    if (fields.went_well)      setForm(f => ({ ...f, wentWell: f.wentWell ? f.wentWell + '\n' + fields.went_well : fields.went_well }));
    if (fields.didnt_work)     setForm(f => ({ ...f, didntWork: f.didntWork ? f.didntWork + '\n' + fields.didnt_work : fields.didnt_work }));
    if (fields.mood_hint)      setMoodHint(fields.mood_hint);
  };

  const handleSave = async () => {
    if (!form.outcome) { alert('Please select a match outcome'); return; }
    setSaving(true);
    try {
      let opponentId = null;
      if (form.opponentFirst) {
        const normalized = `${form.opponentFirst} ${form.opponentLast}`.trim().toLowerCase();
        const { data: ex } = await supabase.from('opponents').select('id')
          .eq('user_id', userId).eq('name_normalized', normalized).maybeSingle();
        if (ex) { opponentId = ex.id; }
        else {
          const { data: newOpp } = await supabase.from('opponents').insert({
            user_id: userId, first_name: form.opponentFirst,
            last_name: form.opponentLast, name_normalized: normalized,
          }).select('id').single();
          if (newOpp) opponentId = newOpp.id;
        }
      }
      const payload = {
        match_date: form.date, city: form.city, venue: form.venue,
        session_type: form.sessionType, tournament_level: form.tournamentLevel || null,
        surface: form.surface || null, opponent_id: opponentId,
        opponent_name_raw: `${form.opponentFirst} ${form.opponentLast}`.trim(),
        outcome: form.outcome, score: form.score, mood_score: form.mood,
        energy_level: energy, body_issues: bodyIssues,
        went_well: form.wentWell, didnt_work: form.didntWork,
      };
      const { error } = isEdit
        ? await supabase.from('matches').update(payload).eq('id', editMatch.id)
        : await supabase.from('matches').insert({ user_id: userId, ...payload });
      if (error) throw error;
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) { alert('Error: ' + e.message); }
    finally { setSaving(false); }
  };

  const shareAudio = (blob) => {
    if (audioUrl) {
      const msg = encodeURIComponent(`🎾 Tennis match audio (${formatDate(form.date)}): ${audioUrl}`);
      window.open(`https://wa.me/?text=${msg}`, '_blank');
    } else {
      // Storage upload failed — download the file and prompt user to attach
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `match-${form.date}.webm`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      alert('Audio downloaded! Open WhatsApp and attach the file to send to your coach.');
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.headerLeft}>
            {onNavigate && <button onClick={() => onNavigate(isEdit ? 'matches' : 'home')} style={{ background:'none', border:'none', color:'#3d8ef0', fontSize:15, fontWeight:700, cursor:'pointer', marginRight:8, padding:'0 4px' }}>←</button>}
            <span className={styles.headerIcon}>🎾</span>
            <h1 className={styles.title}>{isEdit ? 'Edit Match' : tr.newEntry}</h1>
          </div>
          <LangBtn lang={lang} setLang={setLang} />
        </div>
      </div>

      <div className={styles.form}>

        {/* Voice banner */}
        <div className={styles.voiceBanner}>
          <VoiceField label={`🎙 ${tr.voiceInput}`} value="" onChange={() => {}}
            lang={lang} onFieldsExtracted={fillFromVoice}
            onLiveText={setLiveTranscript}
            onStateChange={setVoiceState}
            onAudioReady={(blob, url) => { setAudioBlob(blob); setAudioUrl(url); }}
            userId={userId}
            isBanner />
          <p className={styles.voiceHint}>{tr.voiceHint}</p>
          {audioBlob && (
            <button className={styles.shareBtn} onClick={() => shareAudio(audioBlob)}>
              📤 {lang === 'hi' ? 'कोच को भेजें' : 'Share with Coach'}
            </button>
          )}
        </div>

        {/* Real-time / processing panel */}
        {voiceState === 'recording' && (
          <div className={styles.liveTranscriptPanel}>
            <span className={styles.liveTranscriptDot} />
            <p className={styles.liveTranscriptText}>
              {liveTranscript || (lang === 'hi' ? 'सुन रहे हैं...' : 'Listening...')}
            </p>
          </div>
        )}
        {voiceState === 'processing' && (
          <div className={styles.processingPanel}>
            <span className={styles.processingSpinner}>✨</span>
            <p className={styles.processingPanelText}>
              {lang === 'hi' ? 'आपका मैच समझा जा रहा है...' : 'Understanding your match...'}
            </p>
          </div>
        )}

        <div className={revealed ? styles.fieldsPanel : styles.fieldsPanelHidden}>

        {/* Date + Location side by side */}
        <div className={styles.rowCards}>
          {/* Date */}
          <div className={styles.card} style={{ flex: 1 }}>
            <label className={styles.cardLabel}>{tr.date}</label>
            <div className={styles.dateDisplay} onClick={() => dateInputRef.current?.showPicker()}>
              {formatDate(form.date)}
            </div>
            <input ref={dateInputRef} type="date" value={form.date}
              onChange={e => set('date', e.target.value)} className={styles.hiddenDateInput} />
          </div>

          {/* Location */}
          <div className={styles.card} style={{ flex: 2 }}>
            <label className={styles.cardLabel}>{tr.location}</label>
            <div className={styles.row2} style={{ alignItems: 'flex-start' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <input placeholder={tr.city} value={form.city}
                  onChange={e => { set('city', e.target.value); setCitySuggestions(e.target.value.length > 0 ? cities.filter(c => c.toLowerCase().includes(e.target.value.toLowerCase())) : []); }} />
                {citySuggestions.length > 0 && (
                  <div className={styles.inlineSuggest}>
                    {citySuggestions.map(c => <button key={c} className={styles.suggestItem} onClick={() => { set('city', c); setCitySuggestions([]); }}>📍 {c}</button>)}
                  </div>
                )}
              </div>
              <div style={{ flex: 1, position: 'relative' }}>
                <input placeholder={tr.venue} value={form.venue}
                  onChange={e => { set('venue', e.target.value); setVenueSuggestions(e.target.value.length > 0 ? venues.filter(v => v.toLowerCase().includes(e.target.value.toLowerCase())) : []); }} />
                {venueSuggestions.length > 0 && (
                  <div className={styles.inlineSuggest}>
                    {venueSuggestions.map(v => <button key={v} className={styles.suggestItem} onClick={() => { set('venue', v); setVenueSuggestions([]); }}>🏟 {v}</button>)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Session type + Surface in one card */}
        <div className={styles.card}>
          <div className={styles.row2} style={{ alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <label className={styles.cardLabel}>{tr.session}</label>
              <div className={styles.pills}>
                {['practice', 'tournament'].map(s => (
                  <button key={s} onClick={() => set('sessionType', s)}
                    className={`${styles.pill} ${form.sessionType === s ? styles.pillActive : ''}`}>
                    {s === 'practice' ? tr.practice : tr.tournament}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <label className={styles.cardLabel}>{tr.surface}</label>
              <div className={styles.pills}>
                {SURFACES.map(s => (
                  <button key={s} onClick={() => set('surface', s)}
                    className={`${styles.pill} ${form.surface === s ? styles.pillActive : ''}`}>
                    {tr[s]}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {form.sessionType === 'tournament' && (
            <div style={{ marginTop: 12 }}>
              <label className={styles.cardLabel}>{tr.level}</label>
              <div className={styles.pills}>
                {LEVELS.map(l => (
                  <button key={l} onClick={() => set('tournamentLevel', l)}
                    className={`${styles.pill} ${form.tournamentLevel === l ? styles.pillActive : ''}`}>{l}</button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Opponent */}
        <div className={styles.card}>
          <label className={styles.cardLabel}>{tr.opponent}</label>
          <div className={styles.row2}>
            <input placeholder={tr.firstName} value={form.opponentFirst}
              onChange={e => handleOpponent('opponentFirst', e.target.value)} />
            <input placeholder={tr.lastName} value={form.opponentLast}
              onChange={e => handleOpponent('opponentLast', e.target.value)} />
          </div>
          {suggestions.length > 0 && (
            <div className={styles.suggestions}>
              <p className={styles.suggestHint}>{tr.previous}</p>
              {suggestions.map(n => (
                <button key={n} className={styles.suggestItem} onClick={() => pickOpponent(n)}>👤 {n}</button>
              ))}
            </div>
          )}
        </div>

        {/* Outcome */}
        <div className={styles.card}>
          <label className={styles.cardLabel}>{tr.outcome}</label>
          <div className={styles.outcomeRow}>
            <button onClick={() => set('outcome', 'win')}
              className={`${styles.outcomeBtn} ${form.outcome === 'win' ? styles.winActive : ''}`}>{tr.win}</button>
            <button onClick={() => set('outcome', 'loss')}
              className={`${styles.outcomeBtn} ${form.outcome === 'loss' ? styles.lossActive : ''}`}>{tr.loss}</button>
          </div>
          <input style={{ marginTop: 12 }} placeholder={tr.scorePlaceholder}
            value={form.score} onChange={e => set('score', e.target.value)} />
        </div>

        {/* Mood */}
        <div className={styles.card}>
          <label className={styles.cardLabel}>{tr.mood}</label>
          <SentimeterWheel onChange={v => set('mood', v)} moodHint={moodHint} />
        </div>

        {/* Physical */}
        <div className={styles.card}>
          <label className={styles.cardLabel}>{tr.physical}</label>
          <BodyCondition onEnergyChange={setEnergy} onIssuesChange={setBodyIssues} />
        </div>

        {/* Went well */}
        <div className={styles.card}>
          <VoiceField label={tr.wentWell} value={form.wentWell}
            onChange={v => set('wentWell', v)} lang={lang} inline />
        </div>

        {/* Didn't work */}
        <div className={styles.card}>
          <VoiceField label={tr.didntWork} value={form.didntWork}
            onChange={v => set('didntWork', v)} lang={lang} inline />
        </div>

        {/* Save */}
        <button className={`${styles.saveBtn} ${saved ? styles.savedBtn : ''}`}
          onClick={handleSave} disabled={saving}>
          {saving ? tr.saving : saved ? tr.saved : isEdit ? 'Save Changes 🎾' : `${tr.save} 🎾`}
        </button>

        <div style={{ height: 40 }} />
        </div>{/* end fieldsPanel */}
      </div>
    </div>
  );
}
