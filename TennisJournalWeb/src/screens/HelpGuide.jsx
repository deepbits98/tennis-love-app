import { useState } from 'react';
import styles from './HelpGuide.module.css';

const steps = [
  {
    num: 1,
    icon: '🏠',
    title: 'Start from Home',
    desc: 'The home screen gives you quick access to everything. Tap "Record Match" to log a new match, "Past Matches" to view your history, or "Tournament Calendar" to plan ahead.',
    ui: (
      <div className={styles.mockup}>
        <div className={styles.mockupLabel}>TENNIS LOVE</div>
        <div className={`${styles.mockupCard} ${styles.mockupHighlight}`}>
          <span>🎾</span>
          <div>
            <div className={styles.mockupCardTitle}>Record Match</div>
            <div className={styles.mockupCardSub}>Log today's match</div>
          </div>
          <span className={styles.mockupArrow}>→</span>
        </div>
        <div className={styles.mockupCard}>
          <span>📋</span>
          <div>
            <div className={styles.mockupCardTitle}>Past Matches</div>
            <div className={styles.mockupCardSub}>View match history</div>
          </div>
          <span className={styles.mockupArrow}>→</span>
        </div>
        <div className={styles.mockupCard}>
          <span>📅</span>
          <div>
            <div className={styles.mockupCardTitle}>Tournament Calendar</div>
            <div className={styles.mockupCardSub}>Tournaments & events</div>
          </div>
          <span className={styles.mockupArrow}>→</span>
        </div>
        <div className={styles.pulseRing} style={{ top: 60, left: '50%', transform: 'translateX(-50%)' }} />
      </div>
    ),
  },
  {
    num: 2,
    icon: '🎤',
    title: 'Record by Voice — Just Speak!',
    desc: 'Tap the microphone button and speak naturally. Say something like: "Won against Arjun 6-4, 6-3 at Hyderabad on a hard court. My serve was on fire but net play was weak." The AI fills everything in for you automatically.',
    ui: (
      <div className={styles.mockup}>
        <div className={styles.mockupLabel}>JOURNAL ENTRY</div>
        <div className={styles.micArea}>
          <div className={styles.micBtn}>🎤</div>
          <div className={styles.micText}>Tap & Speak</div>
        </div>
        <div className={styles.speechBubble}>
          "Won against Arjun 6-4, 6-3 at Hyderabad…"
        </div>
        <div className={styles.arrowDown}>↓</div>
        <div className={styles.autoFill}>
          <div className={styles.fillRow}><span className={styles.fillLabel}>Opponent</span><span className={styles.fillVal}>Arjun</span></div>
          <div className={styles.fillRow}><span className={styles.fillLabel}>Score</span><span className={styles.fillVal}>6-4, 6-3</span></div>
          <div className={styles.fillRow}><span className={styles.fillLabel}>City</span><span className={styles.fillVal}>Hyderabad</span></div>
        </div>
      </div>
    ),
  },
  {
    num: 3,
    icon: '✏️',
    title: 'Review, Edit & Save',
    desc: 'After the AI fills in the fields, scroll through to check everything — date, score, surface, mood slider, notes. Make any edits you need, then tap "Save Match" at the bottom.',
    ui: (
      <div className={styles.mockup}>
        <div className={styles.mockupLabel}>JOURNAL ENTRY</div>
        <div className={styles.fieldRow}>
          <div className={styles.fieldBox}><div className={styles.fieldLbl}>Date</div><div className={styles.fieldVal}>15-Jul-2026</div></div>
          <div className={styles.fieldBox}><div className={styles.fieldLbl}>Outcome</div><div className={`${styles.fieldVal} ${styles.fieldWin}`}>WIN ✅</div></div>
        </div>
        <div className={styles.fieldRow}>
          <div className={styles.fieldBox}><div className={styles.fieldLbl}>Score</div><div className={styles.fieldVal}>6-4, 6-3</div></div>
          <div className={styles.fieldBox}><div className={styles.fieldLbl}>Surface</div><div className={styles.fieldVal}>🔵 Hard</div></div>
        </div>
        <div className={styles.moodRow}>
          <div className={styles.fieldLbl}>Mood</div>
          <div className={styles.moodBar}><div className={styles.moodFill} /></div>
          <span>😊</span>
        </div>
        <div className={`${styles.saveBtn}`}>💾 Save Match</div>
        <div className={styles.tapArrow}>← tap to save</div>
      </div>
    ),
  },
  {
    num: 4,
    icon: '🤖',
    title: 'Get AI Suggestions',
    desc: 'Open any saved match from "Past Matches". Scroll to the bottom and tap "Generate Suggestions Report". The AI reads your notes and gives you a personalized drill plan and focus area for your next training session.',
    ui: (
      <div className={styles.mockup}>
        <div className={styles.mockupLabel}>MATCH DETAIL</div>
        <div className={styles.matchCard}>
          <div className={styles.matchTop}>
            <span className={styles.matchDate}>15-Jul-2026</span>
            <span className={`${styles.outcomeTag} ${styles.winTag}`}>W</span>
          </div>
          <div className={styles.matchOpp}>vs Arjun Kumar</div>
          <div className={styles.matchScore}>6-4, 6-3</div>
        </div>
        <div className={styles.arrowDown} style={{ marginTop: 8 }}>↓ scroll down</div>
        <div className={styles.aiSection}>
          <div className={styles.aiLabel}>🤖 AI SUGGESTIONS</div>
          <div className={`${styles.mockupHighlight} ${styles.genBtn}`}>⚡ Generate Suggestions Report</div>
        </div>
        <div className={styles.pulseRing} style={{ bottom: 24, left: '50%', transform: 'translateX(-50%)' }} />
      </div>
    ),
  },
  {
    num: 5,
    icon: '📅',
    title: 'Plan with Tournament Calendar',
    desc: 'Tap "Tournament Calendar" from home to add upcoming tournaments, practice sessions, exams, and rest days. Keep your schedule organised so you never miss an important event.',
    ui: (
      <div className={styles.mockup}>
        <div className={styles.mockupLabel}>TOURNAMENT CALENDAR</div>
        <div className={styles.calEntry} style={{ borderColor: 'rgba(251,191,36,0.4)', background: 'rgba(251,191,36,0.06)' }}>
          <span>🏆</span>
          <div>
            <div className={styles.calTitle}>State U14 Championship</div>
            <div className={styles.calSub}>20-Jul-2026 · Hyderabad</div>
          </div>
        </div>
        <div className={styles.calEntry} style={{ borderColor: 'rgba(56,189,248,0.3)', background: 'rgba(56,189,248,0.05)' }}>
          <span>🎯</span>
          <div>
            <div className={styles.calTitle}>Practice Session</div>
            <div className={styles.calSub}>18-Jul-2026 · Academy</div>
          </div>
        </div>
        <div className={styles.calEntry} style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)' }}>
          <span>📚</span>
          <div>
            <div className={styles.calTitle}>School Exam</div>
            <div className={styles.calSub}>22-Jul-2026</div>
          </div>
        </div>
        <div className={styles.addEntryBtn}>+ Add Event</div>
      </div>
    ),
  },
];

export default function HelpGuide({ onClose }) {
  const [step, setStep] = useState(0);
  const current = steps[step];

  return (
    <div className={styles.overlay}>
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <div className={styles.headerLeft}>
            <span className={styles.helpTag}>How to Use</span>
            <span className={styles.stepCount}>{step + 1} / {steps.length}</span>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div className={styles.dots}>
          {steps.map((_, i) => (
            <button key={i} className={`${styles.dot} ${i === step ? styles.dotActive : ''}`} onClick={() => setStep(i)} />
          ))}
        </div>

        <div className={styles.content}>
          <div className={styles.stepNum}>Step {current.num}</div>
          <div className={styles.stepIcon}>{current.icon}</div>
          <h2 className={styles.stepTitle}>{current.title}</h2>
          <p className={styles.stepDesc}>{current.desc}</p>

          {current.ui}
        </div>

        <div className={styles.nav}>
          <button
            className={`${styles.navBtn} ${styles.navBtnSecondary}`}
            onClick={() => setStep(s => Math.max(0, s - 1))}
            disabled={step === 0}
          >
            ← Back
          </button>
          {step < steps.length - 1 ? (
            <button className={`${styles.navBtn} ${styles.navBtnPrimary}`} onClick={() => setStep(s => s + 1)}>
              Next →
            </button>
          ) : (
            <button className={`${styles.navBtn} ${styles.navBtnPrimary}`} onClick={onClose}>
              Got it! ✓
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
