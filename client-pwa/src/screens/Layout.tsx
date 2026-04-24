import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';

// Nav icons as inline SVGs for pixel-perfect control
const HomeIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path
      d="M3 9.5L12 3L21 9.5V20C21 20.55 20.55 21 20 21H15V15H9V21H4C3.45 21 3 20.55 3 20V9.5Z"
      stroke="currentColor"
      strokeWidth={active ? 2.2 : 1.8}
      fill={active ? 'currentColor' : 'none'}
      opacity={active ? 0.15 : 1}
    />
    <path
      d="M3 9.5L12 3L21 9.5V20C21 20.55 20.55 21 20 21H15V15H9V21H4C3.45 21 3 20.55 3 20V9.5Z"
      stroke="currentColor"
      strokeWidth={active ? 2.2 : 1.8}
      fill="none"
    />
  </svg>
);

const ChatIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path
      d="M21 15C21 15.55 20.55 16 20 16H7L3 20V4C3 3.45 3.45 3 4 3H20C20.55 3 21 3.45 21 4V15Z"
      stroke="currentColor"
      strokeWidth={active ? 2.2 : 1.8}
      fill={active ? 'currentColor' : 'none'}
      opacity={active ? 0.12 : 1}
    />
    <path
      d="M21 15C21 15.55 20.55 16 20 16H7L3 20V4C3 3.45 3.45 3 4 3H20C20.55 3 21 3.45 21 4V15Z"
      stroke="currentColor"
      strokeWidth={active ? 2.2 : 1.8}
      fill="none"
    />
  </svg>
);

const ProfileIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} fill={active ? 'currentColor' : 'none'} opacity={active ? 0.12 : 1}/>
    <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} fill="none"/>
    <path d="M4 20C4 17 7.58 15 12 15C16.42 15 20 17 20 20" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round"/>
  </svg>
);

const SettingsIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}/>
    <path d="M12 2V4M12 20V22M4.22 4.22L5.64 5.64M18.36 18.36L19.78 19.78M2 12H4M20 12H22M4.22 19.78L5.64 18.36M18.36 5.64L19.78 4.22" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round"/>
  </svg>
);

const tabs = [
  { id: 'dashboard', label: 'Home',     Icon: HomeIcon    },
  { id: 'chat',      label: 'AI Chat',  Icon: ChatIcon    },
  { id: 'profile',   label: 'Profile',  Icon: ProfileIcon },
  { id: 'settings',  label: 'Settings', Icon: SettingsIcon},
];

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { screen, setScreen, lang, setLang, isAgentProcessing } = useAppStore();

  const isHa = lang === 'ha';

  const navLabels: Record<string, { ha: string; en: string }> = {
    dashboard: { ha: 'Gida',    en: 'Home'     },
    chat:      { ha: 'AI Chat', en: 'AI Chat'  },
    profile:   { ha: 'Asusun',  en: 'Profile'  },
    settings:  { ha: 'Saituna', en: 'Settings' },
  };

  // Hidden Admin Trigger Logic
  const [, setTapCount] = React.useState(0);
  const tapTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleAdminTap = () => {
    setTapCount((prev) => {
      if (prev + 1 >= 5) {
        setScreen('admin_dashboard' as any);
        return 0;
      }
      return prev + 1;
    });
    if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current);
    tapTimeoutRef.current = setTimeout(() => setTapCount(0), 2000);
  };

  return (
    <div
      className="relative flex flex-col w-full h-full overflow-hidden"
      style={{ background: 'var(--surface-0)' }}
    >
      {/* ── App header ── */}
      <header
        className="sticky top-0 z-30 flex items-center justify-between glass"
        style={{
          padding: '24px 18px 14px',
          borderBottom: '1px solid var(--border)'
        }}
      >
        {/* Wordmark */}
        <div className="flex items-center gap-2.5 cursor-pointer select-none" onClick={handleAdminTap}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: '#FFFFFF',
              border: '1px solid rgba(0,0,0,0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              overflow: 'hidden',
            }}
          >
            <img src="/images/logo1.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 2 }} />
          </div>
          <div>
            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 16,
                fontWeight: 800,
                color: 'var(--text-primary)',
                letterSpacing: '-0.025em',
                lineHeight: 1,
              }}
            >
              AgroLingo <span style={{ color: 'var(--gold)' }}>AI</span>
            </p>
          </div>
        </div>

        {/* Right side: status + language */}
        <div className="flex items-center gap-2.5">
          {/* Agent status */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '5px 10px',
              borderRadius: 999,
              background: 'rgba(26,71,49,0.4)',
              border: '1px solid rgba(61,155,102,0.18)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <div className={isAgentProcessing ? 'dot-processing' : 'dot-live'} />
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 9,
                fontWeight: 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: isAgentProcessing ? 'var(--gold)' : 'var(--sprout)',
              }}
            >
              {isAgentProcessing
                ? (isHa ? 'Yana Tunani' : 'Thinking')
                : (isHa ? 'AI Yana Aiki' : 'Online')}
            </span>
          </div>

          {/* Language toggle */}
          <div
            style={{
              display: 'flex',
              background: 'rgba(14,45,26,0.6)',
              border: '1px solid rgba(61,155,102,0.18)',
              borderRadius: 999,
              padding: 3,
              backdropFilter: 'blur(8px)',
            }}
          >
            {(['ha', 'en'] as const).map(l => (
              <button
                key={l}
                onClick={() => setLang(l)}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 9,
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  padding: '4px 10px',
                  borderRadius: 999,
                  border: 'none',
                  cursor: 'pointer',
                  background: lang === l ? 'var(--gold)' : 'transparent',
                  color: lang === l ? 'var(--ink)' : 'var(--slate-400)',
                  transition: 'all 200ms',
                }}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ── Scrollable content ── */}
      <main
        className="flex-1 overflow-y-auto"
        style={{ paddingBottom: 80 }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={screen}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            className="h-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ── Bottom navigation ── */}
      <nav className="bottom-nav">
        {tabs.map(({ id, Icon }) => {
          const active = screen === id;
          const label = navLabels[id]?.[isHa ? 'ha' : 'en'] ?? id;

          return (
            <button
              key={id}
              className={`nav-item ${active ? 'active' : ''}`}
              onClick={() => setScreen(id as any)}
              aria-label={label}
            >
              {/* Active bar */}
              <AnimatePresence>
                {active && (
                  <motion.div
                    layoutId="nav-bar"
                    className="nav-active-bar"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    exit={{ scaleX: 0 }}
                    transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                  />
                )}
              </AnimatePresence>

              <span className="nav-icon">
                <Icon active={active} />
              </span>
              <span className="nav-label">{label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
