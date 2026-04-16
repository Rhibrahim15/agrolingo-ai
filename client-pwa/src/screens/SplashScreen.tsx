import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import { translations } from '../utils/translations';

export const SplashScreen = () => {
  const { setScreen, lang } = useAppStore();
  const t = translations[lang] || translations.en;

  useEffect(() => {
    const timer = setTimeout(() => {
      setScreen('onboarding'); 
    }, 3500); 
    return () => clearTimeout(timer);
  }, [setScreen]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-[#050a08] h-screen w-full relative">
      {/* 🧊 Logo Box */}
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="w-32 h-32 bg-white rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-[#FFB703]/20"
      >
        <img src="/images/agrolingo-removebg-preview.png" alt="Logo" className="w-20 h-20" />
      </motion.div>

      {/* 📝 Brand Text */}
      <div className="mt-8 text-center space-y-2">
        <h1 className="text-3xl font-bold text-white tracking-tighter">AgroLingo AI</h1>
        <p className="text-[10px] text-[#FFB703] font-black uppercase tracking-[0.3em] opacity-80">
          {t.tagline || "Precision Agriculture"}
        </p>
      </div>

      {/* ⏳ Loading Bar */}
      <div className="absolute bottom-20 w-48 h-1 bg-[#1B4332]/30 rounded-full overflow-hidden">
        <motion.div 
          initial={{ x: "-100%" }}
          animate={{ x: "0%" }}
          transition={{ duration: 3, ease: "easeInOut" }}
          className="h-full bg-[#FFB703]"
        />
      </div>
    </div>
  );
};