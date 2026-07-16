import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';

export const SplashScreen: React.FC = () => {
  const { setScreen, lang } = useAppStore();
  const isHa = lang === 'ha';

  useEffect(() => {
    const timer = window.setTimeout(() => setScreen('onboarding'), 1400);
    return () => window.clearTimeout(timer);
  }, [setScreen]);

  return (
    <main className="entry-screen splash-screen" aria-label={isHa ? 'Ana buɗe AgroLingo' : 'Opening AgroLingo'}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="splash-lockup">
        <span className="entry-logo"><img src="/images/logo1.png" alt="" /></span>
        <div>
          <h1>AgroLingo</h1>
          <p>{isHa ? 'Bayanan noma cikin harshen da ka fi fahimta.' : 'Agricultural information in the language you understand.'}</p>
        </div>
      </motion.div>
      <div className="splash-progress" aria-hidden="true"><span /></div>
      <p className="entry-footnote">{isHa ? 'Wani shiri na GreenByte Tech Co.' : 'A GreenByte Tech Co. initiative'}</p>
    </main>
  );
};
