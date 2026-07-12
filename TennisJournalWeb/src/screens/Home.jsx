import styles from './Home.module.css';
import LangBtn from '../components/LangBtn';
import { t } from '../i18n';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function formatDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}-${MONTHS[parseInt(m)-1]}-${y}`;
}

export default function Home({ user, lang, setLang, onNavigate }) {
  const tr = t[lang];
  const name = user.user_metadata?.full_name?.split(' ')[0] || 'Player';
  const today = formatDate(new Date().toISOString().split('T')[0]);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerInner}>
          <div>
            <p className={styles.date}>{today}</p>
            <h1 className={styles.welcome}>Hey, {name} 👋</h1>
            <p className={styles.sub}>{tr.homeSubtitle}</p>
          </div>
          <LangBtn lang={lang} setLang={setLang} />
        </div>
      </div>

      <div className={styles.cards}>
        <button className={styles.primaryCard} onClick={() => onNavigate('journal')}>
          <span className={styles.cardIcon}>🎾</span>
          <div className={styles.cardText}>
            <span className={styles.cardTitle}>{tr.recordMatch}</span>
            <span className={styles.cardSub}>{tr.recordMatchSub}</span>
          </div>
          <span className={styles.arrow}>→</span>
        </button>

        <button className={styles.card} onClick={() => onNavigate('matches')}>
          <span className={styles.cardIcon}>📋</span>
          <div className={styles.cardText}>
            <span className={styles.cardTitle}>{tr.pastMatches}</span>
            <span className={styles.cardSub}>{tr.pastMatchesSub}</span>
          </div>
          <span className={styles.arrow}>→</span>
        </button>

        <button className={styles.card} onClick={() => onNavigate('schedule')}>
          <span className={styles.cardIcon}>📅</span>
          <div className={styles.cardText}>
            <span className={styles.cardTitle}>Tournament Calendar</span>
            <span className={styles.cardSub}>Tournaments, exams & more</span>
          </div>
          <span className={styles.arrow}>→</span>
        </button>

        <button className={`${styles.card} ${styles.cardDisabled}`} onClick={() => onNavigate('analytics')}>
          <span className={styles.cardIcon}>📊</span>
          <div className={styles.cardText}>
            <span className={styles.cardTitle}>{tr.analytics}</span>
            <span className={styles.cardSub}>{tr.analyticsSub}</span>
          </div>
          <span className={styles.arrow}>→</span>
        </button>
      </div>

      <div className={styles.footer}>
        <button className={styles.signOutBtn} onClick={() => {
          import('../lib/supabase').then(({ supabase }) => {
            localStorage.setItem('lastUserName', user.user_metadata?.full_name || user.email || '');
            localStorage.setItem('lastUserEmail', user.email || '');
            localStorage.setItem('justSignedOut', '1');
            supabase.auth.signOut();
          });
        }}>{tr.signOut}</button>
      </div>
    </div>
  );
}
