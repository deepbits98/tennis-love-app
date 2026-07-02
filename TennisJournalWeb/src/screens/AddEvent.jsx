import { useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import styles from './AddEvent.module.css';

const EVENT_TYPES = [
  { value: 'tournament', label: '🎾 Tournament' },
  { value: 'exam',       label: '📚 Exam' },
  { value: 'coaching',   label: '🏋️ Coaching / Camp' },
  { value: 'trial',      label: '🏅 Trial / Selection' },
  { value: 'travel',     label: '✈️ Travel' },
  { value: 'school',     label: '🏫 School Event' },
  { value: 'fitness',    label: '💪 Fitness Test' },
  { value: 'other',      label: '📌 Other' },
];

const AGE_CATS = ['U-10', 'U-12', 'U-14', 'U-16', 'U-18', 'Open', "Men's", "Women's"];

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function formatDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}-${MONTHS[parseInt(m)-1]}-${y}`;
}

export default function AddEvent({ user, lang, event: editEvent, onSaved, onCancel }) {
  const isEdit = !!editEvent;
  const [form, setForm] = useState({
    event_type: editEvent?.event_type || 'tournament',
    title: editEvent?.title || '',
    start_date: editEvent?.start_date || new Date().toISOString().split('T')[0],
    end_date: editEvent?.end_date || '',
    age_category: editEvent?.age_category || '',
    city: editEvent?.city || '',
    venue: editEvent?.venue || '',
    withdrawal_date: editEvent?.withdrawal_date || '',
    notes: editEvent?.notes || '',
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const startRef = useRef(null);
  const endRef = useRef(null);
  const withdrawRef = useRef(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.title.trim()) { alert('Please enter an event name'); return; }
    if (!form.start_date) { alert('Please enter a start date'); return; }
    setSaving(true);
    try {
      const payload = {
        event_type: form.event_type,
        title: form.title.trim(),
        start_date: form.start_date,
        end_date: form.end_date || null,
        age_category: form.age_category || null,
        city: form.city || null,
        venue: form.venue || null,
        withdrawal_date: form.withdrawal_date || null,
        notes: form.notes || null,
      };
      const { error } = isEdit
        ? await supabase.from('events').update(payload).eq('id', editEvent.id)
        : await supabase.from('events').insert({ user_id: user.id, ...payload });
      if (error) throw error;
      onSaved();
    } catch (e) { alert('Error: ' + e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this event?')) return;
    setDeleting(true);
    await supabase.from('events').delete().eq('id', editEvent.id);
    onSaved();
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.cancelBtn} onClick={onCancel}>✕ Cancel</button>
        <h1 className={styles.title}>{isEdit ? 'Edit Event' : 'Add Event'}</h1>
        <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      <div className={styles.form}>

        {/* Event type */}
        <div className={styles.card}>
          <label className={styles.label}>Event Type</label>
          <div className={styles.typeGrid}>
            {EVENT_TYPES.map(t => (
              <button key={t.value}
                className={`${styles.typeBtn} ${form.event_type === t.value ? styles.typeBtnActive : ''}`}
                onClick={() => set('event_type', t.value)}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div className={styles.card}>
          <label className={styles.label}>Event Name</label>
          <input className={styles.input} placeholder="e.g. MSLTA U-16 Boys Singles"
            value={form.title} onChange={e => set('title', e.target.value)} />
        </div>

        {/* Dates */}
        <div className={styles.card}>
          <label className={styles.label}>Dates</label>
          <div className={styles.dateRow}>
            <div className={styles.dateField}>
              <span className={styles.dateSubLabel}>Start</span>
              <div className={styles.dateDisplay} onClick={() => startRef.current?.showPicker()}>
                {formatDate(form.start_date) || 'Select'}
              </div>
              <input ref={startRef} type="date" value={form.start_date}
                onChange={e => set('start_date', e.target.value)} className={styles.hiddenDate} />
            </div>
            <div className={styles.dateSep}>→</div>
            <div className={styles.dateField}>
              <span className={styles.dateSubLabel}>End (optional)</span>
              <div className={styles.dateDisplay} onClick={() => endRef.current?.showPicker()}>
                {formatDate(form.end_date) || 'Same day'}
              </div>
              <input ref={endRef} type="date" value={form.end_date}
                onChange={e => set('end_date', e.target.value)} className={styles.hiddenDate} />
            </div>
          </div>
        </div>

        {/* Age category — only for tournaments/trials */}
        {(form.event_type === 'tournament' || form.event_type === 'trial') && (
          <div className={styles.card}>
            <label className={styles.label}>Age Category</label>
            <div className={styles.pills}>
              {AGE_CATS.map(a => (
                <button key={a}
                  className={`${styles.pill} ${form.age_category === a ? styles.pillActive : ''}`}
                  onClick={() => set('age_category', form.age_category === a ? '' : a)}>
                  {a}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Location */}
        <div className={styles.card}>
          <label className={styles.label}>Location</label>
          <div className={styles.row2}>
            <input className={styles.input} placeholder="City" value={form.city} onChange={e => set('city', e.target.value)} />
            <input className={styles.input} placeholder="Venue (optional)" value={form.venue} onChange={e => set('venue', e.target.value)} />
          </div>
        </div>

        {/* Withdrawal date — tournaments only */}
        {form.event_type === 'tournament' && (
          <div className={styles.card}>
            <label className={styles.label}>Withdrawal Deadline</label>
            <p className={styles.hint}>You'll get reminders 2 days before, 1 day before, and on this date.</p>
            <div className={styles.dateDisplay} onClick={() => withdrawRef.current?.showPicker()}>
              {formatDate(form.withdrawal_date) || 'Tap to set (optional)'}
            </div>
            <input ref={withdrawRef} type="date" value={form.withdrawal_date}
              onChange={e => set('withdrawal_date', e.target.value)} className={styles.hiddenDate} />
            {form.withdrawal_date && (
              <button className={styles.clearDate} onClick={() => set('withdrawal_date', '')}>✕ Clear</button>
            )}
          </div>
        )}

        {/* Notes */}
        <div className={styles.card}>
          <label className={styles.label}>Notes</label>
          <textarea className={styles.textarea} rows={3}
            placeholder="e.g. Need to book train tickets, bring extra strings..."
            value={form.notes} onChange={e => set('notes', e.target.value)} />
        </div>

        {isEdit && (
          <button className={styles.deleteBtn} onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Deleting...' : '🗑 Delete Event'}
          </button>
        )}

        <div style={{ height: 40 }} />
      </div>
    </div>
  );
}
