import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { t } from '../i18n';
import styles from './Login.module.css';

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
      <button className={styles.langBtn} onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}>{tr.lang}</button>

      <div className={styles.center}>
        <div className={styles.logo}>🎾</div>
        <h1 className={styles.title}>{tr.appName}</h1>
        <p className={styles.subtitle}>{tr.subtitle}</p>

        <div className={styles.courtDecor}>
          <div className={styles.line} />
          <div className={styles.circle} />
          <div className={styles.line} />
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
