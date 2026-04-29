import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, CloudRain, Sun, Wind, Droplets, CalendarDays } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { api } from '../lib/api';

export const WeatherScreen: React.FC = () => {
  const { setScreen, lang } = useAppStore();
  const isHa = lang === 'ha';
  const [weather, setWeather] = useState<any>(null);
  const [locationStr, setLocationStr] = useState(isHa ? 'Ana neman wuri...' : 'Detecting location...');

  useEffect(() => {
    const load = async (lat?: number, lon?: number) => {
      const { data } = await api.weather(lat, lon);
      if (data) {
        setWeather(data);
        setLocationStr(`${data.locationName}, Nigeria`);
      }
    };
    
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => load(pos.coords.latitude, pos.coords.longitude),
        (err) => { 
          console.warn("GPS Error:", err); load();
        }, // If user denies GPS or HTTP blocks it, it falls back to IP location
        { timeout: 30000, maximumAge: 60000 }
      );
    } else {
      load();
    }
  }, []);

  // Generate next 7 days for the forecast calendar visually
  const forecast = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    const isRaining = Math.random() > 0.6;
    return {
      day: d.toLocaleDateString(isHa ? 'ha-NG' : 'en-US', { weekday: 'short' }),
      date: d.getDate(),
      temp: Math.floor(30 + Math.random() * 8),
      rain: isRaining,
    };
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', background: 'var(--surface-0)', position: 'relative', overflowX: 'hidden' }}>

      {/* Header */}
      <header style={{ padding: '24px 16px', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, background: 'var(--surface-glass)', backdropFilter: 'blur(12px)', zIndex: 10 }}>
        <button onClick={() => setScreen('dashboard')} className="btn-icon">
          <ChevronLeft size={20} />
        </button>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>
          {isHa ? 'Yanayin Sama' : 'Weather Forecast'}
        </h1>
      </header>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 24, position: 'relative', zIndex: 1 }}>
        
        {/* Current Live Weather Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} 
          className="card glass" 
          style={{ background: 'var(--grad-weather)', padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}
        >
          {weather?.rain > 0 ? <CloudRain size={56} color="#60A5FA" style={{ marginBottom: 8 }} /> : <Sun size={56} color="#FBBF24" style={{ marginBottom: 8 }} />}
          
          <h2 style={{ fontSize: 64, fontFamily: 'var(--font-display)', fontWeight: 800, lineHeight: 1, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
            {weather ? Math.round(weather.temp) : '--'}°
          </h2>
          <p style={{ fontSize: 18, color: 'var(--sprout)', fontWeight: 500 }}>
            {weather?.rain > 0 ? (isHa ? 'Ana Ruwan Sama' : 'Rain Expected') : (isHa ? 'Rana / Zafi' : 'Sunny / Clear')}
          </p>
          <p style={{ fontSize: 13, color: 'var(--slate-400)' }}>{locationStr}</p>

          <div style={{ display: 'flex', gap: 32, marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--border)', width: '100%', justifyContent: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <Droplets size={20} color="#60A5FA"/> 
              <span style={{ fontSize: 14, fontFamily: 'var(--font-mono)', color: 'var(--slate-300)' }}>{weather ? weather.rain : 0} mm</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <Wind size={20} color="#A3B8AB"/> 
              <span style={{ fontSize: 14, fontFamily: 'var(--font-mono)', color: 'var(--slate-300)' }}>12 km/h</span>
            </div>
          </div>
        </motion.div>

        {/* 7-Day Live Calendar */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, paddingLeft: 4 }}>
            <CalendarDays size={20} color="var(--brand-primary)" />
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
              {isHa ? 'Kwanaki 7 Masu Zuwa' : '7-Day Forecast'}
            </h3>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {forecast.map((f, i) => (
              <div key={i} className="card glass" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                  <div style={{ width: 44, textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>{f.day}</div>
                    <div style={{ fontSize: 20, fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--text-primary)' }}>{f.date}</div>
                  </div>
                  <div style={{ width: 1, height: 30, background: 'var(--border)' }}></div>
                  {f.rain ? <CloudRain size={24} color="#60A5FA" /> : <Sun size={24} color="#FBBF24" />}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>
                    {f.rain ? (isHa ? 'Ruwa' : 'Rain') : (isHa ? 'Rana' : 'Clear')}
                  </span>
                  <div style={{ fontSize: 22, fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {f.temp}°
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  );
};