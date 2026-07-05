import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { t } from '../i18n';
import styles from './Login.module.css';

const MEANING = [
  { letter: 'L', word: 'Learning',    icon: '📚' },
  { letter: 'O', word: 'Observation', icon: '👁️' },
  { letter: 'V', word: 'Velocity',    icon: '⚡' },
  { letter: 'E', word: 'Execution',   icon: '🎯' },
];

export default function Login({ lang, setLang }) {
  const tr = t[lang];
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
  };

  return (
    <div className={styles.page}>
      <div className={styles.heroGlow} />
      <img src="/hero.png" alt="" className={styles.heroImage} />
      <div className={styles.heroFade} />

      <button className={styles.langBtn} onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}>
        {tr.lang}
      </button>

      <div className={styles.content}>
        <h1 className={styles.title}>
          TENNIS <span className={styles.titleAccent}>LOVE</span>
        </h1>
        <p className={styles.subtitle}>Your Match. Your Journey.</p>

        <div className={styles.meaningGrid}>
          {MEANING.map(({ letter, word, icon }) => (
            <div key={letter} className={styles.meaningItem}>
              <span className={styles.meaningIcon}>{icon}</span>
              <span className={styles.meaningLetter}>{letter}</span>
              <span className={styles.meaningWord}>{word}</span>
            </div>
          ))}
        </div>

        <button className={styles.googleBtn} onClick={handleGoogleLogin} disabled={loading}>
          <span className={styles.gIcon}>G</span>
          <span>{loading ? 'Redirecting...' : tr.signIn}</span>
        </button>

        <p className={styles.tagline}>
          {lang === 'en' ? 'Built for Indian tennis champions 🇮🇳' : 'भारतीय टेनिस चैंपियंस के लिए 🇮🇳'}
        </p>
      </div>
    </div>
  );
}
