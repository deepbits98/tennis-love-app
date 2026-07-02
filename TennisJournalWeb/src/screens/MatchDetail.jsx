import styles from './MatchDetail.module.css';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function formatDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}-${MONTHS[parseInt(m)-1]}-${y}`;
}

const MOOD_EMOJI = { 10:'😤', 25:'😞', 40:'😐', 55:'🙂', 75:'😊', 95:'🏆' };
const MOOD_LABEL = { 10:'Frustrated', 25:'Low', 40:'Meh', 55:'Okay', 75:'Happy', 95:'Elated' };
const SURFACE_ICON = { hard:'🔵', clay:'🟠', grass:'🟢' };

function closestMood(score) {
  const scores = [10,25,40,55,75,95];
  return scores.reduce((a,b) => Math.abs(b-score) < Math.abs(a-score) ? b : a);
}

function Row({ label, value }) {
  if (!value) return null;
  return (
    <div className={styles.row}>
      <span className={styles.rowLabel}>{label}</span>
      <span className={styles.rowValue}>{value}</span>
    </div>
  );
}

export default function MatchDetail({ match: m, onBack }) {
  const mood = m.mood_score ? closestMood(m.mood_score) : null;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onBack}>← Back</button>
        <h1 className={styles.title}>Match Details</h1>
        <div style={{ width: 60 }} />
      </div>

      <div className={styles.content}>

        {/* Hero card */}
        <div className={styles.heroCard}>
          <div className={styles.heroTop}>
            <div>
              <p className={styles.heroDate}>{formatDate(m.match_date)}</p>
              {m.opponent_name_raw && <p className={styles.heroOpponent}>vs {m.opponent_name_raw}</p>}
              {m.score && <p className={styles.heroScore}>{m.score}</p>}
            </div>
            <div className={styles.heroRight}>
              {mood && <span className={styles.heroEmoji}>{MOOD_EMOJI[mood]}</span>}
              {m.outcome && (
                <span className={`${styles.outcomeBadge} ${m.outcome === 'win' ? styles.win : styles.loss}`}>
                  {m.outcome === 'win' ? 'WIN' : 'LOSS'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Match info */}
        <div className={styles.section}>
          <p className={styles.sectionTitle}>Match Info</p>
          <div className={styles.sectionCard}>
            <Row label="Date" value={formatDate(m.match_date)} />
            <Row label="Surface" value={m.surface ? `${SURFACE_ICON[m.surface] || ''} ${m.surface}` : null} />
            <Row label="City" value={m.city} />
            <Row label="Venue" value={m.venue} />
            <Row label="Session" value={m.session_type} />
            <Row label="Level" value={m.tournament_level} />
          </div>
        </div>

        {/* Mood */}
        {mood && (
          <div className={styles.section}>
            <p className={styles.sectionTitle}>Mood</p>
            <div className={styles.sectionCard}>
              <div className={styles.moodRow}>
                <span style={{ fontSize: 32 }}>{MOOD_EMOJI[mood]}</span>
                <span className={styles.moodLabel}>{MOOD_LABEL[mood]}</span>
                <span className={styles.moodScore}>Score: {m.mood_score}</span>
              </div>
            </div>
          </div>
        )}

        {/* Notes */}
        {(m.went_well || m.didnt_work) && (
          <div className={styles.section}>
            <p className={styles.sectionTitle}>Notes</p>
            <div className={styles.sectionCard}>
              {m.went_well && (
                <div className={styles.noteBlock}>
                  <p className={styles.noteTitle}>✅ What went well</p>
                  <p className={styles.noteBody}>{m.went_well}</p>
                </div>
              )}
              {m.went_well && m.didnt_work && <div className={styles.noteDivider} />}
              {m.didnt_work && (
                <div className={styles.noteBlock}>
                  <p className={styles.noteTitle}>⚠️ What didn't work</p>
                  <p className={styles.noteBody}>{m.didnt_work}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Body condition */}
        {m.body_condition && Object.keys(m.body_condition).length > 0 && (
          <div className={styles.section}>
            <p className={styles.sectionTitle}>Body Condition</p>
            <div className={styles.sectionCard}>
              <div className={styles.bodyGrid}>
                {Object.entries(m.body_condition).map(([part, level]) => (
                  <div key={part} className={styles.bodyPart}>
                    <span className={styles.bodyPartName}>{part}</span>
                    <span className={styles.bodyPartLevel} style={{ color: level > 2 ? '#e74c3c' : level > 1 ? '#e67e22' : '#2ecc71' }}>
                      {'●'.repeat(level)}{'○'.repeat(3 - level)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
