import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';

export const SplashScreen: React.FC = () => {
  const { setScreen, lang } = useAppStore();
  const isHa = lang === 'ha';
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Particle field — organic, slow-moving
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const particles = Array.from({ length: 40 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.4,
      dx: (Math.random() - 0.5) * 0.18,
      dy: (Math.random() - 0.5) * 0.18,
      op: Math.random() * 0.25 + 0.06,
    }));

    let animId: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.dx; p.y += p.dy;
        if (p.x < 0 || p.x > canvas.width)  p.dx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(61,155,102,${p.op})`;
        ctx.fill();
      });
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animId);
  }, []);

  // Navigate after animation completes
  useEffect(() => {
    const timer = setTimeout(() => setScreen('onboarding'), 3200);
    return () => clearTimeout(timer);
  }, [setScreen]);

  return (
    <div
      className="relative flex flex-col items-center justify-center w-full h-full overflow-hidden"
      style={{ background: 'var(--surface-0)' }}
    >
      {/* Particle field */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {/* Radial glow behind logo */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: 280,
          height: 280,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(43,107,71,0.22) 0%, transparent 70%)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -62%)',
        }}
      />

      {/* Logo lockup */}
      <div className="relative z-10 flex flex-col items-center gap-6">
        {/* Logo mark */}
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
        >
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: 28,
              background: '#FFFFFF',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 12px 32px rgba(0,0,0,0.25), inset 0 0 0 1px rgba(0,0,0,0.05)',
              overflow: 'hidden',
            }}
          >
            <img src="/images/logo1.png" alt="AgroLingo Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 8 }} />
          </div>
        </motion.div>

        {/* Wordmark */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
          className="flex flex-col items-center gap-1"
        >
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 32,
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.035em',
              lineHeight: 1,
            }}
          >
            AgroLingo{' '}
            <span style={{ color: 'var(--gold)' }}>AI</span>
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
            }}
          >
          {isHa ? 'Makomar Noman Afrika' : 'The Future of African Agriculture'}
          </p>
        </motion.div>
      </div>

      {/* Loading bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        style={{
          position: 'absolute',
          bottom: 64,
          width: 120,
          height: 3,
          background: 'var(--surface-2)',
          borderRadius: 999,
          overflow: 'hidden',
        }}
      >
        <motion.div
          initial={{ x: '-100%' }}
          animate={{ x: '0%' }}
          transition={{ delay: 0.8, duration: 2.0, ease: [0.4, 0, 0.2, 1] }}
          style={{
            height: '100%',
            background: 'linear-gradient(90deg, var(--moss), var(--gold))',
            borderRadius: 999,
          }}
        />
      </motion.div>
    </div>
  );
};
