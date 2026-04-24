import React from 'react';
import { LayoutDashboard, MessageSquare, User, Settings, Globe } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { screen, setScreen, lang, setLang, isAgentProcessing } = useAppStore();

  const tabs = [
    { id: 'dashboard', label: 'Hub', icon: LayoutDashboard },
    { id: 'chat', label: 'Agent AI', icon: MessageSquare },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="flex flex-col h-full w-full relative" style={{ background: 'var(--surface-0)', color: 'var(--text-primary)' }}>
      
      {/*  Elite Header with Wordmark */}
      <header className="glass" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Professional Wordmark Integration */}
          <div style={{ width: 28, height: 28, borderRadius: 8, background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden', flexShrink: 0 }}>
             <img 
               src="/images/logo1.png" 
               alt="AgroLingo AI" 
               style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 4 }}
             />
          </div>
          
          {/* Live Status Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: 999, background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: isAgentProcessing ? '#FFB703' : '#34D399', animation: isAgentProcessing ? 'pulse-live 1s infinite' : 'none' }} />
            <span style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {isAgentProcessing ? 'AI Reasoning' : 'Agent Online'}
            </span>
          </div>
        </div>

        {/* Right Side: Language Picker */}
        <div style={{ display: 'flex', alignItems: 'center', background: 'var(--surface-2)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <Globe size={14} style={{ color: '#FFB703', marginLeft: 4 }} />
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as any)}
            style={{ background: 'transparent', fontSize: '10px', fontWeight: 800, padding: '2px 6px', outline: 'none', cursor: 'pointer', color: 'var(--text-primary)', textTransform: 'uppercase', border: 'none', appearance: 'none' }}
          >
            <option value="ha">HA</option>
            <option value="en">EN</option>
            <option value="fr">FR</option>
          </select>
        </div>
      </header>

      {/* 📱 Dynamic Content Area */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden pb-32 relative scrollbar-none">
        {children}
      </main>

      {/*  Bottom Navigation (Saffron Gold Accents) */}
      <nav className="absolute bottom-0 left-0 w-full glass px-2 py-4 flex justify-around items-center z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = screen === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => {
                if ('vibrate' in navigator) navigator.vibrate(30);
                setScreen(tab.id as any);
              }}
              className={`flex flex-col items-center gap-1 relative px-4 py-1.5 transition-all duration-300 ${
                isActive ? 'text-[#FFB703]' : 'text-slate-500'
              }`}
            >
              <Icon 
                className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : 'scale-100'}`} 
                strokeWidth={isActive ? 2.5 : 2} 
              />
              <span className="text-[9px] font-bold uppercase tracking-widest">
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};