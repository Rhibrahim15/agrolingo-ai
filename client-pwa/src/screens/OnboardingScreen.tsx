import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PanInfo } from 'framer-motion';
import { ArrowRight, ChevronRight, Globe } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { translations } from '../utils/translations';

const slides = [
  {
    id: 'weather', // First image for Weather
    img: '/images/onboarding1.png',
    category: 'weatherTitle',
    title: 'onb3Title', // Uses the Weather Forecasts title from translations
    desc: 'onb3Desc',   // Uses the Weather Forecasts description from translations
    accent: '#60A5FA',  // Weather accent color
  },
  {
    id: 'ai',
    img: '/images/onboarding2.png',
    category: 'aiTitle',
    title: 'onb2Title',
    desc: 'onb2Desc',
    accent: '#00D685', // Mint
  },
  {
    id: 'market', // Third image for Market
    img: '/images/onboarding3.png',
    category: 'marketTitle',
    title: 'onb1Title', // Uses the Market Insights title from translations
    desc: 'onb1Desc',   // Uses the Market Insights description from translations
    accent: '#D4AF37',  // Gold
  },
];

export const OnboardingScreen: React.FC = () => {
  const { lang, setLang, setScreen } = useAppStore();
  const [step, setStep] = useState(0);
  const [langHover, setLangHover] = useState(false);
  const t = translations[lang as keyof typeof translations] || translations.en;

  // 🚀 Performance Optimization: Preload all onboarding images immediately
  useEffect(() => {
    slides.forEach((slide) => {
      const img = new Image();
      img.src = slide.img;
    });
  }, []);

  const current = slides[step];
  const isLast = step === slides.length - 1;

  const goNext = () => {
    if (isLast) setScreen('auth');
    else setStep(s => s + 1);
  };

  const goPrev = () => {
    if (step > 0) setStep(s => s - 1);
  };

  // Handle Swipe Gestures
  const handlePanEnd = (e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const swipeThreshold = 50; // Pixels the user must drag to trigger a swipe
    if (info.offset.x < -swipeThreshold) goNext();     // Swiped Left
    else if (info.offset.x > swipeThreshold) goPrev(); // Swiped Right
  };

  return (
    <motion.div
      className="relative w-full min-h-[100dvh] flex flex-col"
      style={{ background: 'var(--surface-0)', touchAction: 'pan-y' }}
      onPanEnd={handlePanEnd}
    >
      {/* ── Full-bleed image with crossfade ── */}
      <div 
        className="absolute top-0 left-0 right-0 z-0 h-[65vh] overflow-hidden"
      >
        <AnimatePresence mode="sync">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, scale: 1.06 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.65, ease: [0.4, 0, 0.2, 1] }}
            className="absolute inset-0"
          >
            <img
              src={current.img}
              alt=""
              fetchPriority="high"
              decoding="async"
              className="w-full h-full object-cover object-top"
            />
          </motion.div>
        </AnimatePresence>

        {/* Subtle smooth blend into the UI background only at the very bottom */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to bottom,
              transparent 0%,
              transparent 85%,
              var(--surface-0) 100%
            )`,
          }}
        />
      </div>

      {/* ── Top bar: language + skip ── */}
      <div className="relative z-20 flex items-center justify-between px-5 pt-12 pb-2">
        <motion.div
          layout
          onMouseEnter={() => setLangHover(true)}
          onMouseLeave={() => setLangHover(false)}
          onClick={() => setLangHover(!langHover)}
          className="glass"
          style={{
            display: 'flex', alignItems: 'center',
            height: 36, borderRadius: 18, padding: '0 6px',
            cursor: 'pointer', overflow: 'hidden'
          }}
        >
          <motion.div layout style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: '50%', background: 'var(--surface-3)', flexShrink: 0 }}>
            <Globe size={13} style={{ color: 'var(--brand-primary)' }} />
          </motion.div>

          <AnimatePresence mode="wait">
            {langHover ? (
              <motion.div
                key="expanded"
                initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }}
                style={{ display: 'flex', gap: 4, marginLeft: 8, marginRight: 2 }}
              >
                {(['ha', 'en', 'fr'] as const).map(l => (
                  <button
                    key={l} onClick={(e) => { e.stopPropagation(); setLang(l); setLangHover(false); }}
                    style={{ background: lang === l ? 'var(--brand-primary)' : 'transparent', color: lang === l ? 'var(--ink)' : 'var(--text-secondary)', border: 'none', borderRadius: 999, padding: '4px 10px', fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer' }}
                  >
                    {l}
                  </button>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="collapsed"
                initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }}
                style={{ marginLeft: 8, marginRight: 6, display: 'flex', alignItems: 'center' }}
              >
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase' }}>{lang}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <button
          onClick={() => setScreen('auth')}
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--slate-400)',
            background: 'transparent',
            border: 'none',
            padding: '8px',
            borderRadius: 999,
            display: 'flex', alignItems: 'center', gap: 4
          }}
        >
          {t.skip} <ChevronRight size={14} />
        </button>
      </div>

      {/* ── Main content — bottom half ── */}
      <div className="relative z-20 flex-1 flex flex-col justify-end px-6 pb-12 gap-8 pt-[60vh]">

        {/* Text block */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`text-${step}`}
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className="flex flex-col items-center text-center gap-3"
          >
            {/* Category pill */}
            <div style={{ display: 'inline-flex', width: 'fit-content' }}>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 9,
                  fontWeight: 600,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  padding: '5px 12px',
                  borderRadius: 999,
                  background: current.accent,
                  color: '#FFF',
                  boxShadow: `0 4px 12px ${current.accent}40`,
                }}
              >
                {t[current.category as keyof typeof t]}
              </span>
            </div>

            {/* Headline */}
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 42,
                fontWeight: 800,
                lineHeight: 0.95,
                letterSpacing: '-0.03em',
                color: 'var(--text-primary)',
              }}
            >
              {t[current.title as keyof typeof t]}
            </h1>

            {/* Description */}
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 14,
                lineHeight: 1.65,
                color: 'var(--slate-400)',
                maxWidth: 300,
                margin: '0 auto',
              }}
            >
              {t[current.desc as keyof typeof t]}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Progress + CTA row */}
        <div className="flex flex-col items-center gap-8 w-full">
          {/* Step dots */}
          <div className="flex items-center gap-2">
            {slides.map((_, i) => (
              <motion.div
                key={i}
                animate={{ width: i === step ? 32 : 8, opacity: i === step ? 1 : 0.3 }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                style={{
                  height: 4,
                  borderRadius: 999,
                  background: 'var(--brand-primary)',
                  cursor: 'pointer',
                }}
                onClick={() => setStep(i)}
              />
            ))}
          </div>

          {/* CTA button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={goNext}
            style={{
              display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              gap: 12, width: '100%', maxWidth: 300,
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: 16,
              letterSpacing: '-0.01em',
              padding: '16px 24px',
              borderRadius: 999,
              background: 'var(--brand-primary)',
              color: '#FFF',
              border: 'none',
              boxShadow: 'var(--shadow-green)',
              cursor: 'pointer',
              transition: 'all 200ms',
            }}
          >
            {isLast ? (
              <>
                <span>{t.getStarted}</span>
                <ArrowRight size={16} strokeWidth={2.5} />
              </>
            ) : (
              <>
                <span>{t.next}</span>
                <ChevronRight size={15} strokeWidth={2.5} />
              </>
            )}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};
