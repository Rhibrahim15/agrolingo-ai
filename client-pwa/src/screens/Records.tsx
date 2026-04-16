import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sprout, TrendingUp, Calendar, Target, Award } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';

export const Records = () => {
  const { user, lang } = useAppStore();
  const [crops, setCrops] = useState<any[]>([]);

  useEffect(() => {
    const fetchCrops = async () => {
      const { data } = await supabase
        .from('crop_progress')
        .select('*')
        .order('growth_stage', { ascending: false });
      if (data) setCrops(data);
    };
    fetchCrops();
  }, []);

  return (
    <div className="p-6 pb-32 space-y-6">
      {/* 🏛️ Header */}
      <div>
        <h1 className="text-3xl font-black text-white tracking-tighter uppercase">
          {lang === 'ha' ? 'Littafin Girbi' : 'Growth Records'}
        </h1>
        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">
          Season 2026 • Active Tracking
        </p>
      </div>

      {/* 🍱 Bento Grid */}
      <div className="grid grid-cols-2 gap-4">
        {crops.map((crop, i) => (
          <motion.div
            key={crop.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`p-5 rounded-[2.5rem] flex flex-col justify-between h-52 relative overflow-hidden ${
              i === 0 ? 'bg-[#FFB703] text-[#050a08] col-span-2 h-44' : 'bg-[#1B4332]/20 border border-[#1B4332]/40 text-white'
            }`}
          >
            {/* Background Icon Watermark */}
            <Sprout className="absolute -bottom-4 -right-4 opacity-10 w-32 h-32" />

            <div className="flex justify-between items-start relative z-10">
              <div>
                <span className={`text-[9px] font-black uppercase tracking-widest ${i === 0 ? 'text-[#050a08]/60' : 'text-slate-500'}`}>
                  {crop.crop_type}
                </span>
                <h3 className="text-2xl font-black uppercase tracking-tighter">{crop.status}</h3>
              </div>
              <div className={`p-2 rounded-xl ${i === 0 ? 'bg-black/10' : 'bg-white/5'}`}>
                {i === 0 ? <Award size={20} /> : <Target size={20} />}
              </div>
            </div>

            <div className="relative z-10">
              <div className="flex justify-between items-end mb-2">
                <span className="text-4xl font-black">{crop.growth_stage}%</span>
                <span className="text-[10px] font-bold uppercase">Progress</span>
              </div>
              {/* Custom Progress Bar */}
              <div className={`h-2 rounded-full ${i === 0 ? 'bg-black/20' : 'bg-white/10'}`}>
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${crop.growth_stage}%` }}
                  className={`h-full rounded-full ${i === 0 ? 'bg-black' : 'bg-[#FFB703]'}`} 
                />
              </div>
            </div>
          </motion.div>
        ))}

        {/* 📊 Summary Bento (Small) */}
        <div className="bg-[#1B4332] p-5 rounded-[2.5rem] flex flex-col justify-center items-center text-center">
            <TrendingUp className="text-[#34D399] mb-2" size={24} />
            <span className="text-[10px] font-black text-white/60 uppercase">Yield Est.</span>
            <span className="text-lg font-black text-white uppercase">High</span>
        </div>

        <div className="bg-white/5 border border-white/10 p-5 rounded-[2.5rem] flex flex-col justify-center items-center text-center">
            <Calendar className="text-slate-500 mb-2" size={24} />
            <span className="text-[10px] font-black text-slate-500 uppercase">Next Cycle</span>
            <span className="text-lg font-black text-white uppercase">June</span>
        </div>
      </div>
    </div>
  );
};