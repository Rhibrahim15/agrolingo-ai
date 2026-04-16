import React from 'react';
import { Globe, Bell, Shield, LogOut, ChevronRight } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const SettingsScreen: React.FC = () => {
  const { lang, setLang, logout } = useAppStore();

  return (
    <div className="flex flex-col gap-6 p-6">
      <h1 className="text-2xl font-space font-bold text-white">Settings</h1>

      <div className="space-y-4">
        <div className="bg-[#1B4332]/5 border border-[#1B4332]/20 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Globe className="text-[#FFB703]" size={20} />
            <span className="text-sm font-bold text-white">App Language</span>
          </div>
          <select 
            value={lang} 
            onChange={(e) => setLang(e.target.value as any)}
            className="bg-transparent text-[#FFB703] font-black uppercase text-[12px] outline-none"
          >
            <option value="ha">Hausa</option>
            <option value="en">English</option>
          </select>
        </div>

        <button className="w-full bg-[#1B4332]/5 border border-[#1B4332]/20 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="text-slate-400" size={20} />
            <span className="text-sm font-bold text-white">Notifications</span>
          </div>
          <ChevronRight size={16} className="text-slate-700" />
        </button>
      </div>

      <button 
        onClick={logout}
        className="mt-8 flex items-center justify-center gap-2 text-red-500 font-black uppercase tracking-widest text-[12px] py-4 border border-red-500/20 rounded-2xl"
      >
        <LogOut size={16} /> Logout
      </button>
    </div>
  );
};