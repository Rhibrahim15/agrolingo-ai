import React from 'react';
import { motion } from 'framer-motion';
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
    <div className="flex flex-col min-h-screen bg-[#050a08] text-[#F4F4F4]">
      
      {/* 🔝 Elite Header with Wordmark */}
      <header className="flex justify-between items-center px-5 py-4 border-b border-[#1B4332]/30 bg-[#050a08]/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="flex items-center gap-3">
          {/* Professional Wordmark Integration */}
          <div className="h-8">
             <img 
               src="/images/agrolingo1.png" 
               alt="AgroLingo AI" 
               className="h-full object-contain"
             />
          </div>
          
          {/* Live Status Indicator */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#1B4332]/40 border border-[#1B4332]/50">
            <div className={`w-1.5 h-1.5 rounded-full ${isAgentProcessing ? 'bg-[#FFB703] animate-pulse' : 'bg-emerald-400'}`} />
            <span className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter">
              {isAgentProcessing ? 'AI Reasoning' : 'Agent Online'}
            </span>
          </div>
        </div>

        {/* Right Side: Language Picker */}
        <div className="flex items-center bg-[#1B4332]/20 p-1 rounded-lg border border-[#1B4332]/40">
          <Globe className="w-3.5 h-3.5 text-[#FFB703] ml-1" />
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as any)}
            className="bg-transparent text-[10px] font-bold px-1 py-0.5 outline-none cursor-pointer text-[#F4F4F4] uppercase border-none"
          >
            <option value="ha">HA</option>
            <option value="en">EN</option>
            <option value="fr">FR</option>
          </select>
        </div>
      </header>

      {/* 📱 Dynamic Content Area */}
      <div className="flex-1 overflow-y-auto scrollbar-none pb-24">
        {children}
      </div>

      {/* 🧭 Bottom Navigation (Saffron Gold Accents) */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-[#050a08]/95 backdrop-blur-2xl border-t border-[#1B4332]/30 px-2 py-3 flex justify-around items-center z-50">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = screen === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => setScreen(tab.id as any)}
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

              {/* Futuristic Active Indicator */}
              {isActive && (
                <motion.div
                  layoutId="navGlow"
                  className="absolute -top-3 w-10 h-1 bg-[#FFB703] rounded-full shadow-[0_0_15px_rgba(255,183,3,0.6)]"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};