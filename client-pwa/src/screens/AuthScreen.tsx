import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Github, Globe } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

type Mode = 'login' | 'signup' | 'forgot';

const Field = ({
  icon, placeholder, value, onChange, type = 'text',
  right, onSubmit
}: {
  icon: React.ReactNode; placeholder: string; value: string;
  onChange: (v: string) => void; type?: string;
  right?: React.ReactNode;
  onSubmit?: () => void;
}) => (
  <div style={{ position: 'relative' }}>
    <div style={{
      position: 'absolute', left: 15, top: '50%', transform: 'translateY(-50%)',
      color: 'var(--slate-500)', pointerEvents: 'none', zIndex: 1,
    }}>
      {icon}
    </div>
    <input
      type={type} value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder} className="input-field"
      autoComplete={type === 'password' ? 'new-password' : 'off'}
      onKeyDown={e => { if (e.key === 'Enter' && onSubmit) onSubmit(); }}
      style={{ paddingRight: right ? 46 : 16 }}
    />
    {right && (
      <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)' }}>{right}</div>
    )}
  </div>
);

export const AuthScreen: React.FC = () => {
  const { lang, setLang, signIn, signUp, signInWithGithub, resetPassword } = useAppStore();
  const isHa = lang === 'ha';

  const [langHover, setLangHover] = useState(false);
  const [mode, setMode]         = useState<Mode>('login');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [name, setName]         = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');

  const handleSubmit = async () => {
    setError(''); setSuccess('');
    if (!email.trim()) { setError(isHa ? 'Shigar da email ɗinka.' : 'Please enter your email.'); return; }

    if (mode === 'forgot') {
      setLoading(true);
      try {
        await resetPassword(email);
        setSuccess(isHa ? 'An aika sakon sake saitin kalmar sirri.' : 'Reset link sent — check your email.');
      } catch (e: any) {
        setError(e.message ?? 'An error occurred');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!password) { setError(isHa ? 'Shigar da kalmar sirri.' : 'Please enter your password.'); return; }
    if (mode === 'signup' && password.length < 8) {
      setError(isHa ? 'Kalmar sirri dole ta kai haruffa 8.' : 'Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        await signIn(email, password);
      } else {
        await signUp(email, password, name, '');
        setSuccess(isHa ? 'Duba imel ɗinka don tabbatarwa.' : 'Account created! Please check your email to verify.');
      }
    } catch (e: any) {
      setError(e.message ?? 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex', flexDirection: 'column',
        minHeight: '100%', background: 'var(--surface-0)',
        position: 'relative',
      }}
    >
      {/* Blurred Farm Background */}
      <div style={{
        position: 'absolute', inset: -20, zIndex: 0,
        backgroundImage: `url('https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&w=800&q=80')`,
        backgroundSize: 'cover', backgroundPosition: 'center',
        filter: 'blur(8px) brightness(0.65) saturate(120%)', // Brighter, luscious farm
      }} />

      {/* ── Top-right language toggle ── */}
      <div style={{ position: 'absolute', top: 24, right: 20, zIndex: 10 }}>
        <motion.div
          layout
          onMouseEnter={() => setLangHover(true)}
          onMouseLeave={() => setLangHover(false)}
          className="glass"
          style={{
            display: 'flex', alignItems: 'center',
            height: 40, borderRadius: 20, padding: '0 6px',
            background: 'var(--surface-glass)',
            border: '1px solid var(--border-glass-all)',
            borderTop: '1px solid var(--border-glass-top)',
            borderLeft: '1px solid var(--border-glass-left)',
            backdropFilter: 'blur(25px) saturate(150%)',
            boxShadow: 'var(--shadow-glass)',
            cursor: 'pointer', overflow: 'hidden', whiteSpace: 'nowrap'
          }}
        >
          <motion.div layout style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: '50%', background: 'var(--surface-2)', flexShrink: 0 }}>
            <Globe size={14} style={{ color: 'var(--brand-primary)' }} />
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
      </div>

      {/* Logo area */}
      <div style={{
        position: 'relative', zIndex: 1,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        paddingTop: 72, paddingBottom: 32, gap: 12,
      }}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
          style={{
            width: 68, height: 68, borderRadius: 20,
            background: 'var(--surface-1)',
            border: '1px solid var(--border-hover)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'var(--shadow-glass)',
            backdropFilter: 'blur(12px)',
            overflow: 'hidden',
          }}
        >
          <img src="/images/logo1.png" alt="Logo" decoding="async" fetchPriority="high" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 8 }} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          style={{ textAlign: 'center' }}
        >
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 28, fontWeight: 800,
            color: '#FFFFFF',
            letterSpacing: '-0.03em', lineHeight: 1,
          }}>
            AgroLingo <span style={{ color: 'var(--brand-primary)' }}>AI</span>
          </h1>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--slate-500)', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 5 }}>
            {isHa ? 'Bayanan Kai' : 'Your Account'}
          </p>
        </motion.div>
      </div>

      {/* Form card */}
      <motion.div
        className="glass"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
        style={{
          flex: 1, position: 'relative', zIndex: 1,
          margin: '0 20px',
          borderRadius: 28, padding: '28px 22px',
          boxShadow: 'var(--shadow-glass)',
          display: 'flex', flexDirection: 'column', gap: 16,
        }}
      >
        {/* Mode tabs */}
        <div style={{
          display: 'flex', background: 'var(--surface-2)',
          borderRadius: 999, padding: 4, gap: 2,
        }}>
          {(['login', 'signup'] as Mode[]).map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(''); setSuccess(''); }}
              style={{
                flex: 1, padding: '10px 16px',

                borderRadius: 999, border: 'none', cursor: 'pointer', position: 'relative',
                fontFamily: 'var(--font-display)',
                fontSize: 13, fontWeight: 700,
                letterSpacing: '-0.01em',
                background: 'transparent',
                color: mode === m ? 'var(--text-primary)' : 'var(--text-muted)',
              }}
            >
              {mode === m && (
                <motion.div
                  layoutId="authTabBackground"
                  style={{ position: 'absolute', inset: 0, background: 'var(--surface-3)', borderRadius: 999, zIndex: 0, boxShadow: 'var(--shadow-sm)' }}
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                />
              )}
              <span style={{ position: 'relative', zIndex: 1 }}>
                {m === 'login'
                  ? (isHa ? 'Shiga' : 'Sign In')
                  : (isHa ? 'Ƙirƙira' : 'Sign Up')}
              </span>
            </button>
          ))}
        </div>

        {/* Fields */}
        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.22 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 11 }}
          >
            {mode === 'signup' && (
              <Field
                icon={<User size={16} />}
                placeholder={isHa ? 'Sunan Cikakken...' : 'Full name...'}
                value={name}
                onChange={setName}
                onSubmit={handleSubmit}
              />
            )}
            <Field
              icon={<Mail size={16} />}
              placeholder={isHa ? 'Adireshin email...' : 'Email address...'}
              value={email}
              onChange={setEmail}
              type="email"
              onSubmit={handleSubmit}
            />
            {mode !== 'forgot' && (
              <Field
                icon={<Lock size={16} />}
                placeholder={isHa ? 'Kalmar sirri...' : 'Password...'}
                value={password}
                onChange={setPassword}
                type={showPw ? 'text' : 'password'}
                onSubmit={handleSubmit}
                right={
                  <button
                    onClick={() => setShowPw(v => !v)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--slate-500)', padding: 2 }}
                  >
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                }
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Forgot password */}
        {mode === 'login' && (
          <button
            onClick={() => { setMode('forgot'); setError(''); }}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-body)', fontSize: 12,
            color: 'var(--brand-primary)', textAlign: 'right',
              marginTop: -6,
            }}
          >
            {isHa ? 'Mantawa kalmar sirri?' : 'Forgot password?'}
          </button>
        )}

        {/* Error / success */}
        <AnimatePresence>
          {(error || success) && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                padding: '10px 14px', borderRadius: 12,
                background: error ? 'rgba(239,68,68,0.08)' : 'rgba(74,222,128,0.08)',
                border: `1px solid ${error ? 'rgba(239,68,68,0.2)' : 'rgba(74,222,128,0.2)'}`,
              }}
            >
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: error ? '#F87171' : '#4ADE80', lineHeight: 1.5 }}>
                {error || success}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CTA */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSubmit}
          disabled={loading}
          className="btn btn-primary"
          style={{ width: '100%', marginTop: 4 }}
        >
          {loading ? (
            <div style={{ width: 20, height: 20, border: '2.5px solid rgba(0,0,0,0.25)', borderTopColor: 'var(--ink)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          ) : (
            <>
              <span>
                {mode === 'login'  ? (isHa ? 'Shiga' : 'Sign In') :
                 mode === 'signup' ? (isHa ? 'Ƙirƙira Asusun' : 'Create Account') :
                                    (isHa ? 'Aika Sakon Sake Saiti' : 'Send Reset Link')}
              </span>
              <ArrowRight size={16} strokeWidth={2.5} />
            </>
          )}
        </motion.button>

        {/* GitHub OAuth */}
        {mode !== 'forgot' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="divider" />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--slate-600)', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>
                OR
              </span>
              <div className="divider" />
            </div>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={signInWithGithub}
              className="btn btn-secondary"
              style={{ width: '100%' }}
            >
              <Github size={16} />
              <span>{isHa ? 'Shiga da GitHub' : 'Continue with GitHub'}</span>
            </motion.button>
          </>
        )}

        {/* Back to login */}
        {mode === 'forgot' && (
          <button
            onClick={() => setMode('login')}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-body)', fontSize: 12,
              color: 'var(--text-muted)', textAlign: 'center',
            }}
          >
            ← {isHa ? 'Koma zuwa shiga' : 'Back to Sign In'}
          </button>
        )}
      </motion.div>

      {/* Bottom spacer */}
      <div style={{ height: 28 }} />
    </div>
  );
};
