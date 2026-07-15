import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import styles from './MatchList.module.css';
import LangBtn from '../components/LangBtn';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function formatDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}-${MONTHS[parseInt(m)-1]}-${y}`;
}

const MOOD_EMOJI = { 10:'😤', 25:'😞', 40:'😐', 55:'🙂', 75:'😊', 95:'🏆' };
const SURFACE_ICON = { hard:'🔵', clay:'🟠', grass:'🟢' };

function closestMoodEmoji(score) {
  const scores = [10,25,40,55,75,95];
  const closest = scores.reduce((a,b) => Math.abs(b-score) < Math.abs(a-score) ? b : a);
  return MOOD_EMOJI[closest];
}

export default function MatchList({ user, onNavigate, lang, setLang }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('matches')
      .select('*')
      .eq('user_id', user.id)
      .order('match_date', { ascending: false })
      .then(({ data }) => { setMatches(data || []); setLoading(false); });
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerInner}>
          <button className={styles.backBtn} onClick={() => onNavigate('home')}>← Back</button>
          <h1 className={styles.title}>Past Matches</h1>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <LangBtn lang={lang} setLang={setLang} />
            <button className={styles.newBtn} onClick={() => onNavigate('journal')}>+ New</button>
          </div>
        </div>
      </div>

      <div className={styles.list}>
        {loading && <p className={styles.empty}>Loading...</p>}

        {!loading && matches.length === 0 && (
          <div className={styles.emptyState}>
            <span style={{ fontSize: 48 }}>🎾</span>
            <p>No matches recorded yet.</p>
            <button className={styles.startBtn} onClick={() => onNavigate('journal')}>
              Record your first match
            </button>
          </div>
        )}

        {matches.map(m => (
          <div key={m.id} className={styles.card} onClick={() => onNavigate('journal', m)} style={{ cursor: 'pointer' }}>
            <div className={styles.cardTop}>
              <div className={styles.dateWrap}>
                <span className={styles.date}>{formatDate(m.match_date)}</span>
                {m.surface && <span className={styles.surface}>{SURFACE_ICON[m.surface]} {m.surface}</span>}
              </div>
              <div className={styles.badges}>
                {m.mood_score && <span className={styles.mood}>{closestMoodEmoji(m.mood_score)}</span>}
                {m.outcome && (
                  <span className={`${styles.outcome} ${m.outcome === 'win' ? styles.win : styles.loss}`}>
                    {m.outcome === 'win' ? 'W' : 'L'}
                  </span>
                )}
              </div>
            </div>

            {m.opponent_name_raw && (
              <p className={styles.opponent}>vs {m.opponent_name_raw}</p>
            )}

            {m.score && <p className={styles.score}>{m.score}</p>}

            <div className={styles.tags}>
              {m.city && <span className={styles.tag}>📍 {m.city}</span>}
              {m.session_type && <span className={styles.tag}>{m.session_type === 'tournament' ? '🏆' : '🎯'} {m.session_type}</span>}
              {m.tournament_level && <span className={styles.tag}>{m.tournament_level}</span>}
            </div>

            {m.went_well && (
              <div className={styles.note}>
                <span className={styles.noteIcon}>✅</span>
                <span className={styles.noteText}>{m.went_well}</span>
              </div>
            )}
            {m.didnt_work && (
              <div className={styles.note}>
                <span className={styles.noteIcon}>⚠️</span>
                <span className={styles.noteText}>{m.didnt_work}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
