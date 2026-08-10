export default function TelegramFloat() {
  return (
    <a
      href="https://t.me/ekamevadvitiyam"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on Telegram"
      style={{
        position: 'fixed',
        bottom: '5rem',
        right: '1.25rem',
        width: 42,
        height: 42,
        borderRadius: '50%',
        background: '#229ED9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 16px rgba(34,158,217,0.45)',
        zIndex: 9999,
        transition: 'transform 0.18s ease, box-shadow 0.18s ease',
        textDecoration: 'none',
      }}
      className="tg-float"
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M21.93 3.24a1.5 1.5 0 0 0-1.54-.22L2.92 10.18a1.5 1.5 0 0 0 .1 2.79l4.07 1.35 1.56 4.94a1.5 1.5 0 0 0 2.54.53l2.07-2.35 4.08 3a1.5 1.5 0 0 0 2.32-1l2-14a1.5 1.5 0 0 0-.73-1.2ZM10 17.5l-1.1-3.47 7.37-6.13L10 17.5Zm8.18.85-4.56-3.36 5.6-8.13-1.04 11.49Z"
          fill="#fff"
        />
      </svg>

      <style>{`
        .tg-float:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 24px rgba(34,158,217,0.6);
        }
        @media (min-width: 768px) {
          .tg-float { bottom: 1.5rem; }
        }
      `}</style>
    </a>
  );
}
