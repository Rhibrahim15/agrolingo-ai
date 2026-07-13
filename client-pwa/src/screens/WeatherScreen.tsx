import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, CloudRain, Sun, Wind, Droplets, CalendarDays, MapPinOff } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { api } from '../lib/api';

type WeatherResult = NonNullable<Awaited<ReturnType<typeof api.weather>>['data']>;

const isWetWeather = (code: number) => code >= 51;

export const WeatherScreen: React.FC = () => {
  const { setScreen, lang } = useAppStore();
  const isHa = lang === 'ha';
  const [weather, setWeather] = useState<WeatherResult | null>(null);
  const geolocationAvailable = typeof navigator !== 'undefined' && 'geolocation' in navigator;
  const [status, setStatus] = useState(() => geolocationAvailable
    ? (isHa ? 'Ana neman izinin wuri...' : 'Requesting location permission...')
    : (isHa ? 'Wannan na’ura ba ta goyi bayan gano wuri ba.' : 'This device does not support location services.'));

  useEffect(() => {
    let active = true;
    const load = async (lat: number, lon: number) => {
      const { data, error } = await api.weather(lat, lon);
      if (!active) return;
      if (data) {
        setWeather(data);
        setStatus(isHa ? 'Wurin da kake yanzu' : 'Your current location');
      } else {
        setStatus(error || (isHa ? 'Ba a samu bayanan yanayi ba.' : 'Weather information is unavailable.'));
      }
    };

    if (!geolocationAvailable) return () => { active = false; };

    navigator.geolocation.getCurrentPosition(
      (position) => load(position.coords.latitude, position.coords.longitude),
      () => setStatus(isHa ? 'Ana buƙatar izinin wuri don nuna yanayin yankinka.' : 'Location permission is required to show local weather.'),
      { timeout: 20_000, maximumAge: 300_000, enableHighAccuracy: false },
    );

    return () => { active = false; };
  }, [geolocationAvailable, isHa]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', background: 'var(--surface-0)', overflowX: 'hidden' }}>
      <header style={{ padding: '24px 16px', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, background: 'var(--surface-glass)', backdropFilter: 'blur(12px)', zIndex: 10 }}>
        <button onClick={() => setScreen('dashboard')} className="btn-icon" aria-label={isHa ? 'Koma baya' : 'Go back'}>
          <ChevronLeft size={20} />
        </button>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>
          {isHa ? 'Yanayin Sama' : 'Weather'}
        </h1>
      </header>

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 24 }}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card glass" style={{ background: 'var(--grad-weather)', padding: '32px 24px', textAlign: 'center' }}>
          {weather ? (
            <>
              {isWetWeather(weather.weatherCode) ? <CloudRain size={56} color="#60A5FA" /> : <Sun size={56} color="#FBBF24" />}
              <h2 style={{ fontSize: 64, fontFamily: 'var(--font-display)', fontWeight: 800, lineHeight: 1, color: 'var(--text-primary)', margin: '12px 0' }}>
                {Math.round(weather.temp)}°
              </h2>
              <p style={{ color: 'var(--sprout)', fontWeight: 600 }}>
                {isWetWeather(weather.weatherCode) ? (isHa ? 'Ruwan sama ko yayyafi' : 'Rain or drizzle') : (isHa ? 'Babu ruwan sama a yanzu' : 'No current rain')}
              </p>
              <p style={{ fontSize: 13, color: 'var(--slate-400)', marginTop: 6 }}>{status}</p>
              <div style={{ display: 'flex', gap: 32, marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--border)', justifyContent: 'center' }}>
                <div><Droplets size={20} color="#60A5FA" /><span style={{ display: 'block', marginTop: 6 }}>{weather.rain} mm</span></div>
                <div><Wind size={20} color="#A3B8AB" /><span style={{ display: 'block', marginTop: 6 }}>{Math.round(weather.windSpeed)} km/h</span></div>
              </div>
            </>
          ) : (
            <div style={{ padding: '28px 8px' }}>
              <MapPinOff size={48} style={{ margin: '0 auto 16px', color: 'var(--text-muted)' }} />
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{status}</p>
            </div>
          )}
        </motion.div>

        {weather?.forecast.length ? (
          <section aria-labelledby="forecast-heading">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, paddingLeft: 4 }}>
              <CalendarDays size={20} color="var(--brand-primary)" />
              <h3 id="forecast-heading" style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
                {isHa ? 'Hasashen Kwanaki 7' : '7-day forecast'}
              </h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {weather.forecast.map((day) => {
                const date = new Date(`${day.date}T12:00:00`);
                return (
                  <div key={day.date} className="card" style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', alignItems: 'center', gap: 16, padding: '14px 16px' }}>
                    <div>
                      <strong style={{ color: 'var(--text-primary)' }}>{date.toLocaleDateString(isHa ? 'ha-NG' : 'en-NG', { weekday: 'long' })}</strong>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>{date.toLocaleDateString(isHa ? 'ha-NG' : 'en-NG', { day: 'numeric', month: 'short' })}</div>
                    </div>
                    <span style={{ color: '#60A5FA', fontSize: 13 }}>{day.precipitationProbability}%</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{Math.round(day.temperatureMax)}°</strong>
                  </div>
                );
              })}
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: 12, lineHeight: 1.5, marginTop: 14 }}>
              {isHa
                ? 'Hasashen yanayi na iya canzawa. A sake dubawa kafin yanke shawarar noma.'
                : 'Forecasts can change. Check again before making weather-sensitive farm decisions.'}
            </p>
          </section>
        ) : null}
      </div>
    </div>
  );
};
