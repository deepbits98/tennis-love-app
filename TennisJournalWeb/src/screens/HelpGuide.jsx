import { useState } from 'react';
import styles from './HelpGuide.module.css';

function getSteps(lang) {
  const hi = lang === 'hi';
  return [
    {
      num: 1,
      icon: '🏠',
      title: hi ? 'होम से शुरू करें' : 'Start from Home',
      desc: hi
        ? 'होम स्क्रीन से सब कुछ आसानी से करें। "मैच रिकॉर्ड करें" से नया मैच जोड़ें, "पिछले मैच" से इतिहास देखें, या "टूर्नामेंट कैलेंडर" से आगे की योजना बनाएं।'
        : 'The home screen gives you quick access to everything. Tap "Record Match" to log a new match, "Past Matches" to view your history, or "Tournament Calendar" to plan ahead.',
      ui: (
        <div className={styles.mockup}>
          <div className={styles.mockupLabel}>TENNIS LOVE</div>
          <div className={`${styles.mockupCard} ${styles.mockupHighlight}`}>
            <span>🎾</span>
            <div>
              <div className={styles.mockupCardTitle}>{hi ? 'मैच रिकॉर्ड करें' : 'Record Match'}</div>
              <div className={styles.mockupCardSub}>{hi ? 'नई मैच एंट्री जोड़ें' : 'Log a new match entry'}</div>
            </div>
            <span className={styles.mockupArrow}>→</span>
          </div>
          <div className={styles.mockupCard}>
            <span>📋</span>
            <div>
              <div className={styles.mockupCardTitle}>{hi ? 'पिछले मैच' : 'Past Matches'}</div>
              <div className={styles.mockupCardSub}>{hi ? 'मैच इतिहास देखें' : 'View match history'}</div>
            </div>
            <span className={styles.mockupArrow}>→</span>
          </div>
          <div className={styles.mockupCard}>
            <span>📅</span>
            <div>
              <div className={styles.mockupCardTitle}>{hi ? 'टूर्नामेंट कैलेंडर' : 'Tournament Calendar'}</div>
              <div className={styles.mockupCardSub}>{hi ? 'टूर्नामेंट और इवेंट' : 'Tournaments & events'}</div>
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
      title: hi ? 'आवाज़ से मैच रिकॉर्ड करें!' : 'Record by Voice — Just Speak!',
      desc: hi
        ? 'माइक बटन दबाएं और स्वाभाविक रूप से बोलें। जैसे: "अर्जुन के खिलाफ 6-4, 6-3 से जीता, हैदराबाद में, हार्ड कोर्ट पर। मेरी सर्विस बहुत अच्छी थी।" AI सभी जानकारी अपने आप भर देगा।'
        : 'Tap the microphone button and speak naturally. Say something like: "Won against Arjun 6-4, 6-3 at Hyderabad on a hard court. My serve was on fire but net play was weak." The AI fills everything in for you automatically.',
      ui: (
        <div className={styles.mockup}>
          <div className={styles.mockupLabel}>{hi ? 'मैच एंट्री' : 'JOURNAL ENTRY'}</div>
          <div className={styles.micArea}>
            <div className={styles.micBtn}>🎤</div>
            <div className={styles.micText}>{hi ? 'टैप करें और बोलें' : 'Tap & Speak'}</div>
          </div>
          <div className={styles.speechBubble}>
            {hi ? '"अर्जुन के खिलाफ 6-4, 6-3 से जीता हैदराबाद में…"' : '"Won against Arjun 6-4, 6-3 at Hyderabad…"'}
          </div>
          <div className={styles.arrowDown}>↓</div>
          <div className={styles.autoFill}>
            <div className={styles.fillRow}><span className={styles.fillLabel}>{hi ? 'प्रतिद्वंद्वी' : 'Opponent'}</span><span className={styles.fillVal}>Arjun</span></div>
            <div className={styles.fillRow}><span className={styles.fillLabel}>{hi ? 'स्कोर' : 'Score'}</span><span className={styles.fillVal}>6-4, 6-3</span></div>
            <div className={styles.fillRow}><span className={styles.fillLabel}>{hi ? 'शहर' : 'City'}</span><span className={styles.fillVal}>{hi ? 'हैदराबाद' : 'Hyderabad'}</span></div>
          </div>
        </div>
      ),
    },
    {
      num: 3,
      icon: '✏️',
      title: hi ? 'जांचें और सेव करें' : 'Review, Edit & Save',
      desc: hi
        ? 'AI के भरे हुए फ़ील्ड जांचें — तारीख, स्कोर, सतह, मूड। जो भी बदलना हो बदलें, फिर नीचे "सेव करें" बटन दबाएं।'
        : 'After the AI fills in the fields, scroll through to check everything — date, score, surface, mood slider, notes. Make any edits you need, then tap "Save Match" at the bottom.',
      ui: (
        <div className={styles.mockup}>
          <div className={styles.mockupLabel}>{hi ? 'मैच एंट्री' : 'JOURNAL ENTRY'}</div>
          <div className={styles.fieldRow}>
            <div className={styles.fieldBox}><div className={styles.fieldLbl}>{hi ? 'तारीख' : 'Date'}</div><div className={styles.fieldVal}>15-Jul-2026</div></div>
            <div className={styles.fieldBox}><div className={styles.fieldLbl}>{hi ? 'परिणाम' : 'Outcome'}</div><div className={`${styles.fieldVal} ${styles.fieldWin}`}>{hi ? 'जीत ✅' : 'WIN ✅'}</div></div>
          </div>
          <div className={styles.fieldRow}>
            <div className={styles.fieldBox}><div className={styles.fieldLbl}>{hi ? 'स्कोर' : 'Score'}</div><div className={styles.fieldVal}>6-4, 6-3</div></div>
            <div className={styles.fieldBox}><div className={styles.fieldLbl}>{hi ? 'सतह' : 'Surface'}</div><div className={styles.fieldVal}>🔵 {hi ? 'हार्ड' : 'Hard'}</div></div>
          </div>
          <div className={styles.moodRow}>
            <div className={styles.fieldLbl}>{hi ? 'मूड' : 'Mood'}</div>
            <div className={styles.moodBar}><div className={styles.moodFill} /></div>
            <span>😊</span>
          </div>
          <div className={styles.saveBtn}>💾 {hi ? 'सेव करें' : 'Save Match'}</div>
          <div className={styles.tapArrow}>{hi ? '← सेव करने के लिए टैप करें' : '← tap to save'}</div>
        </div>
      ),
    },
    {
      num: 4,
      icon: '🤖',
      title: hi ? 'AI सुझाव पाएं' : 'Get AI Suggestions',
      desc: hi
        ? '"पिछले मैच" से कोई भी मैच खोलें। नीचे स्क्रॉल करें और "Suggestions Report बनाएं" दबाएं। AI आपके नोट्स पढ़कर व्यक्तिगत ड्रिल प्लान और अगले सत्र का फोकस देता है।'
        : 'Open any saved match from "Past Matches". Scroll to the bottom and tap "Generate Suggestions Report". The AI reads your notes and gives you a personalized drill plan and focus area for your next training session.',
      ui: (
        <div className={styles.mockup}>
          <div className={styles.mockupLabel}>{hi ? 'मैच विवरण' : 'MATCH DETAIL'}</div>
          <div className={styles.matchCard}>
            <div className={styles.matchTop}>
              <span className={styles.matchDate}>15-Jul-2026</span>
              <span className={`${styles.outcomeTag} ${styles.winTag}`}>{hi ? 'जीत' : 'W'}</span>
            </div>
            <div className={styles.matchOpp}>{hi ? 'अर्जुन के खिलाफ' : 'vs Arjun Kumar'}</div>
            <div className={styles.matchScore}>6-4, 6-3</div>
          </div>
          <div className={styles.arrowDown} style={{ marginTop: 8 }}>↓ {hi ? 'नीचे स्क्रॉल करें' : 'scroll down'}</div>
          <div className={styles.aiSection}>
            <div className={styles.aiLabel}>🤖 {hi ? 'AI सुझाव' : 'AI SUGGESTIONS'}</div>
            <div className={`${styles.mockupHighlight} ${styles.genBtn}`}>⚡ {hi ? 'Suggestions Report बनाएं' : 'Generate Suggestions Report'}</div>
          </div>
          <div className={styles.pulseRing} style={{ bottom: 24, left: '50%', transform: 'translateX(-50%)' }} />
        </div>
      ),
    },
    {
      num: 5,
      icon: '📅',
      title: hi ? 'टूर्नामेंट कैलेंडर से योजना बनाएं' : 'Plan with Tournament Calendar',
      desc: hi
        ? 'होम से "टूर्नामेंट कैलेंडर" खोलें और आने वाले टूर्नामेंट, प्रैक्टिस सेशन, परीक्षा और आराम के दिन जोड़ें। संगठित रहें और कोई ज़रूरी इवेंट न चूकें।'
        : 'Tap "Tournament Calendar" from home to add upcoming tournaments, practice sessions, exams, and rest days. Keep your schedule organised so you never miss an important event.',
      ui: (
        <div className={styles.mockup}>
          <div className={styles.mockupLabel}>{hi ? 'टूर्नामेंट कैलेंडर' : 'TOURNAMENT CALENDAR'}</div>
          <div className={styles.calEntry} style={{ borderColor: 'rgba(251,191,36,0.4)', background: 'rgba(251,191,36,0.06)' }}>
            <span>🏆</span>
            <div>
              <div className={styles.calTitle}>{hi ? 'राज्य U14 चैम्पियनशिप' : 'State U14 Championship'}</div>
              <div className={styles.calSub}>20-Jul-2026 · {hi ? 'हैदराबाद' : 'Hyderabad'}</div>
            </div>
          </div>
          <div className={styles.calEntry} style={{ borderColor: 'rgba(56,189,248,0.3)', background: 'rgba(56,189,248,0.05)' }}>
            <span>🎯</span>
            <div>
              <div className={styles.calTitle}>{hi ? 'प्रैक्टिस सेशन' : 'Practice Session'}</div>
              <div className={styles.calSub}>18-Jul-2026 · {hi ? 'अकादमी' : 'Academy'}</div>
            </div>
          </div>
          <div className={styles.calEntry} style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)' }}>
            <span>📚</span>
            <div>
              <div className={styles.calTitle}>{hi ? 'स्कूल परीक्षा' : 'School Exam'}</div>
              <div className={styles.calSub}>22-Jul-2026</div>
            </div>
          </div>
          <div className={styles.addEntryBtn}>+ {hi ? 'इवेंट जोड़ें' : 'Add Event'}</div>
        </div>
      ),
    },
  ];
}

export default function HelpGuide({ onClose, lang = 'en' }) {
  const [step, setStep] = useState(0);
  const hi = lang === 'hi';
  const steps = getSteps(lang);
  const current = steps[step];

  return (
    <div className={styles.overlay}>
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <div className={styles.headerLeft}>
            <span className={styles.helpTag}>{hi ? 'कैसे इस्तेमाल करें' : 'How to Use'}</span>
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
          <div className={styles.stepNum}>{hi ? `चरण ${current.num}` : `Step ${current.num}`}</div>
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
            {hi ? '← वापस' : '← Back'}
          </button>
          {step < steps.length - 1 ? (
            <button className={`${styles.navBtn} ${styles.navBtnPrimary}`} onClick={() => setStep(s => s + 1)}>
              {hi ? 'आगे →' : 'Next →'}
            </button>
          ) : (
            <button className={`${styles.navBtn} ${styles.navBtnPrimary}`} onClick={onClose}>
              {hi ? 'समझ गया! ✓' : 'Got it! ✓'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
