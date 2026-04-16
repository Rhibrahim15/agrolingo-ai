import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Users, MessageSquare, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const AdminDashboard: React.FC = () => {
  const { setScreen } = useAppStore();

  return (
    <div className="p-6 space-y-8 bg-[#050a08] min-h-screen pb-32">
      <div className="flex items-center gap-4">
        <button onClick={() => setScreen('dashboard')} className="p-2 bg-[#1B4332]/20 rounded-xl">
          <ArrowLeft size={20} className="text-[#FFB703]" />
        </button>
        <h1 className="text-2xl font-black text-white uppercase tracking-tighter">GreenByte Tower</h1>
      </div>

      {/* 📊 Metrics Grid */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: 'Total Farmers', value: '124', icon: Users, color: 'text-blue-400' },
          { label: 'AI Health', value: '99.8%', icon: Activity, color: 'text-emerald-400' },
          { label: 'Total Queries', value: '1.2k', icon: MessageSquare, color: 'text-[#FFB703]' },
          { label: 'System Errors', value: '0', icon: AlertCircle, color: 'text-red-400' },
        ].map((stat, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={i} 
            className="bg-[#0a1a14] border border-[#1B4332]/30 p-4 rounded-3xl"
          >
            <stat.icon size={18} className={`${stat.color} mb-2`} />
            <p className="text-[10px] uppercase font-bold text-slate-500">{stat.label}</p>
            <p className="text-xl font-black text-white">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* 📡 Live Engine Logs */}
      <div className="space-y-4">
        <h2 className="text-xs font-bold text-[#FFB703] uppercase tracking-widest">Live Engine Heartbeat</h2>
        <div className="bg-[#0a1a14] border border-[#1B4332]/30 rounded-3xl overflow-hidden">
          <div className="p-4 border-b border-[#1B4332]/30 flex justify-between items-center">
            <span className="text-[11px] font-bold text-slate-400">Latest Logs</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[9px] font-black uppercase">Live</span>
          </div>
          <div className="p-4 space-y-3 font-mono text-[10px]">
            <p className="text-emerald-400"> [16:57:04] POST /api/v1/chat 200 OK </p>
            <p className="text-blue-400"> [16:57:08] AGENT: Market tool triggered (Maize/Dawanau) </p>
            <p className="text-slate-500"> [16:57:12] DB: Query market_prices success </p>
          </div>
        </div>
      </div>
    </div>
  );
};