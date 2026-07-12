import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import LangBtn from '../components/LangBtn';
import styles from './ParentHome.module.css';

const BACKEND = 'https://tennis-love-app-production.up.railway.app';

export default function ParentHome({ user, lang, setLang, onNavigate }) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [approved, setApproved] = useState([]);
  const [pending, setPending] = useState([]);
  const [searching, setSearching] = useState(false);
  const [requestStatus, setRequestStatus] = useState({});
  const parentName = user.user_metadata?.full_name || user.email;

  useEffect(() => { loadMyChildren(); }, []);

  const loadMyChildren = async () => {
    const { data } = await supabase
      .from('parent_access_requests')
      .select('player_id, status, user_profiles!player_id(display_name, email)')
      .eq('parent_id', user.id);

    if (data) {
      setApproved(data.filter(r => r.status === 'approved'));
      setPending(data.filter(r => r.status === 'pending'));
      const map = {};
      data.forEach(r => { map[r.player_id] = r.status; });
      setRequestStatus(map);
    }
  };

  const searchPlayers = async () => {
    if (!search.trim()) return;
    setSearching(true);
    const { data } = await supabase
      .from('user_profiles')
      .select('id, display_name, email')
      .eq('role', 'player')
      .ilike('display_name', `%${search.trim()}%`)
      .limit(10);
    setResults(data || []);
    setSearching(false);
  };

  const sendRequest = async (player) => {
    setRequestStatus(s => ({ ...s, [player.id]: 'sending' }));
    try {
      const res = await fetch(`${BACKEND}/send-parent-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentId: user.id,
          parentName,
          playerId: player.id,
          playerName: player.display_name,
          playerEmail: player.email,
        }),
      });
      const data = await res.json();
      setRequestStatus(s => ({ ...s, [player.id]: data.alreadyApproved ? 'approved' : 'pending' }));
      loadMyChildren();
    } catch {
      setRequestStatus(s => ({ ...s, [player.id]: null }));
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerInner}>
          <div>
            <h1 className={styles.welcome}>Parent Dashboard</h1>
            <p className={styles.sub}>Track your child's tennis journey</p>
          </div>
          <LangBtn lang={lang} setLang={setLang} />
        </div>
      </div>

      <div className={styles.body}>

        {/* Approved children */}
        {approved.length > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionTitle}>👦 My Children</div>
            {approved.map(r => (
              <button
                key={r.player_id}
                className={styles.childCard}
                onClick={() => onNavigate('child-matches', {
                  childId: r.player_id,
                  childName: r.user_profiles?.display_name || 'Player',
                })}
              >
                <span className={styles.childIcon}>🎾</span>
                <div className={styles.childInfo}>
                  <span className={styles.childName}>{r.user_profiles?.display_name}</span>
                  <span className={styles.childSub}>Tap to view match history</span>
                </div>
                <span className={styles.arrow}>→</span>
              </button>
            ))}
          </div>
        )}

        {/* Pending */}
        {pending.length > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionTitle}>⏳ Awaiting Approval</div>
            {pending.map(r => (
              <div key={r.player_id} className={styles.pendingCard}>
                <span className={styles.childIcon}>🎾</span>
                <div className={styles.childInfo}>
                  <span className={styles.childName}>{r.user_profiles?.display_name}</span>
                  <span className={styles.childSub}>Verification email sent — waiting for player to approve</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Search */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>🔍 Find Your Child</div>
          <div className={styles.searchRow}>
            <input
              className={styles.searchInput}
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && searchPlayers()}
              placeholder="Search by player name..."
            />
            <button className={styles.searchBtn} onClick={searchPlayers} disabled={searching}>
              {searching ? '...' : 'Search'}
            </button>
          </div>

          {results.length > 0 && (
            <div className={styles.resultsList}>
              {results.map(p => {
                const status = requestStatus[p.id];
                return (
                  <div key={p.id} className={styles.resultCard}>
                    <div className={styles.resultName}>{p.display_name}</div>
                    {status === 'approved' ? (
                      <span className={styles.approvedBadge}>✓ Approved</span>
                    ) : status === 'pending' ? (
                      <span className={styles.pendingBadge}>⏳ Email sent</span>
                    ) : (
                      <button
                        className={styles.requestBtn}
                        onClick={() => sendRequest(p)}
                        disabled={status === 'sending'}
                      >
                        {status === 'sending' ? 'Sending...' : '📧 Send Verification Email'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {approved.length === 0 && pending.length === 0 && results.length === 0 && (
            <p className={styles.emptyHint}>
              Search for your child's name above. A verification email will be sent to the player — once they approve, you'll see their match data here.
            </p>
          )}
        </div>

      </div>

      <div className={styles.footer}>
        <button className={styles.signOutBtn} onClick={() => {
          import('../lib/supabase').then(({ supabase }) => {
            localStorage.setItem('lastUserName', user.user_metadata?.full_name || user.email || '');
            localStorage.setItem('lastUserEmail', user.email || '');
            localStorage.setItem('justSignedOut', '1');
            supabase.auth.signOut();
          });
        }}>Sign Out</button>
      </div>
    </div>
  );
}
