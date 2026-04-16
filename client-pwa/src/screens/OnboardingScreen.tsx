import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { translations } from '../utils/translations';

// 🎨 Data matched to your Stunning Generated Assets
const slides = [
  { 
    id: 1, 
    img: "/images/onboarding-market.jpg", 
    titleKey: 'onb1Title', 
    descKey: 'onb1Desc', 
    categoryKey: 'marketTitle' 
  },
  { 
    id: 2, 
    img: "/images/onboarding-ai.jpg", 
    titleKey: 'onb2Title', 
    descKey: 'onb2Desc', 
    categoryKey: 'aiTitle' 
  },
  { 
    id: 3, 
    img: "/images/onboarding-weather.jpg", 
    titleKey: 'onb3Title', 
    descKey: 'onb3Desc', 
    categoryKey: 'weatherTitle' 
  }
];

export const OnboardingScreen: React.FC = () => {
  const { lang, setLang, setScreen } = useAppStore();
  const [step, setStep] = useState(0);
  const t = translations[lang] || translations.en;

  const handleNext = () => {
    if (step < slides.length - 1) setStep(step + 1);
    else setScreen('auth');
  };

  return (
    <div className="h-screen w-full bg-[#050a08] overflow-hidden flex flex-col lg:flex-row">
      
      {/* 🖼️ Image Section (Blended & Responsive) */}
      <div className="relative w-full lg:w-3/5 h-[50%] lg:h-full overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.8 }}
            className="w-full h-full relative"
          >
            <img 
              src={slides[step].img} 
              alt="GreenByte Insight"
              className="w-full h-full object-cover lg:object-center"
              style={{
                // 🪄 THE BLEND: This makes the image melt into your app background
                WebkitMaskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)',
                maskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)'
              }}
            />
            {/* Ambient Glow behind the image */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#050a08] via-transparent to-transparent opacity-60" />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 📝 Content Section */}
      <div className="flex-1 flex flex-col justify-between p-8 lg:p-20 relative z-10">
        
        {/* Language & Skip Row */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            {['en', 'ha', 'fr'].map((l) => (
              <button 
                key={l}
                onClick={() => setLang(l as any)}
                className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${lang === l ? 'bg-[#FFB703] text-[#050a08]' : 'bg-white/5 text-slate-500 border border-white/10'}`}
              >
                {l}
              </button>
            ))}
          </div>
          <button 
            onClick={() => setScreen('auth')}
            className="text-[11px] font-bold text-slate-500 uppercase tracking-widest hover:text-white transition-colors"
          >
            {t.skip}
          </button>
        </div>

        {/* Text Content */}
        <div className="space-y-6">
          <AnimatePresence mode="wait">
            <motion.div 
              key={`text-${step}`}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-[#1B4332]/30 border border-[#1B4332]/50 rounded-full text-[#FFB703] text-[9px] font-black tracking-[0.2em] uppercase">
                  {t[slides[step].categoryKey as keyof typeof t]}
                </span>
              </div>
              <h1 className="text-4xl lg:text-7xl font-black text-white leading-[0.9] tracking-tighter uppercase">
                {t[slides[step].titleKey as keyof typeof t]}
              </h1>
              <p className="text-sm lg:text-lg text-slate-400 font-medium leading-relaxed max-w-sm">
                {t[slides[step].descKey as keyof typeof t]}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Progress Indicators */}
          <div className="flex gap-2 pt-4">
            {slides.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${step === i ? 'w-10 bg-[#FFB703]' : 'w-2 bg-[#1B4332]'}`} />
            ))}
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleNext}
          className="w-full py-5 rounded-[2rem] bg-white hover:bg-[#FFB703] text-black font-black uppercase tracking-tighter text-sm flex items-center justify-center gap-3 transition-all active:scale-95 group shadow-2xl shadow-white/5"
        >
          {step === slides.length - 1 ? t.getStarted : t.next}
          {step === slides.length - 1 ? <ArrowRight size={20} /> : <ChevronRight className="group-hover:translate-x-1 transition-transform" />}
        </button>
      </div>
    </div>
  );
};