import { useState } from 'react';
import { supabase } from '../lib/supabase';
import styles from './Onboarding.module.css';

const ROLES = [
  { key: 'player', icon: '🎾', title: 'Player', desc: 'Record matches & track your journey' },
  { key: 'parent', icon: '👨‍👦', title: 'Parent', desc: "View your child's match data" },
];

const HOW_IT_WORKS = [
  { icon: '🎤', title: 'Record a Match', text: 'After each match, speak your experience naturally — in English, Hindi, or any Indian language.' },
  { icon: '🤖', title: 'AI Suggestions', text: 'Get personalised drills, fitness routines, and tactical fixes based on your match data.' },
  { icon: '📊', title: 'Track Progress', text: 'Review all past matches and share your journey with your coach or parents.' },
  { icon: '👨‍👦', title: 'Parent Access', text: "Parents can request to view their child's data. The player approves via email." },
];

export default function Onboarding({ user, onComplete }) {
  const [role, setRole] = useState(null);
  const [displayName, setDisplayName] = useState(user.user_metadata?.full_name || '');
  const [agreed, setAgreed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleStart = async () => {
    if (!displayName.trim()) { setError('Please enter your name.'); return; }
    if (!role) { setError('Please select whether you are a Player or Parent.'); return; }
    if (!agreed) { setError('Please agree to the Terms & Conditions to continue.'); return; }

    setSaving(true);
    const { error: dbError } = await supabase.from('user_profiles').upsert({
      id: user.id,
      role,
      display_name: displayName.trim(),
      email: user.email,
      agreed_to_terms: true,
      onboarding_complete: true,
    });

    if (dbError) {
      setError('Something went wrong. Please try again.');
      setSaving(false);
      return;
    }
    onComplete(role);
  };

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.logo}>🎾 Tennis LOVE</div>
        <h1 className={styles.heading}>Welcome!</h1>
        <p className={styles.sub}>Set up your account in 30 seconds.</p>

        {/* Name */}
        <div className={styles.section}>
          <div className={styles.sectionLabel}>Your Name</div>
          <input
            className={styles.nameInput}
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            placeholder="Enter your full name"
          />
        </div>

        {/* Role */}
        <div className={styles.section}>
          <div className={styles.sectionLabel}>I am a...</div>
          <div className={styles.roleRow}>
            {ROLES.map(r => (
              <button
                key={r.key}
                className={`${styles.roleCard} ${role === r.key ? styles.roleCardSelected : ''}`}
                onClick={() => setRole(r.key)}
              >
                <span className={styles.roleIcon}>{r.icon}</span>
                <span className={styles.roleTitle}>{r.title}</span>
                <span className={styles.roleDesc}>{r.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* How it works */}
        <div className={styles.section}>
          <div className={styles.sectionLabel}>How Tennis LOVE works</div>
          <div className={styles.instructionList}>
            {HOW_IT_WORKS.map((item, i) => (
              <div key={i} className={styles.instrItem}>
                <span className={styles.instrIcon}>{item.icon}</span>
                <div>
                  <div className={styles.instrTitle}>{item.title}</div>
                  <div className={styles.instrText}>{item.text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* T&C */}
        <label className={styles.termsRow}>
          <input
            type="checkbox"
            checked={agreed}
            onChange={e => setAgreed(e.target.checked)}
            className={styles.checkbox}
          />
          <span className={styles.termsText}>
            I agree to the <span className={styles.termsLink}>Terms & Conditions</span> and Privacy Policy.
            I understand this app securely stores my tennis match data.
          </span>
        </label>

        {error && <p className={styles.error}>{error}</p>}

        <button className={styles.startBtn} onClick={handleStart} disabled={saving}>
          {saving ? 'Setting up...' : 'Get Started →'}
        </button>
      </div>
    </div>
  );
}
