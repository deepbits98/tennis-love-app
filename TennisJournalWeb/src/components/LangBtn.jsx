export default function LangBtn({ lang, setLang }) {
  return (
    <button
      onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
      style={{
        padding: '6px 12px', borderRadius: 16, whiteSpace: 'nowrap',
        border: '1px solid rgba(204,255,0,0.3)',
        background: 'rgba(204,255,0,0.08)',
        color: '#ccff00', fontSize: 12, fontWeight: 600, cursor: 'pointer',
        fontFamily: "'Share Tech Mono', monospace",
      }}
    >
      {lang === 'en' ? 'हिंदी' : 'English'}
    </button>
  );
}
