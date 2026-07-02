import { useState } from 'react';
import styles from './BodyCondition.module.css';

const ENERGY = [
  { level: 1, icon: '😴', label: 'Exhausted', color: '#E74C3C' },
  { level: 2, icon: '😓', label: 'Tired',     color: '#E67E22' },
  { level: 3, icon: '🙂', label: 'Okay',      color: '#F39C12' },
  { level: 4, icon: '💪', label: 'Good',      color: '#27AE60' },
  { level: 5, icon: '⚡', label: 'Energized', color: '#2ECC71' },
];

const PARTS = [
  'R. Shoulder', 'L. Shoulder', 'R. Elbow', 'L. Elbow',
  'R. Wrist', 'L. Wrist', 'R. Palm', 'L. Palm',
  'Lower Back', 'Core', 'R. Knee', 'L. Knee',
  'Hamstring', 'Calves', 'R. Ankle', 'L. Ankle',
];

export default function BodyCondition({ onEnergyChange, onIssuesChange }) {
  const [energy, setEnergy] = useState(null);
  const [selected, setSelected] = useState(new Set());

  const togglePart = (part) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(part) ? next.delete(part) : next.add(part);
      onIssuesChange?.([...next]);
      return next;
    });
  };

  const setEnegyLevel = (level) => {
    setEnergy(level);
    onEnergyChange?.(level);
  };

  return (
    <div className={styles.container}>
      <div className={styles.energyRow}>
        {ENERGY.map(e => (
          <button
            key={e.level}
            onClick={() => setEnegyLevel(e.level)}
            className={styles.energyBtn}
            style={{
              borderColor: e.color,
              background: energy === e.level ? e.color : 'var(--surface)',
              color: energy === e.level ? '#0A1628' : '#fff',
            }}
          >
            <span className={styles.energyIcon}>{e.icon}</span>
            <span className={styles.energyLabel}>{e.label}</span>
          </button>
        ))}
      </div>

      <p className={styles.issueLabel}>Any specific issues? (tap to mark)</p>
      <div className={styles.partsGrid}>
        {PARTS.map(part => (
          <button
            key={part}
            onClick={() => togglePart(part)}
            className={styles.partBtn}
            style={selected.has(part) ? { borderColor: '#E74C3C', background: '#2A0A0A', color: '#F5A8A0' } : {}}
          >
            {part}
          </button>
        ))}
      </div>

      {selected.size > 0 && (
        <div className={styles.summary}>
          ⚠️ {selected.size} area{selected.size > 1 ? 's' : ''} flagged: {[...selected].join(', ')}
        </div>
      )}
    </div>
  );
}
