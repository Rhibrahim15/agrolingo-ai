import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, ArrowUpRight, TrendingUp, TrendingDown, Minus, Moon, Sun, User, RefreshCw } from 'lucide-react';
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
  if (trend === 'up')     return <TrendingUp  size={13} style={{ color: 'var(--brand-primary)' }} />;
  if (trend === 'down')   return <TrendingDown size={13} style={{ color: '#F87171' }} />;
  return <Minus size={13} style={{ color: 'var(--slate-400)' }} />;
};

const SkeletonLine = ({ w = '100%', h = 14 }: { w?: string; h?: number }) => (
  <div className="skeleton" style={{ width: w, height: h, borderRadius: 8 }} />
);

const CROP_EMOJIS = ['🌽', '🍅', '🌾', '🥜', '🫘', '🍠', '🥕', '🥔', '🥬', '🌻', '🍎', '🍉'];

// ── Dashboard ─────────────────────────────────────────────────
export const Dashboard: React.FC = () => {
  const { lang, setScreen, theme, setTheme } = useAppStore();
  const t = translations[lang as keyof typeof translations] || translations.en;
  const isHa = lang === 'ha';

  // Profile data is loaded per authenticated user. Never use a shared browser cache.
  const [userName, setUserName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState('');
  const [weather, setWeather] = useState<WeatherState>({ temp: '', status: '', plantingIndex: '', loaded: false });
  const [market, setMarket] = useState<MarketItem[]>([]);
  const [cropIndex, setCropIndex] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);
  
  // Pull-to-refresh State
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const isPulling = useRef(false);

  // Time-based greeting
  const greeting = (() => {
    const h = new Date().getHours();
    if (lang === 'ha') return h < 12 ? 'Barka da safiya' : h < 17 ? 'Barka da rana' : 'Barka da yamma';
    if (lang === 'fr') return h < 18 ? 'Bonjour' : 'Bonsoir';
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  })();

  // Fetch user name
  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('profiles').select('full_name, location, avatar_url').eq('id', user.id).maybeSingle();
      if (data) {
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
        data.rain > 0      ? (lang === 'ha' ? 'Ana Ruwan Sama' : lang === 'fr' ? 'Alerte Pluie' : 'Rain Alert') :
        data.temp > 36     ? (lang === 'ha' ? 'Zafi Mai Ƙarfi' : lang === 'fr' ? 'Forte Chaleur' : 'High Heat')  :
                             (lang === 'ha' ? 'Yanayi Mai Kyau' : lang === 'fr' ? 'Optimal' : 'Optimal');
      setWeather({ temp: `${Math.round(data.temp)}°`, status, plantingIndex: data.planting_index, locationName: data.locationName, loaded: true });
    } catch {
      setWeather({
        temp: '--',
        status: lang === 'ha' ? 'Ba a samu bayanan yanayi ba' : lang === 'fr' ? 'Météo indisponible' : 'Weather unavailable',
        plantingIndex: 'Unavailable',
        locationName: userLocation || undefined,
        loaded: true,
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
        { timeout: 30000, maximumAge: 60000 }
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

  // ── Pull-to-Refresh Logic ──
  const handleRefresh = async () => {
    setIsRefreshing(true);
    
    const p1 = supabase
      .from('market_intelligence')
      .select('crop_name, price_per_measure, trend, change_percent, insight')
      .order('crop_name')
      .limit(4)
      .then(({ data }) => { if (data) setMarket(data as MarketItem[]); });

    const p2 = new Promise<void>((resolve) => {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => loadWeather(pos.coords.latitude, pos.coords.longitude).then(resolve),
          () => loadWeather().then(resolve),
          { timeout: 10000, maximumAge: 0 } // Force fresh fetch
        );
      } else {
        loadWeather().then(resolve);
      }
    });

    await Promise.all([p1, p2]);
    setIsRefreshing(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const mainEl = document.querySelector('main');
    if (!mainEl || mainEl.scrollTop <= 0) {
      startY.current = e.touches[0].clientY;
      isPulling.current = true;
    } else {
      isPulling.current = false;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling.current) return;
    const dist = e.touches[0].clientY - startY.current;
    if (dist > 0) setPullDistance(Math.min(dist * 0.4, 70)); // Add friction
    else setPullDistance(0);
  };

  const handleTouchEnd = async () => {
    if (!isPulling.current) return;
    isPulling.current = false;
    if (pullDistance >= 50 && !isRefreshing) await handleRefresh();
    setPullDistance(0);
  };

  const trendColor = (t: 'up' | 'down' | 'stable') =>
    t === 'up' ? '#4ADE80' : t === 'down' ? '#F87171' : 'var(--slate-400)';
    
  const tipsEn = [
    'Soil moisture looks optimal for today.',
    'Keep an eye out for pests in this heat.',
    'Maize prices are trending up, check the market.',
    'Perfect time to review your crop health.',
    'Consider applying fertilizer before the next rain.',
    'Market demand for tomatoes is rising this week.',
    'Great day to update your farm journal!'
  ];
  const tipsHa = [
    'Danshin ƙasa yana da kyau a yau.',
    'Kula da kwari a wannan yanayin zafi.',
    'Farashin masara yana tashi, duba kasuwa.',
    'Lokaci yayi da za a duba lafiyar shuka.',
    'Ana shawartar a sa taki kafin ruwan sama na gaba.',
    'Ana neman tumatir sosai a kasuwa wannan makon.',
    'Wata rana mai kyau don sabunta littafin gonar ku!'
  ];
  const tipsFr = [
    'L\'humidité du sol semble optimale aujourd\'hui.',
    'Surveillez les parasites avec cette chaleur.',
    'Les prix du maïs sont en hausse, vérifiez le marché.',
    'Moment idéal pour vérifier la santé de vos cultures.',
    'Pensez à appliquer de l\'engrais avant la prochaine pluie.',
    'La demande de tomates augmente cette semaine.',
    'Excellente journée pour mettre à jour votre journal de ferme !'
  ];
  const dynamicTips = lang === 'ha' ? tipsHa : lang === 'fr' ? tipsFr : tipsEn;
  
  // Automatically rotate AI insights every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => setTipIndex(prev => (prev + 1) % dynamicTips.length), 8000);
    return () => clearInterval(interval);
  }, [dynamicTips.length]);
  const insightOfDay = dynamicTips[tipIndex];

  // Determine seasonal advice based on current month (Nigeria focus)
  const getSeasonalAdvice = () => {
    const m = new Date().getMonth(); // 0-11
    let seasonEn = ''; let seasonHa = ''; let seasonFr = '';
    let actionEn = ''; let actionHa = ''; let actionFr = '';

    if (m >= 3 && m <= 4) { // Apr-May
      seasonEn = 'Pre-Season'; seasonHa = 'Gabanin Damina'; seasonFr = 'Pré-saison';
      actionEn = 'Prepare Land'; actionHa = 'Shirin Gona'; actionFr = 'Préparer la Terre';
    } else if (m >= 5 && m <= 8) { // Jun-Sep
      seasonEn = 'Rainy Season'; seasonHa = 'Damina'; seasonFr = 'Saison des Pluies';
      actionEn = 'Planting Time'; actionHa = 'Lokacin Shuka'; actionFr = 'Temps de Plantation';
    } else if (m >= 9 && m <= 10) { // Oct-Nov
      seasonEn = 'Harvest Season'; seasonHa = 'Kaka'; seasonFr = 'Saison des Récoltes';
      actionEn = 'Ready to Harvest'; actionHa = 'Lokacin Girbi'; actionFr = 'Prêt à Récolter';
    } else { // Dec-Mar
      seasonEn = 'Dry Season'; seasonHa = 'Rani'; seasonFr = 'Saison Sèche';
      actionEn = 'Irrigation Only'; actionHa = 'Noman Raba'; actionFr = 'Irrigation Uniquement';
    }

    if (weather.plantingIndex === 'Wait') {
      actionEn = 'Hold Off (Extreme Weather)';
      actionHa = 'Dakata Tukunna (Sama Ba Kyau)';
      actionFr = 'Patienter (Météo Extrême)';
    }

    return { season: lang === 'ha' ? seasonHa : lang === 'fr' ? seasonFr : seasonEn, action: lang === 'ha' ? actionHa : lang === 'fr' ? actionFr : actionEn };
  };
  const seasonal = getSeasonalAdvice();

  return (
    <div 
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ position: 'relative', minHeight: '100%', overflowX: 'hidden', background: 'var(--surface-0)' }}
    >
      
      {/* ── Pull-to-Refresh Indicator ── */}
      <div style={{
        height: isRefreshing ? 60 : pullDistance,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
        transition: isPulling.current ? 'none' : 'height 0.3s ease',
      }}>
        <motion.div
          animate={{ rotate: isRefreshing ? 360 : pullDistance * 4 }}
          transition={isRefreshing ? { repeat: Infinity, duration: 1, ease: 'linear' } : { duration: 0 }}
          style={{ display: 'flex', color: 'var(--brand-primary)', opacity: isRefreshing ? 1 : Math.min(pullDistance / 40, 1) }}
        >
          <RefreshCw size={24} />
        </motion.div>
      </div>

      <div
        style={{
          padding: '24px 16px',
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
            {avatarUrl ? <img src={avatarUrl} alt="User" decoding="async" fetchPriority="high" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={20} style={{ color: 'var(--slate-500)' }} />}
          </motion.div>
          <div>
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            color: 'var(--brand-primary)',
              marginBottom: 4,
            }}
          >
            {greeting}
          </p>
          <h1

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
            {userName ? `${userName} 👋` : lang === 'ha' ? 'Manomi' : lang === 'fr' ? 'Agriculteur' : 'Farmer'}
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
          padding: '20px',
          position: 'relative',
          overflow: 'hidden',
        }}
        whileTap={{ scale: 0.98 }}
      >
      {/* Animated Mastercard Orbs */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: 'var(--r-2xl)', pointerEvents: 'none', zIndex: 0 }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
            style={{ position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%' }}
          >
            <div style={{ position: 'absolute', top: '25%', left: '25%', width: '30%', height: '30%', background: 'var(--brand-primary)', filter: 'blur(40px)', opacity: 0.55, borderRadius: '50%' }} />
            <div style={{ position: 'absolute', bottom: '25%', right: '25%', width: '30%', height: '30%', background: 'var(--gold)', filter: 'blur(40px)', opacity: 0.55, borderRadius: '50%' }} />
          </motion.div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, position: 'relative', zIndex: 1 }}>
          {/* Logo */}
          <div style={{
            width: 48, height: 48, borderRadius: 14, flexShrink: 0,
            background: 'var(--surface-2)',
            border: '1px solid var(--border-hover)',
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
              <span className="t-label" style={{ color: 'var(--brand-primary)' }}>
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
              color: 'var(--brand-primary)',
              letterSpacing: '-0.01em',
            }}>
            {lang === 'ha' ? 'Tambayi AI →' : lang === 'fr' ? 'Demander à l\'IA →' : 'Ask AI →'}
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
            {lang === 'ha' ? 'Yanayin Sama' : lang === 'fr' ? 'Météo' : 'Weather'}
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
            {lang === 'ha' ? 'Shawarar Noma' : lang === 'fr' ? 'Conseil Agricole' : 'Farm Advice'}
          </p>
          {weather.loaded ? (
            <>
              <p style={{
                fontFamily: 'var(--font-display)',
                fontSize: 18,
                fontWeight: 800,
                letterSpacing: '-0.02em',
                color: weather.plantingIndex === 'Optimal' ? 'var(--brand-primary)' :
                       weather.plantingIndex === 'Good'    ? 'var(--brand-primary-hover)' :
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
                  {weather.locationName || (userLocation ? userLocation.split(',')[0] : (lang === 'ha' ? 'Gida' : lang === 'fr' ? 'Domicile' : 'Home'))}
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
          { label: lang === 'ha' ? 'Tambayi Farashi' : lang === 'fr' ? 'Demander le Prix' : 'Ask Price', icon: '📈', route: 'chat', accent: 'var(--gold)' },
          { label: lang === 'ha' ? 'Gano Cuta' : lang === 'fr' ? 'Diagnostiquer' : 'Diagnose', icon: '🔬', route: 'chat', accent: 'var(--brand-primary)' },
          { label: lang === 'ha' ? 'Yanayin Sama' : lang === 'fr' ? 'Météo' : 'Weather', icon: '🌦️', route: 'weather', accent: '#60A5FA' },
          { label: lang === 'ha' ? 'Littafin Gona' : lang === 'fr' ? 'Journal' : 'Farm Journal', icon: '📔', route: 'journal', accent: '#A78BFA' },
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
            <p className="t-label">{lang === 'ha' ? 'Farashin Kasuwa' : lang === 'fr' ? 'Prix du Marché' : 'Market Prices'}</p>
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
            {lang === 'ha' ? 'Duba Duka →' : lang === 'fr' ? 'Voir Tout →' : 'See All →'}
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
