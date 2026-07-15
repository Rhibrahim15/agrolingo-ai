import React from 'react';
import { Home, MessageCircle, Settings, User } from 'lucide-react';
import { useAppStore, type Screen } from '../store/useAppStore';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { screen, setScreen, lang, setLang } = useAppStore();
  const isHa = lang === 'ha';

  const tabs: Array<{ id: Screen; label: string; Icon: typeof Home }> = [
    { id: 'dashboard', label: isHa ? 'Gida' : 'Home', Icon: Home },
    { id: 'chat', label: isHa ? 'Tambaya' : 'Ask', Icon: MessageCircle },
    { id: 'profile', label: isHa ? 'Asusu' : 'Profile', Icon: User },
    { id: 'settings', label: isHa ? 'Saituna' : 'Settings', Icon: Settings },
  ];

  return (
    <div className="app-shell">
      <header className="app-header">
        <button className="brand-lockup" onClick={() => setScreen('dashboard')} aria-label="AgroLingo AI home">
          <span className="brand-mark"><img src="/images/logo1.png" alt="" /></span>
          <span><strong>AgroLingo</strong><small>{isHa ? 'Gwajin farko' : 'Early pilot'}</small></span>
        </button>

        <div className="language-switch" aria-label={isHa ? 'Zaɓin harshe' : 'Language selection'}>
          <button className={lang === 'ha' ? 'active' : ''} onClick={() => setLang('ha')} aria-pressed={lang === 'ha'}>HA</button>
          <button className={lang === 'en' ? 'active' : ''} onClick={() => setLang('en')} aria-pressed={lang === 'en'}>EN</button>
        </div>
      </header>

      <main className="app-content">{children}</main>

      <nav className="app-nav" aria-label={isHa ? 'Babban menu' : 'Primary navigation'}>
        {tabs.map(({ id, label, Icon }) => {
          const active = screen === id;
          return (
            <button key={id} className={active ? 'active' : ''} onClick={() => setScreen(id)} aria-current={active ? 'page' : undefined}>
              <Icon size={21} strokeWidth={active ? 2.4 : 2} aria-hidden="true" />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
