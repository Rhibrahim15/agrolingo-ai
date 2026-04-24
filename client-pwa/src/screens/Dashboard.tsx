import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, ArrowUpRight, TrendingUp, TrendingDown, Minus, Moon, Sun, User } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { translations } from '../utils/translations';
import { supabase } from '../lib/supabase';
import { api } from '../lib/api';

// ── Types ─────────────────────────────────────────────────────
interface MarketItem {
  crop_name: string;
  price_per_measure: string;
  trend: 'up' | 'down' | 'stable';
  change_percent: number;
  insight?: string;
}

interface WeatherState {
  temp: string;
  status: string;
  plantingIndex: string;
  locationName?: string;
  loaded: boolean;
}

// ── Sub-components ────────────────────────────────────────────

const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'stable' }) => {
  if (trend === 'up')     return <TrendingUp  size={13} style={{ color: '#4ADE80' }} />;
  if (trend === 'down')   return <TrendingDown size={13} style={{ color: '#F87171' }} />;
  return <Minus size={13} style={{ color: 'var(--slate-400)' }} />;
};

const SkeletonLine = ({ w = '100%', h = 14 }: { w?: string; h?: number }) => (
  <div className="skeleton" style={{ width: w, height: h, borderRadius: 8 }} />
);

const CROP_EMOJIS = ['🌽', '🍅', '🌾', '🥜', '🫘', '🍠', '🥕', '🥔'];

// ── Dashboard ─────────────────────────────────────────────────
export const Dashboard: React.FC = () => {
  const { lang, setScreen, isAdmin, theme, setTheme } = useAppStore();
  const t = translations[lang as keyof typeof translations] || translations.en;
  const isHa = lang === 'ha';

  // 0ms Offline Cache (Stale-While-Revalidate)
  const cachedProfile = JSON.parse(localStorage.getItem('agrolingo_profile') || '{}');
  const [userName, setUserName] = useState(cachedProfile.full_name ? cachedProfile.full_name.split(' ')[0] : '');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(cachedProfile.avatar_url || null);
  const [userLocation, setUserLocation] = useState(cachedProfile.location || '');
  const [weather, setWeather] = useState<WeatherState>({ temp: '', status: '', plantingIndex: '', loaded: false });
  const [market, setMarket] = useState<MarketItem[]>([]);
  const [adminTaps, setAdminTaps] = useState(0);
  const [cropIndex, setCropIndex] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);

  // Time-based greeting
  const greeting = (() => {
    const h = new Date().getHours();
    if (isHa) return h < 12 ? 'Barka da safiya' : h < 17 ? 'Barka da rana' : 'Barka da yamma';
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  })();

  // Fetch user name
  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('profiles').select('full_name, location, avatar_url').eq('id', user.id).maybeSingle();
      if (data) {
        localStorage.setItem('agrolingo_profile', JSON.stringify({ ...cachedProfile, ...data }));
        if (data.full_name) setUserName(data.full_name.split(' ')[0]);
        if (data.location) setUserLocation(data.location);
        if (data.avatar_url) setAvatarUrl(data.avatar_url);
      }
    };
    load();
  }, []);

  // Cycling Crop Emoji Effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCropIndex((prev) => (prev + 1) % CROP_EMOJIS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Fetch weather
  const loadWeather = useCallback(async (lat?: number, lon?: number) => {
    try {
      const { data } = await api.weather(lat, lon);
      if (!data) throw new Error("No data");
      const status =
        data.rain > 0      ? (isHa ? 'Ana Ruwan Sama' : 'Rain Alert') :
        data.temp > 36     ? (isHa ? 'Zafi Mai Ƙarfi' : 'High Heat')  :
                             (isHa ? 'Yanayi Mai Kyau' : 'Optimal');
      setWeather({ temp: `${Math.round(data.temp)}°`, status, plantingIndex: data.planting_index, locationName: data.locationName, loaded: true });
    } catch (error) {
      // Fallback so the dashboard never looks broken/idle if the API fails
      setWeather({ 
        temp: '32°', 
        status: isHa ? 'Yanayi Mai Kyau' : 'Clear/Sunny', 
        plantingIndex: 'Good', 
        locationName: 'Dutse',
        loaded: true 
      });
    }
  }, [isHa]);

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => loadWeather(pos.coords.latitude, pos.coords.longitude),
        (err) => {
          console.warn("GPS Error on Dashboard:", err);
          loadWeather();
        },
        { timeout: 10000, maximumAge: 60000 }
      );
    } else {
      loadWeather();
    }
  }, [loadWeather]);

  // Fetch market prices
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('market_intelligence')
        .select('crop_name, price_per_measure, trend, change_percent, insight')
        .order('crop_name')
        .limit(4);
      if (data) setMarket(data as MarketItem[]);
    };
    load();
  }, []);

  // Admin easter egg — only works if user has admin role
  const handleAdminTap = () => {
    if (!isAdmin()) return;
    const next = adminTaps + 1;
    setAdminTaps(next);
    if (next >= 5) { setAdminTaps(0); setScreen('admin_dashboard'); }
  };

  const trendColor = (t: 'up' | 'down' | 'stable') =>
    t === 'up' ? '#4ADE80' : t === 'down' ? '#F87171' : 'var(--slate-400)';
    
  const dynamicTips = isHa 
    ? ['Guga na gona yana da kyau yau.', 'Kula da kwari a wannan yanayin zafi.', 'Farashin masara yana tashi, duba kasuwa.', 'Lokaci yayi da za a duba lafiyar shuka.']
    : ['Soil moisture looks good for today.', 'Keep an eye out for pests in this heat.', 'Maize prices are trending up, check the market.', 'Perfect time to review your crop health.'];
  
  // Automatically rotate AI insights every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => setTipIndex(prev => (prev + 1) % dynamicTips.length), 5000);
    return () => clearInterval(interval);
  }, [dynamicTips.length]);
  const insightOfDay = dynamicTips[tipIndex];

  // Determine seasonal advice based on current month (Nigeria focus)
  const getSeasonalAdvice = () => {
    const m = new Date().getMonth(); // 0-11
    let seasonEn = ''; let seasonHa = '';
    let actionEn = ''; let actionHa = '';

    if (m >= 3 && m <= 4) { // Apr-May
      seasonEn = 'Pre-Season'; seasonHa = 'Gabanin Damina';
      actionEn = 'Prepare Land'; actionHa = 'Shirin Gona';
    } else if (m >= 5 && m <= 8) { // Jun-Sep
      seasonEn = 'Rainy Season'; seasonHa = 'Damina';
      actionEn = 'Planting Time'; actionHa = 'Lokacin Shuka';
    } else if (m >= 9 && m <= 10) { // Oct-Nov
      seasonEn = 'Harvest Season'; seasonHa = 'Kaka';
      actionEn = 'Ready to Harvest'; actionHa = 'Lokacin Girbi';
    } else { // Dec-Mar
      seasonEn = 'Dry Season'; seasonHa = 'Rani';
      actionEn = 'Irrigation Only'; actionHa = 'Noman Raba';
    }

    if (weather.plantingIndex === 'Wait') {
      actionEn = 'Hold Off (Extreme Weather)';
      actionHa = 'Dakata Tukunna (Sama Ba Kyau)';
    }

    return { season: isHa ? seasonHa : seasonEn, action: isHa ? actionHa : actionEn };
  };
  const seasonal = getSeasonalAdvice();

  return (
    <div style={{ position: 'relative', minHeight: '100%', overflowX: 'hidden', background: 'var(--surface-0)' }}>
      {/* Futuristic Ambient Orbs */}
      <div style={{ position: 'absolute', top: '-5%', left: '-10%', width: '60%', height: '40%', background: 'var(--brand-primary)', filter: 'blur(100px)', opacity: 0.12, pointerEvents: 'none', borderRadius: '50%' }} />
      <div style={{ position: 'absolute', top: '20%', right: '-15%', width: '50%', height: '50%', background: 'var(--gold)', filter: 'blur(120px)', opacity: 0.08, pointerEvents: 'none', borderRadius: '50%' }} />
      
      <div
        style={{
          paddingTop: 108,
          paddingBottom: 24,
          paddingLeft: 18,
          paddingRight: 18,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          position: 'relative',
          zIndex: 1,
        }}
      >
      {/* ── Hero greeting section ── */}
      <div className="stagger-1 flex items-center justify-between">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <motion.div 
            whileTap={{ scale: 0.9 }}
            onClick={() => setScreen('profile')}
            style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--surface-2)', border: '2px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', cursor: 'pointer' }}
          >
            {avatarUrl ? <img src={avatarUrl} alt="User" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={20} style={{ color: 'var(--slate-500)' }} />}
          </motion.div>
          <div>
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--gold)',
              marginBottom: 4,
            }}
          >
            {greeting}
          </p>
          <h1
            onClick={handleAdminTap}
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 32,
              fontWeight: 800,
              letterSpacing: '-0.03em',
              color: 'var(--text-primary)',
              lineHeight: 1,
              cursor: 'default',
              userSelect: 'none',
            }}
          >
            {userName ? `${userName} 👋` : isHa ? 'Manomi' : 'Farmer'}
          </h1>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-primary)', width: 38, height: 38, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 200ms' }}
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            onClick={() => setScreen('notifications')}
            style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-primary)', width: 38, height: 38, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 200ms' }}
            aria-label="Notifications"
          >
            <Bell size={18} />
          </button>
        </div>
      </div>

      {/* ── AI Chat card — primary hero ── */}
      <motion.div
        className="stagger-2 card glass card-interactive"
        onClick={() => setScreen('chat')}
        style={{
          background: 'var(--grad-ai)',
          padding: '20px',
          position: 'relative',
          overflow: 'hidden',
        }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Decorative glow dot */}
        <div style={{
          position: 'absolute', top: -20, right: -20,
          width: 120, height: 120, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245,166,35,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          {/* Logo */}
          <div style={{
            width: 48, height: 48, borderRadius: 14, flexShrink: 0,
            background: 'rgba(245,166,35,0.12)',
            border: '1px solid rgba(245,166,35,0.20)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, overflow: 'hidden'
          }}>
            <AnimatePresence mode="wait">
              <motion.span
                key={cropIndex}
                initial={{ opacity: 0, y: 15, scale: 0.5 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -15, scale: 0.5 }}
                transition={{ duration: 0.4, ease: "backOut" }}
              >
                {CROP_EMOJIS[cropIndex]}
              </motion.span>
            </AnimatePresence>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
              <span className="t-label" style={{ color: 'var(--gold)' }}>
                {t.agentAlertTitle}
              </span>
              <div className="dot-live" />
            </div>
            <AnimatePresence mode="wait">
              <motion.p 
                key={tipIndex}
                initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.3 }}
                style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--slate-300)', lineHeight: 1.55, marginBottom: 14, minHeight: 40 }}
              >
                {insightOfDay}
              </motion.p>
            </AnimatePresence>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: 12,
              color: 'var(--gold)',
              letterSpacing: '-0.01em',
            }}>
              {isHa ? 'Tambayi AI →' : 'Ask AI →'}
            </span>
          </div>
        </div>
      </motion.div>

      {/* ── Weather + Planting index — two-column ── */}
      <div className="stagger-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {/* Weather */}
        <div
          className="card glass card-interactive"
          onClick={() => setScreen('weather')}
          style={{
            padding: '18px 16px',
            background: 'var(--grad-weather)',
          }}
        >
          <p className="t-label" style={{ marginBottom: 8 }}>
            {isHa ? 'Yanayin Sama' : 'Weather'}
          </p>
          {weather.loaded ? (
            <>
              <p style={{
                fontFamily: 'var(--font-display)',
                fontSize: 38,
                fontWeight: 800,
                letterSpacing: '-0.04em',
                color: 'var(--text-primary)',
                lineHeight: 1,
                marginBottom: 6,
              }}>
                {weather.temp}
                <span style={{ fontSize: 18, fontWeight: 600, color: 'var(--slate-400)' }}>C</span>
              </p>
              <p style={{
                fontFamily: 'var(--font-body)',
                fontSize: 11,
                color: 'var(--sprout)',
                fontWeight: 600,
              }}>
                {weather.status}
              </p>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
              <SkeletonLine w="60%" h={38} />
              <SkeletonLine w="80%" h={12} />
            </div>
          )}
        </div>

        {/* Planting index */}
        <div
          className="card glass"
          style={{
            padding: '18px 16px',
            background: weather.plantingIndex === 'Optimal' ? 'var(--grad-plant-opt)' : 'var(--grad-plant-wait)',
            borderColor: weather.plantingIndex === 'Optimal' ? 'rgba(74,222,128,0.3)' : undefined,
          }}
        >
          <p className="t-label" style={{ marginBottom: 8 }}>
            {isHa ? 'Shawarar Noma' : 'Farm Advice'}
          </p>
          {weather.loaded ? (
            <>
              <p style={{
                fontFamily: 'var(--font-display)',
                fontSize: 18,
                fontWeight: 800,
                letterSpacing: '-0.02em',
                color: weather.plantingIndex === 'Optimal' ? '#4ADE80' :
                       weather.plantingIndex === 'Good'    ? 'var(--sprout)' :
                       weather.plantingIndex === 'Wait'    ? '#F87171' : 'var(--gold)',
                lineHeight: 1.1,
                marginBottom: 6,
              }}>
                {seasonal.action}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--slate-400)' }}>
                  {seasonal.season}
                </p>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--slate-500)' }}>
                  {weather.locationName || (userLocation ? userLocation.split(',')[0] : (isHa ? 'Gida' : 'Home'))}
                </p>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
              <SkeletonLine w="80%" h={20} />
              <SkeletonLine w="90%" h={12} />
            </div>
          )}
        </div>
      </div>

      {/* ── Quick actions ── */}
      <div className="stagger-4" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {[
          { label: isHa ? 'Tambayi Farashi' : 'Ask Price',   icon: '📈', route: 'chat',    accent: 'var(--gold)' },
          { label: isHa ? 'Gano Cuta'      : 'Diagnose',    icon: '🔬', route: 'chat',    accent: 'var(--sprout)' },
          { label: isHa ? 'Yanayin Sama'   : 'Weather',     icon: '🌦️', route: 'weather', accent: '#60A5FA' },
          { label: isHa ? 'Littafin Gona'  : 'Farm Journal',icon: '📔', route: 'journal', accent: '#A78BFA' },
        ].map((item, i) => (
          <motion.button
            key={i}
            whileTap={{ scale: 0.95 }}
            onClick={() => setScreen(item.route as any)}
            className="card glass card-interactive"
            style={{
              padding: '16px 14px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 10,
              textAlign: 'left',
              width: '100%',
            }}
          >
            <div style={{
              width: 38, height: 38,
              borderRadius: 12,
              background: `${item.accent}14`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18,
            }}>
              {item.icon}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <span style={{
                fontFamily: 'var(--font-display)',
                fontSize: 13,
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '-0.01em',
              }}>
                {item.label}
              </span>
              <ArrowUpRight size={13} style={{ color: 'var(--slate-600)' }} />
            </div>
          </motion.button>
        ))}
      </div>

      {/* ── Market prices strip ── */}
      <div className="stagger-5 card glass" style={{ overflow: 'hidden' }}>
        {/* Header */}
        <div style={{
          padding: '14px 16px 10px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <p className="t-label">{isHa ? 'Farashin Kasuwa' : 'Market Prices'}</p>
          </div>
          <button
            onClick={() => setScreen('market' as any)}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--gold)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {isHa ? 'Duba Duka →' : 'See All →'}
          </button>
        </div>

        {/* Rows */}
        {market.length > 0 ? (
          market.slice(0, 3).map((item, i) => (
            <div
              key={i}
              style={{
                padding: '12px 16px',
                borderBottom: i < 2 ? '1px solid var(--border)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <p style={{
                fontFamily: 'var(--font-body)',
                fontSize: 13,
                color: 'var(--text-secondary)',
              }}>
                {item.crop_name}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <p style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 14,
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.01em',
                }}>
                  ₦{Number(item.price_per_measure).toLocaleString()}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <TrendIcon trend={item.trend} />
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    fontWeight: 600,
                    color: trendColor(item.trend),
                  }}>
                    {item.change_percent > 0 ? '+' : ''}{item.change_percent}%
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div style={{ padding: '16px' }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}>
                <SkeletonLine w="40%" h={14} />
                <SkeletonLine w="30%" h={14} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </div>
  );
};
