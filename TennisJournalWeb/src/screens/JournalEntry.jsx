import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { t } from '../i18n';
import SentimeterWheel from '../components/SentimeterWheel';
import BodyCondition from '../components/BodyCondition';
import VoiceField from '../components/VoiceField';
import AnalysisCard from '../components/AnalysisCard';
import styles from './JournalEntry.module.css';
import LangBtn from '../components/LangBtn';

const BACKEND = 'https://tennis-love-app-production.up.railway.app';
const LEVELS = ['U-14', 'U-16', 'U-18', 'AITA', 'ATF', 'ITF', 'UTR', 'TPL'];
const SURFACES = ['hard', 'clay', 'grass'];

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function formatDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}-${MONTHS[parseInt(m)-1]}-${y}`;
}

const PERF_AREAS = [
  { key: 'shots',     emoji: '🎾', label: 'SHOTS',       placeholder: 'e.g. forehand cross-court, first serve, backhand slice...' },
  { key: 'mentality', emoji: '🧠', label: 'MENTALITY',   placeholder: 'e.g. stayed calm in tiebreak, good decision-making...' },
  { key: 'physical',  emoji: '💪', label: 'PHYSICALITY', placeholder: 'e.g. great movement, strong stamina, quick feet...' },
  { key: 'tactics',   emoji: '🎯', label: 'TACTICS',     placeholder: 'e.g. used angles well, good net approach, varied pace...' },
];

function parseSubfields(text) {
  const r = { shots: '', mentality: '', physical: '', tactics: '' };
  if (!text) return r;
  r.shots     = (text.match(/Shots:\s*([^\n]+)/)       || [])[1]?.trim() || '';
  r.mentality = (text.match(/Mentality:\s*([^\n]+)/)   || [])[1]?.trim() || '';
  r.physical  = (text.match(/Physicality:\s*([^\n]+)/) || [])[1]?.trim() || '';
  r.tactics   = (text.match(/Tactics:\s*([^\n]+)/)     || [])[1]?.trim() || '';
  if (!r.shots && !r.mentality && !r.physical && !r.tactics) r.shots = text;
  return r;
}

function combineSubfields(subs) {
  const parts = [];
  if (subs.shots?.trim())     parts.push(`🎾 Shots: ${subs.shots.trim()}`);
  if (subs.mentality?.trim()) parts.push(`🧠 Mentality: ${subs.mentality.trim()}`);
  if (subs.physical?.trim())  parts.push(`💪 Physicality: ${subs.physical.trim()}`);
  if (subs.tactics?.trim())   parts.push(`🎯 Tactics: ${subs.tactics.trim()}`);
  return parts.join('\n');
}

function formatAnalysisForWhatsApp(a, form) {
  const lines = [
    `🎾 TENNIS MATCH ANALYSIS`,
    `${formatDate(form.date)} | ${(form.outcome || '').toUpperCase()} ${form.score ? `(${form.score})` : ''}`,
    ``,
    `📊 SUMMARY`,
    a.summary,
    ``,
    `⚡ PRIORITY FIXES`,
    ...(a.priorityFixes || []).map((p, i) => `${i+1}. ${p.area}: ${p.fix}`),
    ``,
    `🎾 DRILLS`,
    ...(a.drills || []).map((d, i) => `${i+1}. ${d.name} (${d.duration}, ${d.frequency})\n   ${d.description}`),
    ``,
    `💪 FITNESS`,
    ...(a.fitness || []).map((f, i) => `${i+1}. ${f.name} — ${f.sets}\n   ${f.description}`),
    ``,
    `🎯 TACTICAL ADJUSTMENTS`,
    ...(a.tacticalAdjustments || []).map(adj => `• ${adj}`),
    ``,
    `📌 WEEK FOCUS`,
    a.weekFocus,
  ];
  return lines.join('\n');
}

function FeedbackSection({ sectionKey, title, color, form, onSet }) {
  const prefix = sectionKey === 'well' ? 'wentWell' : 'didntWork';
  return (
    <div className={styles.card}>
      <div className={styles.feedbackHeader}>
        <span className={styles.feedbackTitle} style={{ color }}>{title}</span>
      </div>
      {PERF_AREAS.map(area => {
        const fieldKey = prefix + area.key.charAt(0).toUpperCase() + area.key.slice(1);
        const improvePlaceholder = area.key === 'shots'
          ? 'e.g. second serve double faults, backhand under pressure...'
          : area.key === 'mentality'
          ? 'e.g. got frustrated after errors, lost focus in 3rd set...'
          : area.key === 'physical'
          ? 'e.g. tired in final set, slow to recover between points...'
          : "e.g. too predictable, kept hitting to opponent's strength...";
        return (
          <div key={area.key} className={styles.subSection}>
            <label className={styles.subLabel}>
              <span className={styles.subEmoji}>{area.emoji}</span>
              {area.label}
            </label>
            <textarea
              className={styles.subTextarea}
              value={form[fieldKey]}
              onChange={e => onSet(fieldKey, e.target.value)}
              placeholder={sectionKey === 'well' ? area.placeholder : improvePlaceholder}
              rows={2}
            />
          </div>
        );
      })}
    </div>
  );
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
      outcome: '', score: '', mood: 75,
      firstServePct: '', doubleFaults: '', unforcedErrors: '',
      wentWellShots: '', wentWellMentality: '', wentWellPhysical: '', wentWellTactics: '',
      didntWorkShots: '', didntWorkMentality: '', didntWorkPhysical: '', didntWorkTactics: '',
    };
    const [first, ...rest] = (editMatch.opponent_name_raw || '').split(' ');
    const wellSubs = parseSubfields(editMatch.went_well || '');
    const improveSubs = parseSubfields(editMatch.didnt_work || '');
    return {
      date: editMatch.match_date || new Date().toISOString().split('T')[0],
      city: editMatch.city || '', venue: editMatch.venue || '',
      sessionType: editMatch.session_type || 'practice',
      tournamentLevel: editMatch.tournament_level || '',
      surface: editMatch.surface || '',
      opponentFirst: first || '', opponentLast: rest.join(' '),
      outcome: editMatch.outcome || '', score: editMatch.score || '',
      mood: editMatch.mood_score || 75,
      firstServePct: editMatch.first_serve_pct != null ? String(editMatch.first_serve_pct) : '',
      doubleFaults: editMatch.double_faults != null ? String(editMatch.double_faults) : '',
      unforcedErrors: editMatch.unforced_errors != null ? String(editMatch.unforced_errors) : '',
      wentWellShots: wellSubs.shots, wentWellMentality: wellSubs.mentality,
      wentWellPhysical: wellSubs.physical, wentWellTactics: wellSubs.tactics,
      didntWorkShots: improveSubs.shots, didntWorkMentality: improveSubs.mentality,
      didntWorkPhysical: improveSubs.physical, didntWorkTactics: improveSubs.tactics,
    };
  }

  const [form, setForm] = useState(initialForm);
  const [energy, setEnergy] = useState(editMatch?.energy_level ?? null);
  const [bodyIssues, setBodyIssues] = useState(editMatch?.body_issues ?? []);
  const [moodHint, setMoodHint] = useState('');
  const [revealed, setRevealed] = useState(isEdit);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [voiceState, setVoiceState] = useState('idle');
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
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const dateInputRef = useRef(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    if (editMatch?.coaching_report) {
      try { setAnalysis(JSON.parse(editMatch.coaching_report)); } catch {}
    }
  }, []);

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
    if (fields.match_date)       set('date', fields.match_date);
    if (fields.opponent_first)   set('opponentFirst', fields.opponent_first);
    if (fields.opponent_last)    set('opponentLast', fields.opponent_last);
    if (fields.outcome)          set('outcome', fields.outcome);
    if (fields.score)            set('score', fields.score);
    if (fields.city)             set('city', fields.city);
    if (fields.venue)            set('venue', fields.venue);
    if (fields.surface)          set('surface', fields.surface);
    if (fields.session_type)     set('sessionType', fields.session_type);
    if (fields.tournament_level) set('tournamentLevel', fields.tournament_level);
    if (fields.mood_hint)        setMoodHint(fields.mood_hint);
    if (fields.first_serve_pct != null && fields.first_serve_pct !== '') set('firstServePct', String(fields.first_serve_pct));
    if (fields.double_faults    != null && fields.double_faults    !== '') set('doubleFaults',  String(fields.double_faults));
    if (fields.unforced_errors  != null && fields.unforced_errors  !== '') set('unforcedErrors', String(fields.unforced_errors));

    if (fields.shots_well)        setForm(f => ({ ...f, wentWellShots:      f.wentWellShots      ? f.wentWellShots      + '; ' + fields.shots_well        : fields.shots_well }));
    if (fields.mentality_well)    setForm(f => ({ ...f, wentWellMentality:  f.wentWellMentality  ? f.wentWellMentality  + '; ' + fields.mentality_well    : fields.mentality_well }));
    if (fields.physical_well)     setForm(f => ({ ...f, wentWellPhysical:   f.wentWellPhysical   ? f.wentWellPhysical   + '; ' + fields.physical_well     : fields.physical_well }));
    if (fields.tactics_well)      setForm(f => ({ ...f, wentWellTactics:    f.wentWellTactics    ? f.wentWellTactics    + '; ' + fields.tactics_well      : fields.tactics_well }));
    if (fields.shots_improve)     setForm(f => ({ ...f, didntWorkShots:     f.didntWorkShots     ? f.didntWorkShots     + '; ' + fields.shots_improve     : fields.shots_improve }));
    if (fields.mentality_improve) setForm(f => ({ ...f, didntWorkMentality: f.didntWorkMentality ? f.didntWorkMentality + '; ' + fields.mentality_improve : fields.mentality_improve }));
    if (fields.physical_improve)  setForm(f => ({ ...f, didntWorkPhysical:  f.didntWorkPhysical  ? f.didntWorkPhysical  + '; ' + fields.physical_improve  : fields.physical_improve }));
    if (fields.tactics_improve)   setForm(f => ({ ...f, didntWorkTactics:   f.didntWorkTactics   ? f.didntWorkTactics   + '; ' + fields.tactics_improve   : fields.tactics_improve }));
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
        first_serve_pct: form.firstServePct !== '' ? Number(form.firstServePct) : null,
        double_faults:   form.doubleFaults   !== '' ? Number(form.doubleFaults)   : null,
        unforced_errors: form.unforcedErrors  !== '' ? Number(form.unforcedErrors)  : null,
        went_well: combineSubfields({
          shots: form.wentWellShots, mentality: form.wentWellMentality,
          physical: form.wentWellPhysical, tactics: form.wentWellTactics,
        }),
        didnt_work: combineSubfields({
          shots: form.didntWorkShots, mentality: form.didntWorkMentality,
          physical: form.didntWorkPhysical, tactics: form.didntWorkTactics,
        }),
        coaching_report: analysis ? JSON.stringify(analysis) : null,
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
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `match-${form.date}.webm`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      alert('Audio downloaded! Open WhatsApp and attach the file to send to your coach.');
    }
  };

  const generateAnalysis = async () => {
    setAnalyzing(true);
    setAnalysis(null);
    try {
      const res = await fetch(`${BACKEND}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outcome: form.outcome, score: form.score,
          surface: form.surface, sessionType: form.sessionType,
          tournamentLevel: form.tournamentLevel, mood: form.mood,
          firstServePct:  form.firstServePct  !== '' ? Number(form.firstServePct)  : null,
          doubleFaults:   form.doubleFaults   !== '' ? Number(form.doubleFaults)   : null,
          unforcedErrors: form.unforcedErrors !== '' ? Number(form.unforcedErrors) : null,
          wentWellShots:      form.wentWellShots,
          wentWellMentality:  form.wentWellMentality,
          wentWellPhysical:   form.wentWellPhysical,
          wentWellTactics:    form.wentWellTactics,
          didntWorkShots:     form.didntWorkShots,
          didntWorkMentality: form.didntWorkMentality,
          didntWorkPhysical:  form.didntWorkPhysical,
          didntWorkTactics:   form.didntWorkTactics,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAnalysis(data);
    } catch (e) {
      alert('Analysis failed: ' + e.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const shareAnalysis = () => {
    if (!analysis) return;
    const text = formatAnalysisForWhatsApp(analysis, form);
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
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

        {/* Date */}
        <div className={styles.card}>
          <label className={styles.cardLabel}>{tr.date}</label>
          <div className={styles.dateDisplay} onClick={() => dateInputRef.current?.showPicker()}>
            {formatDate(form.date)}
          </div>
          <input ref={dateInputRef} type="date" value={form.date}
            onChange={e => set('date', e.target.value)} className={styles.hiddenDateInput} />
        </div>

        {/* Location */}
        <div className={styles.card}>
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

        {/* Session + Surface */}
        <div className={styles.card}>
          <label className={styles.cardLabel}>{tr.session}</label>
          <div className={styles.pills}>
            {['practice', 'tournament'].map(s => (
              <button key={s} onClick={() => set('sessionType', s)}
                className={`${styles.pill} ${form.sessionType === s ? styles.pillActive : ''}`}>
                {s === 'practice' ? tr.practice : tr.tournament}
              </button>
            ))}
          </div>
          {form.sessionType === 'tournament' && (
            <div style={{ marginTop: 14 }}>
              <label className={styles.cardLabel}>{tr.level}</label>
              <div className={styles.pills}>
                {LEVELS.map(l => (
                  <button key={l} onClick={() => set('tournamentLevel', l)}
                    className={`${styles.pill} ${form.tournamentLevel === l ? styles.pillActive : ''}`}>{l}</button>
                ))}
              </div>
            </div>
          )}
          <div style={{ marginTop: 14 }}>
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

        {/* Match Stats */}
        <div className={styles.card}>
          <label className={styles.cardLabel}>📊 MATCH STATS</label>
          <p className={styles.statsHint}>Approximate is fine — fill in what you remember</p>
          <div className={styles.statsGrid}>
            <div className={styles.statField}>
              <label className={styles.statLabel}>First Serve %</label>
              <div className={styles.statInputWrap}>
                <input
                  type="number" min="0" max="100"
                  className={styles.statInput}
                  placeholder="e.g. 60"
                  value={form.firstServePct}
                  onChange={e => set('firstServePct', e.target.value)}
                />
                <span className={styles.statUnit}>%</span>
              </div>
            </div>
            <div className={styles.statField}>
              <label className={styles.statLabel}>Double Faults</label>
              <input
                type="number" min="0"
                className={styles.statInput}
                placeholder="e.g. 3"
                value={form.doubleFaults}
                onChange={e => set('doubleFaults', e.target.value)}
              />
            </div>
            <div className={styles.statField}>
              <label className={styles.statLabel}>Unforced Errors</label>
              <input
                type="number" min="0"
                className={styles.statInput}
                placeholder="e.g. 15"
                value={form.unforcedErrors}
                onChange={e => set('unforcedErrors', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* What went well */}
        <FeedbackSection sectionKey="well" title="✅ WHAT WENT WELL" color="#ccff00" form={form} onSet={set} />

        {/* What needs work */}
        <FeedbackSection sectionKey="improve" title="🔧 WHAT NEEDS WORK" color="#ff6b35" form={form} onSet={set} />

        {/* AI Coaching Analysis */}
        <div className={styles.analysisOuter}>
          <div className={styles.analysisTriggerHeader}>
            <span className={styles.analysisTriggerTitle}>🤖 AI COACHING ANALYSIS</span>
            <span className={styles.analysisBetaBadge}>AI</span>
          </div>
          <p className={styles.analysisTriggerHint}>
            Get a personalised technical report — specific drills, fitness routines, and tactical fixes based on your match data above.
          </p>
          <button
            className={styles.generateBtn}
            onClick={generateAnalysis}
            disabled={analyzing}
          >
            {analyzing ? '✨ Analysing your match...' : '⚡ Generate Coaching Report'}
          </button>
          {analysis && <AnalysisCard analysis={analysis} onShare={shareAnalysis} />}
        </div>

        {/* Save */}
        <button className={`${styles.saveBtn} ${saved ? styles.savedBtn : ''}`}
          onClick={handleSave} disabled={saving}>
          {saving ? tr.saving : saved ? tr.saved : isEdit ? 'Save Changes 🎾' : `${tr.save} 🎾`}
        </button>

        <div style={{ height: 40 }} />
        </div>
      </div>
    </div>
  );
}
