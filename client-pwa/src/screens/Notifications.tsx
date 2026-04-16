import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, TrendingUp, CloudRain, ShieldAlert, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';

export const Notifications = () => {
  const { lang } = useAppStore();
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    const fetchAlerts = async () => {
      const { data } = await supabase
        .from('notification_history')
        .select('*')
        .order('created_at', { ascending: false });
      if (data) setAlerts(data);
    };
    fetchAlerts();
  }, []);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'market': return <TrendingUp className="text-[#FFB703]" />;
      case 'weather': return <CloudRain className="text-blue-400" />;
      case 'pest': return <ShieldAlert className="text-red-500" />;
      default: return <Bell className="text-emerald-500" />;
    }
  };

  return (
    <div className="p-6 pb-32 space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase">
            {lang === 'ha' ? 'Sanarwa' : 'Alerts'}
          </h1>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
            {alerts.filter(a => !a.is_read).length} New Messages
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {alerts.map((alert, i) => (
          <motion.div
            key={alert.id}
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: i * 0.05 }}
            className={`p-5 rounded-[2rem] border transition-all ${
              !alert.is_read 
                ? 'bg-[#1B4332]/20 border-[#FFB703]/30' 
                : 'bg-white/5 border-white/5 opacity-60'
            }`}
          >
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-2xl bg-black/20 flex items-center justify-center shrink-0">
                {getTypeIcon(alert.type)}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="text-sm font-black text-white uppercase tracking-tight">
                    {alert.title}
                  </h3>
                  <span className="text-[8px] font-bold text-slate-500 uppercase">
                    {new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {alert.message}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};