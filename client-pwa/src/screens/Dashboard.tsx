import React, { useCallback, useEffect, useState } from 'react';
import { BookOpen, Camera, ChevronRight, CloudSun, MessageCircle, ShieldCheck, User } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { supabase } from '../lib/supabase';
import { api } from '../lib/api';

interface WeatherState {
  temperature: string;
  status: string;
  loaded: boolean;
}

export const Dashboard: React.FC = () => {
  const { lang, setScreen } = useAppStore();
  const isHa = lang === 'ha';
  const [userName, setUserName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const copy = isHa ? {
    welcome: 'Barka da zuwa',
    fallbackName: 'Manomi',
    intro: 'Samu bayanan noma cikin Hausa ko Turanci.',
    askTitle: 'Tambayi AgroLingo',
    askBody: 'Yi tambaya game da amfanin gona, kwari, yanayi ko shirye-shiryen noma.',
    askCta: 'Fara tambaya',
    tools: 'Kayan aikin gwaji',
    photoTitle: 'Tambaya da hoto',
    photoBody: 'Ƙara hoton amfanin gona domin bayyana alamun da ake gani.',
    weatherTitle: 'Yanayin sama',
    weatherBody: 'Duba yanayin wurin da kake da izininka.',
    climateTitle: 'Shirin yanayi',
    climateBody: 'Tambayi yadda za a shirya wa jinkirin ruwa, fari ko ambaliya.',
    trustTitle: 'Manhajar gwaji ce',
    trustBody: 'AgroLingo na ba da bayanai na farko. A tabbatar da manyan shawarwarin noma da ƙwararren jami’in gona.',
    unavailable: 'Ba a samu yanayi ba',
    permission: 'Ana buƙatar izinin wuri',
  } : {
    welcome: 'Welcome back',
    fallbackName: 'Farmer',
    intro: 'Access agricultural information in Hausa or English.',
    askTitle: 'Ask AgroLingo',
    askBody: 'Ask about crops, pests, weather or farm planning in clear language.',
    askCta: 'Start a question',
    tools: 'Pilot tools',
    photoTitle: 'Ask with a photo',
    photoBody: 'Add a crop photo so AgroLingo can describe visible signs.',
    weatherTitle: 'Local weather',
    weatherBody: 'View current conditions using your location permission.',
    climateTitle: 'Climate planning',
    climateBody: 'Ask how to prepare for delayed rain, drought or flooding.',
    trustTitle: 'Early pilot',
    trustBody: 'AgroLingo provides preliminary information. Verify high-risk farm decisions with a qualified local expert.',
    unavailable: 'Weather unavailable',
    permission: 'Location permission required',
  };

  const geolocationAvailable = typeof navigator !== 'undefined' && 'geolocation' in navigator;
  const [weather, setWeather] = useState<WeatherState>(() => geolocationAvailable
    ? { temperature: '--', status: '', loaded: false }
    : { temperature: '--', status: copy.permission, loaded: true });

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', user.id)
        .maybeSingle();
      if (data?.full_name) setUserName(data.full_name.split(' ')[0]);
      if (data?.avatar_url) setAvatarUrl(data.avatar_url);
    };
    loadProfile();
  }, []);

  const loadWeather = useCallback(async (latitude: number, longitude: number) => {
    const { data } = await api.weather(latitude, longitude);
    if (!data) {
      setWeather({ temperature: '--', status: copy.unavailable, loaded: true });
      return;
    }
    const status = data.rain > 0
      ? (isHa ? 'Ana samun ruwan sama' : 'Rain reported')
      : data.temp > 36
        ? (isHa ? 'Zafi mai ƙarfi' : 'High heat')
        : (isHa ? 'Babu ruwan sama a yanzu' : 'No current rain');
    setWeather({ temperature: `${Math.round(data.temp)}°`, status, loaded: true });
  }, [copy.unavailable, isHa]);

  useEffect(() => {
    if (!geolocationAvailable) return;
    navigator.geolocation.getCurrentPosition(
      position => loadWeather(position.coords.latitude, position.coords.longitude),
      () => setWeather({ temperature: '--', status: copy.permission, loaded: true }),
      { timeout: 15_000, maximumAge: 300_000, enableHighAccuracy: false },
    );
  }, [copy.permission, geolocationAvailable, loadWeather]);

  const tools = [
    { Icon: Camera, title: copy.photoTitle, body: copy.photoBody, onClick: () => setScreen('chat') },
    { Icon: CloudSun, title: copy.weatherTitle, body: copy.weatherBody, onClick: () => setScreen('weather') },
    { Icon: BookOpen, title: copy.climateTitle, body: copy.climateBody, onClick: () => setScreen('chat') },
  ];

  return (
    <div className="premium-page">
      <section className="premium-dashboard">
        <div className="dashboard-welcome">
          <button className="avatar-button" onClick={() => setScreen('profile')} aria-label={isHa ? 'Bude bayanan asusu' : 'Open profile'}>
            {avatarUrl
              ? <img src={avatarUrl} alt="" />
              : <User size={21} aria-hidden="true" />}
          </button>
          <div>
            <p className="eyebrow">{copy.welcome}</p>
            <h1>{userName || copy.fallbackName}</h1>
            <p className="dashboard-intro">{copy.intro}</p>
          </div>
        </div>

        <button className="ask-hero" onClick={() => setScreen('chat')}>
          <span className="ask-hero-icon"><MessageCircle size={25} aria-hidden="true" /></span>
          <span className="ask-hero-copy">
            <strong>{copy.askTitle}</strong>
            <span>{copy.askBody}</span>
          </span>
          <span className="ask-hero-action">{copy.askCta}<ChevronRight size={18} aria-hidden="true" /></span>
        </button>

        <div className="dashboard-section-heading">
          <h2>{copy.tools}</h2>
          <span>{isHa ? 'Gwaji' : 'Pilot'}</span>
        </div>

        <div className="tool-list">
          {tools.map(({ Icon, title, body, onClick }) => (
            <button key={title} className="tool-row" onClick={onClick}>
              <span className="tool-icon"><Icon size={20} aria-hidden="true" /></span>
              <span className="tool-copy"><strong>{title}</strong><span>{body}</span></span>
              <ChevronRight size={18} aria-hidden="true" />
            </button>
          ))}
        </div>

        <button className="weather-summary" onClick={() => setScreen('weather')}>
          <span><CloudSun size={22} aria-hidden="true" /></span>
          <span className="weather-summary-copy">
            <strong>{copy.weatherTitle}</strong>
            <small>{weather.loaded ? weather.status : (isHa ? 'Ana dubawa…' : 'Checking…')}</small>
          </span>
          <b>{weather.loaded ? weather.temperature : '—'}</b>
        </button>

        <aside className="pilot-notice">
          <ShieldCheck size={20} aria-hidden="true" />
          <div><strong>{copy.trustTitle}</strong><p>{copy.trustBody}</p></div>
        </aside>
      </section>
    </div>
  );
};
