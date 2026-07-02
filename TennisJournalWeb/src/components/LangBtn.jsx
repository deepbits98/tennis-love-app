export default function LangBtn({ lang, setLang }) {
  return (
    <button
      onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
      style={{
        padding: '6px 12px', borderRadius: 16, whiteSpace: 'nowrap',
        border: '1px solid rgba(61,142,240,0.4)',
        background: 'rgba(61,142,240,0.1)',
        color: '#a8d4f5', fontSize: 12, fontWeight: 600, cursor: 'pointer',
      }}
    >
      {lang === 'en' ? 'हिंदी' : 'English'}
    </button>
  );
}
