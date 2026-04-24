import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Wifi } from 'lucide-react';

export const OfflineBanner: React.FC = () => {
  const [isOnline, setIsOnline]     = useState(navigator.onLine);
  const [showOnline, setShowOnline] = useState(false);

  useEffect(() => {
    const goOnline = () => {
      setIsOnline(true);
      setShowOnline(true);
      // Auto-hide "back online" message after 3s
      setTimeout(() => setShowOnline(false), 3000);
    };
    const goOffline = () => {
      setIsOnline(false);
      setShowOnline(false);
    };

    window.addEventListener('online',  goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online',  goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  const show = !isOnline || showOnline;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: -48, opacity: 0 }}
          animate={{ y: 0,   opacity: 1 }}
          exit={{ y: -48,   opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0,
            zIndex: 9999,
            padding: '10px 16px',
            display: 'flex', alignItems: 'center', gap: 8,
            justifyContent: 'center',
            background: isOnline
              ? 'rgba(74,222,128,0.15)'
              : 'rgba(248,113,113,0.15)',
            borderBottom: `1px solid ${isOnline
              ? 'rgba(74,222,128,0.3)'
              : 'rgba(248,113,113,0.3)'}`,
            backdropFilter: 'blur(12px)',
          }}
        >
          {isOnline
            ? <Wifi size={14}    style={{ color: '#4ADE80' }} />
            : <WifiOff size={14} style={{ color: '#F87171' }} />
          }
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10, fontWeight: 600,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            color: isOnline ? '#4ADE80' : '#F87171',
          }}>
            {isOnline ? 'Back online' : 'No internet — cached data only'}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
