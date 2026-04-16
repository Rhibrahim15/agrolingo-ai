import React from 'react';
import { motion } from 'framer-motion';
import { Sprout, Calendar, ChevronRight, Plus, Map, Info } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { translations } from '../utils/translations';

export const RecordsScreen: React.FC = () => {
  const { lang } = useAppStore();
  const t = translations[lang as keyof typeof translations] || translations.en;

  // This data would eventually come from your Supabase 'farm_records' table
  const records = [
    { id: '1', crop: 'Maize', variety: 'Sammaz 14', planted: '2026-01-12', status: 'Growing', area: '2.5 Ha' },
    { id: '2', crop: 'Millet', variety: 'SOSAT-C88', planted: '2025-11-05', status: 'Harvested', area: '1.2 Ha' },
  ];

  return (
    <div className="flex flex-col gap-6 p-5 pb-24">
      {/* 🔝 Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-space font-bold text-white tracking-tight">
            {lang === 'ha' ? 'Littafin Gona' : 'Farm Journal'}
          </h1>
          <p className="text-[11px] text-[#FFB703] font-bold uppercase tracking-widest">
            {records.length} {lang === 'ha' ? 'Abubuwan da aka shuka' : 'Active Records'}
          </p>
        </div>
        <button className="w-12 h-12 rounded-2xl bg-[#FFB703] text-[#264653] flex items-center justify-center shadow-lg shadow-[#FFB703]/20">
          <Plus size={24} strokeWidth={3} />
        </button>
      </div>

      {/* 📊 Summary Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#1B4332]/10 border border-[#1B4332]/20 p-4 rounded-3xl">
          <Map className="w-5 h-5 text-[#FFB703] mb-2" />
          <span className="block text-xl font-space font-bold text-white">3.7 Ha</span>
          <span className="text-[9px] text-slate-500 uppercase font-black tracking-tighter">Total Farm Area</span>
        </div>
        <div className="bg-[#1B4332]/10 border border-[#1B4332]/20 p-4 rounded-3xl">
          <Sprout className="w-5 h-5 text-emerald-400 mb-2" />
          <span className="block text-xl font-space font-bold text-white">2 Crops</span>
          <span className="text-[9px] text-slate-500 uppercase font-black tracking-tighter">Current Season</span>
        </div>
      </div>

      {/* 📜 Records List */}
      <div className="space-y-3">
        {records.map((record, i) => (
          <motion.div
            key={record.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-[#050a08] border border-[#1B4332]/30 rounded-3xl p-5 flex items-center justify-between group hover:border-[#FFB703]/40 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#1B4332]/20 flex items-center justify-center">
                <Sprout className={record.status === 'Growing' ? 'text-emerald-400' : 'text-slate-500'} />
              </div>
              <div>
                <h3 className="text-[15px] font-bold text-white">{record.crop}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-slate-400 font-medium">{record.variety}</span>
                  <span className="w-1 h-1 bg-slate-700 rounded-full" />
                  <span className="text-[10px] text-[#FFB703] font-bold">{record.area}</span>
                </div>
              </div>
            </div>

            <div className="text-right flex flex-col items-end gap-2">
              <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg ${
                record.status === 'Growing' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'
              }`}>
                {record.status}
              </span>
              <div className="flex items-center gap-1 text-slate-500">
                <Calendar size={10} />
                <span className="text-[9px] font-bold">{record.planted}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* 💡 Agent Tip */}
      <div className="mt-4 p-5 bg-[#FFB703]/5 border border-[#FFB703]/10 rounded-[2rem] flex items-start gap-4">
        <Info className="w-5 h-5 text-[#FFB703] shrink-0" />
        <p className="text-[12px] text-slate-300 leading-relaxed italic">
          {lang === 'ha' 
            ? 'AI tana amfani da wadannan bayanan don sanar da kai lokacin da ya kamata ka yi magani ko girbi.' 
            : 'The Agent uses these records to proactively alert you when it is time for pest control or harvest.'}
        </p>
      </div>
    </div>
  );
};