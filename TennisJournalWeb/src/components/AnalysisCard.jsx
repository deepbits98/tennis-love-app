import styles from './AnalysisCard.module.css';

export default function AnalysisCard({ analysis, onShare }) {
  if (!analysis) return null;

  return (
    <div className={styles.card}>

      <section className={styles.section}>
        <div className={styles.sectionTitle}>📊 MATCH SUMMARY</div>
        <p className={styles.summary}>{analysis.summary}</p>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionTitle}>🔍 KEY OBSERVATIONS</div>
        {analysis.keyObservations?.map((obs, i) => (
          <div key={i} className={styles.bullet}>• {obs}</div>
        ))}
      </section>

      <section className={styles.section}>
        <div className={styles.sectionTitle}>⚡ PRIORITY FIXES</div>
        {analysis.priorityFixes?.map((fix, i) => (
          <div key={i} className={styles.priorityItem}>
            <div className={styles.priorityArea}>{i + 1}. {fix.area}</div>
            <div className={styles.priorityIssue}>{fix.issue}</div>
            <div className={styles.priorityFix}>→ {fix.fix}</div>
          </div>
        ))}
      </section>

      <section className={styles.section}>
        <div className={styles.sectionTitle}>🎾 DRILLS THIS WEEK</div>
        {analysis.drills?.map((drill, i) => (
          <div key={i} className={styles.drillItem}>
            <div className={styles.drillName}>{i + 1}. {drill.name}</div>
            <div className={styles.drillMeta}>{drill.duration} · {drill.frequency}</div>
            <div className={styles.drillDesc}>{drill.description}</div>
          </div>
        ))}
      </section>

      <section className={styles.section}>
        <div className={styles.sectionTitle}>💪 FITNESS & CONDITIONING</div>
        {analysis.fitness?.map((item, i) => (
          <div key={i} className={styles.drillItem}>
            <div className={styles.drillName}>{i + 1}. {item.name}</div>
            <div className={styles.drillMeta}>{item.sets}</div>
            <div className={styles.drillDesc}>{item.description}</div>
          </div>
        ))}
      </section>

      <section className={styles.section}>
        <div className={styles.sectionTitle}>🎯 TACTICAL ADJUSTMENTS</div>
        {analysis.tacticalAdjustments?.map((adj, i) => (
          <div key={i} className={styles.bullet}>• {adj}</div>
        ))}
      </section>

      <div className={styles.weekFocusBox}>
        <div className={styles.weekFocusLabel}>📌 WEEK FOCUS</div>
        <div className={styles.weekFocusText}>{analysis.weekFocus}</div>
      </div>

      <button className={styles.shareBtn} onClick={onShare}>
        📤 Share with Coach
      </button>
    </div>
  );
}
