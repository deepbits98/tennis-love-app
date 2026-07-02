import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import styles from './Schedule.module.css';
import LangBtn from '../components/LangBtn';
import AddEvent from './AddEvent';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const FULL_MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function parseDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatDay(iso) {
  const d = parseDate(iso);
  return `${String(d.getDate()).padStart(2,'0')} ${DAYS[d.getDay()]}`;
}

function weekOfMonth(iso) {
  const d = parseDate(iso);
  return `W${Math.ceil(d.getDate() / 7)}`;
}

const EVENT_COLORS = {
  tournament: { bg: 'linear-gradient(135deg, rgba(61,142,240,0.18), rgba(26,92,188,0.12))',  border: 'rgba(61,142,240,0.3)',  dot: '#3d8ef0', icon: '🎾' },
  exam:       { bg: 'linear-gradient(135deg, rgba(231,76,60,0.18), rgba(180,30,20,0.1))',    border: 'rgba(231,76,60,0.3)',   dot: '#e74c3c', icon: '📚' },
  coaching:   { bg: 'linear-gradient(135deg, rgba(46,204,113,0.18), rgba(20,150,80,0.1))',   border: 'rgba(46,204,113,0.3)',  dot: '#2ecc71', icon: '🏋️' },
  trial:      { bg: 'linear-gradient(135deg, rgba(155,89,182,0.18), rgba(100,40,140,0.1))',  border: 'rgba(155,89,182,0.3)', dot: '#9b59b6', icon: '🏅' },
  travel:     { bg: 'linear-gradient(135deg, rgba(245,200,66,0.18), rgba(255,107,53,0.12))', border: 'rgba(245,200,66,0.3)',  dot: '#f5c842', icon: '✈️' },
  school:     { bg: 'linear-gradient(135deg, rgba(241,196,15,0.18), rgba(200,150,0,0.1))',   border: 'rgba(241,196,15,0.3)',  dot: '#f1c40f', icon: '🏫' },
  fitness:    { bg: 'linear-gradient(135deg, rgba(26,188,156,0.18), rgba(10,130,100,0.1))',  border: 'rgba(26,188,156,0.3)',  dot: '#1abc9c', icon: '💪' },
  other:      { bg: 'linear-gradient(135deg, rgba(149,165,166,0.15), rgba(80,100,110,0.1))', border: 'rgba(149,165,166,0.25)',dot: '#95a5a6', icon: '📌' },
};

const TODAY = new Date().toISOString().split('T')[0];

function groupEvents(events) {
  const byYear = {};
  events.forEach(e => {
    const [y, m] = e.start_date.split('-');
    if (!byYear[y]) byYear[y] = {};
    if (!byYear[y][m]) byYear[y][m] = {};
    if (!byYear[y][m][e.start_date]) byYear[y][m][e.start_date] = [];
    byYear[y][m][e.start_date].push(e);
  });
  return byYear;
}

export default function Schedule({ user, lang, setLang, onNavigate }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editEvent, setEditEvent] = useState(null);

  const fetchEvents = () => {
    supabase.from('events')
      .select('*')
      .eq('user_id', user.id)
      .order('start_date', { ascending: true })
      .order('created_at', { ascending: true })
      .then(({ data }) => { setEvents(data || []); setLoading(false); });
  };

  useEffect(() => { fetchEvents(); }, []);

  const handleSaved = () => { setShowAdd(false); setEditEvent(null); fetchEvents(); };

  if (showAdd || editEvent) {
    return <AddEvent user={user} lang={lang} event={editEvent}
      onSaved={handleSaved} onCancel={() => { setShowAdd(false); setEditEvent(null); }} />;
  }

  const grouped = groupEvents(events);
  const years = Object.keys(grouped).sort();

  // Find today's position for "today" marker
  const todayMarker = TODAY;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerInner}>
          <button className={styles.backBtn} onClick={() => onNavigate('home')}>← Back</button>
          <h1 className={styles.title}>Tournament Calendar</h1>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <LangBtn lang={lang} setLang={setLang} />
            <button className={styles.addBtn} onClick={() => setShowAdd(true)}>+ Add</button>
          </div>
        </div>
      </div>

      <div className={styles.timeline}>
        {loading && <p className={styles.empty}>Loading...</p>}

        {!loading && events.length === 0 && (
          <div className={styles.emptyState}>
            <span style={{ fontSize: 52 }}>📅</span>
            <p>No events yet.</p>
            <button className={styles.emptyBtn} onClick={() => setShowAdd(true)}>Add your first event</button>
          </div>
        )}

        {years.map(year => (
          <div key={year}>
            <div className={styles.yearHeader}>{year}</div>

            {Object.keys(grouped[year]).sort().map(month => (
              <div key={month}>
                <div className={styles.monthHeader}>
                  {FULL_MONTHS[parseInt(month) - 1]}
                </div>

                {Object.keys(grouped[year][month]).sort().map(date => {
                  const dayEvents = grouped[year][month][date];
                  const isToday = date === todayMarker;
                  const isPast = date < todayMarker;
                  const tournamentConflict = dayEvents.filter(e => e.event_type === 'tournament').length > 1;

                  return (
                    <div key={date} className={styles.dayRow}>
                      <div className={`${styles.dayLabel} ${isToday ? styles.todayLabel : ''} ${isPast ? styles.pastLabel : ''}`}>
                        {isToday && <span className={styles.todayDot} />}
                        {formatDay(date)}
                        <span className={styles.weekNum}>{weekOfMonth(date)}</span>
                        {tournamentConflict && <span className={styles.conflictIcon} title="Multiple tournaments on this day">⚠️</span>}
                      </div>

                      <div className={styles.dayEvents}>
                        {dayEvents.map(ev => {
                          const c = EVENT_COLORS[ev.event_type] || EVENT_COLORS.other;
                          const isWithdrawSoon = ev.withdrawal_date &&
                            Math.ceil((parseDate(ev.withdrawal_date) - new Date()) / 86400000) <= 3 &&
                            ev.withdrawal_date >= TODAY;

                          return (
                            <div key={ev.id}
                              className={`${styles.eventCard} ${isPast ? styles.pastCard : ''}`}
                              style={{ backgroundImage: c.bg, borderColor: c.border }}
                              onClick={() => setEditEvent(ev)}>
                              <div className={styles.eventLeft}>
                                <span className={styles.eventDot} style={{ background: c.dot }} />
                                <div>
                                  <div className={styles.eventTitle}>
                                    {c.icon} {ev.title}
                                  </div>
                                  <div className={styles.eventMeta}>
                                    {ev.age_category && <span className={styles.tag}>{ev.age_category}</span>}
                                    {ev.city && <span className={styles.tag}>📍 {ev.city}</span>}
                                    {ev.end_date && ev.end_date !== ev.start_date && (
                                      <span className={styles.tag}>until {formatDay(ev.end_date)}</span>
                                    )}
                                  </div>
                                  {isWithdrawSoon && (
                                    <div className={styles.withdrawWarning}>
                                      ⚠️ Withdrawal deadline: {formatDay(ev.withdrawal_date)}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        ))}

        <div style={{ height: 60 }} />
      </div>

      {/* Floating add button */}
      <button className={styles.fab} onClick={() => setShowAdd(true)}>+</button>
    </div>
  );
}
