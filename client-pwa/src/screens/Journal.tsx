import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Leaf, Droplets, Trash2, Calendar, ClipboardList } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';
import { translations } from '../utils/translations';

export const Journal = () => {
  const { lang, user } = useAppStore();
  const t = translations[lang] || translations.en;
  
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  // 📝 Activity Types for the Picker
  const activities = [
    { label: 'Planting', icon: Leaf, color: '#34D399' },
    { label: 'Irrigation', icon: Droplets, color: '#60A5FA' },
    { label: 'Fertilizer', icon: ClipboardList, color: '#FFB703' },
  ];

  const fetchJournal = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('farm_journal')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setEntries(data);
    setLoading(false);
  };

  useEffect(() => { fetchJournal(); }, []);

  const addEntry = async (type: string) => {
    const desc = prompt("What did you do today?");
    if (!desc) return;

    const { error } = await supabase.from('farm_journal').insert([
      { user_id: user?.id, activity_type: type, description: desc }
    ]);

    if (!error) fetchJournal();
  };

  return (
    <div className="flex flex-col gap-6 p-5 pb-32">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase">
            {lang === 'ha' ? 'Littafin Gona' : 'Farm Journal'}
          </h1>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
            {entries.length} Activities Recorded
          </p>
        </div>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="w-14 h-14 bg-[#FFB703] rounded-2xl flex items-center justify-center text-[#050a08] shadow-xl shadow-[#FFB703]/20 transition-transform active:scale-90"
        >
          <Plus size={32} strokeWidth={3} />
        </button>
      </div>

      {/* ➕ Quick Activity Picker */}
      <AnimatePresence>
        {showAdd && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="grid grid-cols-3 gap-3 overflow-hidden"
          >
            {activities.map((act) => (
              <button 
                key={act.label}
                onClick={() => { addEntry(act.label); setShowAdd(false); }}
                className="bg-[#1B4332]/20 border border-[#1B4332]/40 p-4 rounded-2xl flex flex-col items-center gap-2 hover:bg-[#1B4332]/40 transition-all"
              >
                <act.icon style={{ color: act.color }} size={24} />
                <span className="text-[9px] font-black text-white uppercase tracking-tighter">{act.label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 📜 Timeline List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center p-20 text-slate-600 animate-pulse uppercase font-black text-xs">Syncing Journal...</div>
        ) : (
          entries.map((entry, i) => (
            <motion.div 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              key={entry.id}
              className="bg-gradient-to-br from-[#1B4332]/10 to-transparent border border-[#1B4332]/20 p-5 rounded-[2rem] relative overflow-hidden"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-[#FFB703]">
                  {entry.activity_type === 'Planting' ? <Leaf size={18} /> : <Droplets size={18} />}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="text-[10px] font-black text-[#FFB703] uppercase tracking-widest">{entry.activity_type}</h3>
                    <span className="text-[8px] text-slate-500 font-bold uppercase">
                      {new Date(entry.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-white/90 font-medium leading-tight">{entry.description}</p>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};