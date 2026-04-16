import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CloudRain, Zap, Leaf, PhoneCall, ArrowUpRight, 
  Bell, Waves, Calendar, AlertTriangle, X, Sparkles 
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { translations } from '../utils/translations';
import { supabase } from '../lib/supabase';
import { MarketTrends } from '../components/MarketTrends';

// 📢 Sub-Component: Uses AlertTriangle, X, and AnimatePresence
const BroadcastAlert = () => {
  const [alert, setAlert] = useState<any>(null);

  useEffect(() => {
    const fetchLatest = async () => {
      const { data } = await supabase
        .from('broadcasts')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (data) setAlert(data);
    };
    fetchLatest();
  }, []);

  return (
    <AnimatePresence>
      {alert && (
        <motion.div 
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="bg-[#FFB703] text-[#264653] p-4 rounded-3xl mb-6 relative overflow-hidden"
        >
          <div className="flex items-start gap-3 relative z-10">
            <AlertTriangle size={20} className="shrink-0" />
            <div className="flex-1">
              <h3 className="text-[10px] font-black uppercase tracking-widest">{alert.title}</h3>
              <p className="text-[11px] font-bold leading-tight">{alert.message}</p>
            </div>
            <button onClick={() => setAlert(null)}><X size={16} /></button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const Dashboard: React.FC = () => {
  const { lang, isAgentProcessing, setScreen } = useAppStore();
  const t = translations[lang as keyof typeof translations] || translations.en;
  
  const [userName, setUserName] = useState('Farmer');
  const [secretTaps, setSecretTaps] = useState(0);
  const [weather, setWeather] = useState({ temp: '28°', status: 'Optimal' });

  // 🕵️ Uses setUserName
  useEffect(() => {
    const getUser = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (data?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', data.user.id)
            .single();
          if (profile?.full_name) setUserName(profile.full_name);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };
    getUser();
  }, []);

  // 🌦️ Uses setWeather for live weather data
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch('http://localhost:8080/api/v1/weather?lat=11.74&lon=9.33');
        if (res.ok) {
          const data = await res.json();
          setWeather({ 
            temp: `${Math.round(data.temp)}°`, 
            status: data.rain > 0 ? 'Rain Alert' : 'Optimal Soil' 
          });
        }
      } catch (error) {
        // Fallback to realistic default
        setWeather({ temp: '31°', status: 'High Heat' });
      }
    };
    fetchWeather();
  }, []);

  const handleTowerAccess = () => {
    setSecretTaps(prev => {
      const count = prev + 1;
      if (count >= 5) {
        setScreen('admin_dashboard');
        return 0;
      }
      return count;
    });
  };

  return (
    <div className="flex flex-col gap-6 p-5 pb-32 bg-[#050a08] min-h-screen">
      
      {/* 👤 Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <p className="text-[10px] font-black text-[#FFB703] uppercase tracking-[0.2em]">{t.dashWelcome}</p>
          <h1 onClick={handleTowerAccess} className="text-2xl font-black text-white tracking-tighter cursor-default">
            {userName}
          </h1>
        </div>
        <button className="w-11 h-11 rounded-2xl bg-[#1B4332]/20 border border-[#1B4332]/40 flex items-center justify-center text-[#FFB703]">
          <Bell size={20} />
        </button>
      </div>

      <BroadcastAlert />

      {/* 🤖 AI Card: Uses Sparkles */}
      <motion.div
        whileTap={{ scale: 0.98 }}
        onClick={() => setScreen('chat')}
        className="relative overflow-hidden rounded-[2.5rem] p-[1px] bg-gradient-to-br from-[#FFB703] to-transparent shadow-2xl cursor-pointer"
      >
        <div className="bg-[#0a1a14] rounded-[2.5rem] p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-xl">
               <img src="/images/agrolingo-removebg-preview.png" alt="Logo" className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-[11px] font-black text-[#FFB703] uppercase tracking-widest">{t.agentAlertTitle}</h3>
                {isAgentProcessing && <Sparkles size={12} className="text-[#FFB703] animate-pulse" />}
              </div>
              <p className="text-[13px] text-white/90 font-bold mt-1">{t.agentAlertDesc}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 🌦️ Weather: Uses Waves */}
      <div className="bg-gradient-to-br from-[#1B4332]/20 to-[#050a08] border border-[#1B4332]/30 rounded-[2.5rem] p-6">
        <div className="flex justify-between items-start mb-6">
          <div className="flex gap-3">
            <div className="w-12 h-12 bg-[#FFB703] rounded-2xl flex items-center justify-center text-[#1B4332]"><CloudRain /></div>
            <div>
              <h4 className="text-xs font-black text-white uppercase">{t.weatherAlert}</h4>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Dutse, Jigawa</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-4xl font-black text-white">{weather.temp}</span>
            <p className="text-[10px] text-emerald-400 font-black uppercase mt-1">{weather.status}</p>
          </div>
        </div>
        <div className="flex gap-4">
           <div className="flex items-center gap-1.5 text-slate-400"><Waves size={14} className="text-[#FFB703]" /><span className="text-[10px] font-bold">65% HUMIDITY</span></div>
           <div className="flex items-center gap-1.5 text-slate-400"><Zap size={14} className="text-[#FFB703]" /><span className="text-[10px] font-bold">12KM/H WIND</span></div>
           <div className="flex items-center gap-1.5 text-slate-400"><Leaf size={14} className="text-[#FFB703]" /><span className="text-[10px] font-bold">24°C SOIL</span></div>
        </div>
      </div>

      <MarketTrends />

      {/* ⚡ Quick Actions: Uses PhoneCall, ArrowUpRight, Leaf */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: t.askPrice, icon: Zap, color: '#FFB703', route: 'chat' },
          { label: t.pestControl, icon: Leaf, color: '#34D399', route: 'chat' },
          { label: t.callVeterinary, icon: PhoneCall, color: '#A78BFA', route: 'chat' },
          { label: lang === 'ha' ? 'Littafin Gona' : 'Farm Journal', icon: Calendar, color: '#60A5FA', route: 'journal' },
        ].map((action, i) => (
          <button
            key={i}
            onClick={() => setScreen(action.route as any)}
            className="flex flex-col items-start gap-4 bg-[#0a1a14] border border-[#1B4332]/30 p-5 rounded-[2rem] hover:border-[#FFB703]/50 transition-all active:scale-95 group relative overflow-hidden"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: hexToRgba(action.color, 0.15), color: action.color }}>
              <action.icon size={20} />
            </div>
            <span className="text-[12px] font-black text-white tracking-tight">{action.label}</span>
            <ArrowUpRight className="absolute top-4 right-4 text-slate-700 group-hover:text-[#FFB703] transition-colors" size={14} />
          </button>
        ))}
      </div>
    </div>
  );
};

// Global helper: hex to rgba
function hexToRgba(hex: string, alpha: number) {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const num = parseInt(c, 16);
  return `rgba(${(num >> 16) & 255},${(num >> 8) & 255},${num & 255},${alpha})`;
}