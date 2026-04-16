import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CloudRain, Wind, Droplets, Thermometer, Sun, CloudLightning, Navigation } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { translations } from '../utils/translations';

export const SmartWeather = () => {
  const { lang } = useAppStore();
  const t = translations[lang] || translations.en;
  
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // Using the same coordinates as the dashboard/backend
        const res = await fetch('http://localhost:8080/api/v1/weather?lat=11.74&lon=9.33');
        if (res.ok) {
          const data = await res.json();
          setWeather(data);
        }
      } catch (error) {
        console.error('Weather fetch failed', error);
      } finally {
        setLoading(false);
      }
    };
    fetchWeather();
  }, []);

  if (loading) return (
    <div className="p-6 flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FFB703]" />
    </div>
  );

  return (
    <div className="p-6 pb-32 space-y-6 bg-[#050a08] min-h-screen">
      {/* 📍 Location Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 text-[#FFB703] mb-1">
            <Navigation size={14} fill="currentColor" />
            <span className="text-[10px] font-black uppercase tracking-widest">Dutse, Jigawa</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase">
            {lang === 'ha' ? 'Yanayin Sama' : 'Smart Weather'}
          </h1>
        </div>
        <div className="w-14 h-14 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center">
          <Sun className="text-[#FFB703]" size={28} />
        </div>
      </div>

      {/* 🌡️ Main Temp Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-[#1B4332]/40 to-transparent border border-[#1B4332]/30 rounded-[2.5rem] p-8 text-center relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-6 opacity-10">
          <CloudLightning size={120} />
        </div>
        
        <span className="text-8xl font-black text-white tracking-tighter">
          {weather?.temp ? Math.round(weather.temp) : '31'}°
        </span>
        <p className="text-[#FFB703] font-black uppercase tracking-[0.3em] mt-2">
          {weather?.rain > 0 ? 'Rain Expected' : 'Optimal Conditions'}
        </p>
      </motion.div>

      {/* 📊 Detailed Metrics Grid */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: 'Humidity', value: '65%', icon: Droplets, color: 'text-blue-400' },
          { label: 'Wind Speed', value: '12km/h', icon: Wind, color: 'text-emerald-400' },
          { label: 'Soil Temp', value: '24°C', icon: Thermometer, color: 'text-[#FFB703]' },
          { label: 'Rainfall', value: '0.2mm', icon: CloudRain, color: 'text-blue-500' },
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="bg-[#0a1a14] border border-[#1B4332]/20 p-5 rounded-3xl"
          >
            <stat.icon size={20} className={`${stat.color} mb-3`} />
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{stat.label}</p>
            <p className="text-xl font-black text-white">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* 💡 AI Insight */}
      <div className="bg-[#FFB703] text-[#050a08] p-6 rounded-[2.5rem] flex gap-4 items-start">
        <div className="w-10 h-10 bg-black/10 rounded-xl flex items-center justify-center shrink-0">
          <Sun size={20} />
        </div>
        <div>
          <h4 className="text-[10px] font-black uppercase tracking-widest mb-1">Agent Recommendation</h4>
          <p className="text-sm font-bold leading-tight">
            {lang === 'ha' 
              ? 'Zafi zai karu gobe. Tabbatar ka shayar da amfanin gonarka da safe.' 
              : 'High heat expected tomorrow. Ensure irrigation is completed before 9:00 AM.'}
          </p>
        </div>
      </div>
    </div>
  );
};
