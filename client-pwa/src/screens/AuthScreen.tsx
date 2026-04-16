import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, MapPin, ArrowRight, ShieldCheck, Eye, EyeOff, Github } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { supabase } from '../lib/supabase';

const translations = {
  en: {
    loginTitle: 'Welcome Back',
    loginDesc: 'Sign in to your AgroLingo account',
    signupTitle: 'Join AgroLingo',
    signupDesc: 'Create your account to get started',
    fullName: 'Full Name',
    farmLoc: 'Farm Location',
    email: 'Email',
    password: 'Password',
    forgotPass: 'Forgot Password?',
    loginBtn: 'Login',
    signupText: 'Sign Up',
    noAccount: "Don't have an account?",
    alreadyAccount: 'Already have an account?',
  },
  ha: {
    loginTitle: 'Sai jiya',
    loginDesc: 'Shiga asusun AgroLingo',
    signupTitle: 'Haɗa AgroLingo',
    signupDesc: 'Ƙirƙiri asusu don fara',
    fullName: 'Cikakkun Sunana',
    farmLoc: 'Waje-gida Gida',
    email: 'Email',
    password: 'Kalmar sirri',
    forgotPass: 'Kalmar sirri Manta?',
    loginBtn: 'Shiga',
    signupText: 'Haɗa',
    noAccount: 'Ba ka da asusu?',
    alreadyAccount: 'Yana da asusu?',
  },
};

export const AuthScreen: React.FC = () => {
  const { lang, setScreen } = useAppStore();
  const t = translations[lang as keyof typeof translations] || translations.en;

  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [farmLoc, setFarmLoc] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        console.log('Login:', { email, password });
      } else {
        console.log('Signup:', { email, password, fullName, farmLoc });
      }
      setScreen('dashboard');
    } catch (error: any) {
      alert(error.message || 'Auth failed');
    } finally {
      setLoading(false);
    }
  };

  const loginWithGithub = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) console.error('Github Login Error:', error.message);
    } catch (error: any) {
      console.error('Github Login Error:', error.message);
    }
  };

  const inputClass = "w-full bg-forest-green/10 border border-forest-green/30 rounded-2xl py-4 pl-12 pr-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-saffron-gold/50 focus:bg-forest-green/20 transition-all duration-300";

  return (
    <div className="flex flex-col min-h-screen bg-[#050a08] px-8 py-10 relative overflow-y-auto scrollbar-none">
      
      {/* 🌿 Ambient Brand Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-saffron-gold/5 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-forest-green/10 blur-[100px] rounded-full pointer-events-none" />

      {/* 🔝 Header & Branding */}
      <div className="flex flex-col items-center text-center gap-6 mt-8">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-20 h-20 bg-white rounded-4xl flex items-center justify-center shadow-2xl shadow-saffron-gold/10"
        >
          <img src="/images/agrolingo-removebg-preview.png" alt="Logo" className="w-14 h-14" />
        </motion.div>

        <div className="space-y-2">
          <h1 className="text-3xl font-space font-bold text-white tracking-tight">
            {isLogin ? t.loginTitle : t.signupTitle}
          </h1>
          <p className="text-[13px] text-slate-400 font-medium max-w-60 mx-auto leading-relaxed">
            {isLogin ? t.loginDesc : t.signupDesc}
          </p>
        </div>
      </div>

      {/* 📝 Auth Form */}
      <form onSubmit={handleSubmit} className="mt-12 flex flex-col gap-5 z-10">
        <AnimatePresence mode="wait">
          {!isLogin && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-5"
            >
              {/* Full Name */}
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-saffron-gold/60" />
                <input
                  type="text"
                  placeholder={t.fullName}
                  className={inputClass}
                  value={fullName}
                  onChange={(e) => setFullName(e.currentTarget.value)}
                  required
                />
              </div>

              {/* Location / Market */}
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-saffron-gold/60" />
                <input
                  type="text"
                  placeholder={t.farmLoc}
                  className={inputClass}
                  value={farmLoc}
                  onChange={(e) => setFarmLoc(e.currentTarget.value)}
                  required
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Email */}
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-saffron-gold/60" />
          <input
            type="email"
            placeholder={t.email}
            className={inputClass}
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
            required
          />
        </div>

        {/* Password */}
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-saffron-gold/60" />
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder={t.password}
            className={inputClass}
            value={password}
            onChange={(e) => setPassword(e.currentTarget.value)}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {/* Forgot Password Link */}
        {isLogin && (
          <button
            type="button"
            onClick={() => setScreen('forgot')}
            className="text-[12px] font-bold text-saffron-gold self-end uppercase tracking-widest hover:opacity-80"
          >
            {t.forgotPass}
          </button>
        )}

        {/* 🚀 Main Action Button */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          type="submit"
          disabled={loading}
          className="mt-4 w-full py-5 rounded-2xl bg-saffron-gold text-dark-slate font-black uppercase tracking-[0.15em] flex items-center justify-center gap-3 shadow-xl shadow-saffron-gold/20 transition-all hover:bg-[#e9a602] disabled:cursor-not-allowed disabled:opacity-70"
        >
          <span>{isLogin ? t.loginBtn : t.signupText}</span>
          <ArrowRight size={18} strokeWidth={3} />
        </motion.button>

        {/* Github Login Button */}
        {isLogin && (
          <motion.button
            whileTap={{ scale: 0.97 }}
            type="button"
            onClick={loginWithGithub}
            className="w-full bg-[#24292F] text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 transition-all hover:bg-black active:scale-95"
          >
            <Github size={20} /> {lang === 'ha' ? 'Shiga da Github' : 'Login with Github'}
          </motion.button>
        )}

        {/* 🛡️ Security Badge */}
        <div className="mt-4 p-4 bg-forest-green/5 border border-forest-green/20 rounded-2xl flex items-start gap-4">
          <div className="p-2 bg-emerald-500/10 rounded-xl">
             <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed font-medium italic">
            {lang === 'ha' 
              ? 'Muna amfani da boye-bayani (Encryption) don kare amfanin gonarka da kudaden ka.'
              : 'End-to-end encryption active. Your farm yields and financial data are secured by AgroLingo Intelligence.'}
          </p>
        </div>

        {/* Switch Mode Toggle */}
        <div className="mt-8 text-center pb-10">
          <p className="text-[13px] text-slate-500 font-medium">
            {isLogin ? t.noAccount : t.alreadyAccount}{' '}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-saffron-gold font-black uppercase tracking-widest ml-1 hover:underline"
            >
              {isLogin ? t.signupText : t.loginBtn}
            </button>
          </p>
        </div>
      </form>
    </div>
  );
};