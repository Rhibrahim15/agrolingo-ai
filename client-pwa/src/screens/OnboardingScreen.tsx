import React from 'react';
import { Camera, CloudSun, MessageCircle, ShieldCheck } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const OnboardingScreen: React.FC = () => {
  const { lang, setLang, setScreen } = useAppStore();
  const isHa = lang === 'ha';

  const copy = isHa ? {
    eyebrow: 'AgroLingo · Gwajin farko',
    title: 'Bayanan noma cikin Hausa ko Turanci.',
    body: 'Yi tambaya, ƙara hoton amfanin gona, ko duba yanayin wurin da kake—duk a wuri guda.',
    ask: 'Yi tambayar noma cikin sauƙi.',
    photo: 'Ƙara hoto domin bayyana alamun da ake gani.',
    weather: 'Duba yanayin sama da izininka.',
    trust: 'A tabbatar da manyan shawarwarin noma da ƙwararren jami’in gona.',
    continue: 'Ci gaba',
    existing: 'Kana da asusu?',
    signIn: 'Shiga',
  } : {
    eyebrow: 'AgroLingo · Early pilot',
    title: 'Agricultural information in Hausa or English.',
    body: 'Ask a question, add a crop photo or check local weather—all in one focused mobile experience.',
    ask: 'Ask clear agricultural questions.',
    photo: 'Add a photo to describe visible crop signs.',
    weather: 'Check weather with your permission.',
    trust: 'Verify high-risk agricultural decisions with a qualified local expert.',
    continue: 'Continue',
    existing: 'Already have an account?',
    signIn: 'Sign in',
  };

  return (
    <main className="entry-screen onboarding-screen">
      <header className="entry-topbar">
        <span className="entry-brand"><img src="/images/logo1.png" alt="" /><strong>AgroLingo</strong></span>
        <div className="language-switch">
          <button className={lang === 'ha' ? 'active' : ''} onClick={() => setLang('ha')} aria-pressed={lang === 'ha'}>HA</button>
          <button className={lang === 'en' ? 'active' : ''} onClick={() => setLang('en')} aria-pressed={lang === 'en'}>EN</button>
        </div>
      </header>

      <section className="onboarding-content">
        <p className="eyebrow">{copy.eyebrow}</p>
        <h1>{copy.title}</h1>
        <p className="onboarding-lead">{copy.body}</p>

        <div className="onboarding-capabilities">
          <div><span><MessageCircle size={19} /></span><p>{copy.ask}</p></div>
          <div><span><Camera size={19} /></span><p>{copy.photo}</p></div>
          <div><span><CloudSun size={19} /></span><p>{copy.weather}</p></div>
        </div>

        <aside className="onboarding-trust"><ShieldCheck size={19} /><p>{copy.trust}</p></aside>
      </section>

      <footer className="entry-actions">
        <button className="entry-primary" onClick={() => { sessionStorage.setItem('agrolingo_auth_mode', 'register'); setScreen('auth'); }}>{copy.continue}</button>
        <button className="entry-secondary" onClick={() => { sessionStorage.setItem('agrolingo_auth_mode', 'login'); setScreen('auth'); }}>{copy.existing} <strong>{copy.signIn}</strong></button>
      </footer>
    </main>
  );
};
