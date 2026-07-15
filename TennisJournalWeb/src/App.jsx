import { useState, useEffect } from 'react';
import Login from './screens/Login';
import Home from './screens/Home';
import JournalEntry from './screens/JournalEntry';
import MatchList from './screens/MatchList';
import Schedule from './screens/Schedule';
import { supabase } from './lib/supabase';
import LangBtn from './components/LangBtn';
import './index.css';

export default function App() {
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'en');

  const changeLang = (l) => { setLang(l); localStorage.setItem('lang', l); };
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [screen, setScreen] = useState('home');
  const [editMatch, setEditMatch] = useState(null);

  const navigate = (s, match = null) => { setEditMatch(match); setScreen(s); };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (loading) return (
    <div style={{ color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontSize: 18 }}>
      Loading...
    </div>
  );

  if (!user) return <Login lang={lang} setLang={changeLang} />;

  if (screen === 'journal') return <JournalEntry lang={lang} setLang={changeLang} user={user} onNavigate={navigate} editMatch={editMatch} />;
  if (screen === 'matches') return <MatchList user={user} onNavigate={navigate} lang={lang} setLang={changeLang} />;
  if (screen === 'schedule') return <Schedule user={user} lang={lang} setLang={changeLang} onNavigate={navigate} />;
  if (screen === 'analytics') return <Analytics onNavigate={navigate} lang={lang} setLang={changeLang} />;

  return <Home user={user} lang={lang} setLang={changeLang} onNavigate={navigate} />;
}

function Analytics({ onNavigate, lang, setLang }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignSelf: 'flex-start' }}>
        <button onClick={() => onNavigate('home')} style={{ background: 'none', border: 'none', color: '#3d8ef0', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>← Back</button>
        <LangBtn lang={lang} setLang={setLang} />
      </div>
      <span style={{ fontSize: 64 }}>📊</span>
      <h2 style={{ fontSize: 24, fontWeight: 800 }}>Analytics</h2>
      <p style={{ color: '#6b85a8', textAlign: 'center', lineHeight: 1.6 }}>
        Coming in Phase 2 — win/loss trends, surface performance, mood patterns and more.
      </p>
    </div>
  );
}
