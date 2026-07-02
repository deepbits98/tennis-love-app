import { useState, useEffect } from 'react';
import styles from './SentimeterWheel.module.css';

const W = 280, H = 155;
const CX = W / 2, CY = 143;
const OR = 120, IR = 76;  // outer / inner radius of track
const NL = 100;            // needle length
const toRad = d => (d * Math.PI) / 180;

// Gauge spans 180°→360° clockwise (through 270°=top)
const ZONES = [
  { label: 'Frustrated', hint: 'frustrated', score: 10, start: 180, end: 210, color: '#E74C3C', emoji: '😤' },
  { label: 'Low',        hint: 'low',        score: 25, start: 210, end: 240, color: '#E67E22', emoji: '😞' },
  { label: 'Meh',        hint: 'meh',        score: 40, start: 240, end: 270, color: '#F1C40F', emoji: '😐' },
  { label: 'Okay',       hint: 'okay',       score: 55, start: 270, end: 300, color: '#A8D800', emoji: '🙂' },
  { label: 'Happy',      hint: 'happy',      score: 75, start: 300, end: 330, color: '#2ECC71', emoji: '😊' },
  { label: 'Elated',     hint: 'elated',     score: 95, start: 330, end: 360, color: '#27AE60', emoji: '🏆' },
];

function pt(r, deg) {
  const a = toRad(deg);
  return [CX + r * Math.cos(a), CY + r * Math.sin(a)];
}

function sector(s, e, outerR = OR, innerR = IR, gap = 1) {
  const [ox1, oy1] = pt(outerR, s + gap), [ox2, oy2] = pt(outerR, e - gap);
  const [ix1, iy1] = pt(innerR, s + gap), [ix2, iy2] = pt(innerR, e - gap);
  return `M${ox1} ${oy1} A${outerR} ${outerR} 0 0 1 ${ox2} ${oy2} L${ix2} ${iy2} A${innerR} ${innerR} 0 0 0 ${ix1} ${iy1}Z`;
}

export default function SentimeterWheel({ onChange, moodHint }) {
  const [idx, setIdx] = useState(4); // default: Happy

  useEffect(() => {
    if (!moodHint) return;
    const found = ZONES.findIndex(z => z.hint === moodHint.toLowerCase());
    if (found !== -1) { setIdx(found); onChange?.(ZONES[found].score); }
  }, [moodHint]);

  const pick = i => { setIdx(i); onChange?.(ZONES[i].score); };
  const z = ZONES[idx];
  const midDeg = (z.start + z.end) / 2;
  const [nx, ny] = pt(NL, midDeg);
  const [bx, by] = pt(18, midDeg + 90);  // needle base left
  const [cx2, cy2] = pt(18, midDeg - 90); // needle base right

  return (
    <div className={styles.container}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Inactive segments */}
        {ZONES.map((zone, i) => i !== idx && (
          <path key={i} d={sector(zone.start, zone.end)}
            fill={zone.color} opacity="0.55"
            stroke="none"
            onClick={() => pick(i)} style={{ cursor: 'pointer' }}
          />
        ))}

        {/* Active segment — larger radii so it sticks out */}
        <path d={sector(z.start, z.end, OR + 8, IR - 6)}
          fill={z.color} opacity="1"
          stroke="rgba(255,255,255,0.6)" strokeWidth="1.5"
          filter="url(#glow)"
          style={{ pointerEvents: 'none' }}
        />

        {/* Emoji labels in each zone */}
        {ZONES.map((zone, i) => {
          const mid = (zone.start + zone.end) / 2;
          const lr = (OR + IR) / 2 + 2;
          const [lx, ly] = pt(lr, mid);
          return (
            <text key={i} x={lx} y={ly} textAnchor="middle" dominantBaseline="central"
              fontSize="20" onClick={() => pick(i)} style={{ cursor: 'pointer' }}>
              {zone.emoji}
            </text>
          );
        })}

        {/* Needle */}
        <polygon points={`${nx},${ny} ${bx},${by} ${cx2},${cy2}`} fill="white" />

        {/* Center hub */}
        <circle cx={CX} cy={CY} r="14" fill="#0a1e3c" stroke={z.color} strokeWidth="2" />
        <circle cx={CX} cy={CY} r="5" fill="white" />
      </svg>

      {/* Badge */}
      <div className={styles.badge} style={{ borderColor: z.color }}>
        <span>{z.emoji}</span>
        <span style={{ color: z.color, fontWeight: 700 }}>{z.label}</span>
        <span style={{ color: '#8FA3C0', fontSize: 13 }}>{z.score}/100</span>
      </div>
    </div>
  );
}
