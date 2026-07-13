import React, { useState } from 'react';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, Eye, EyeOff, Check } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { supabase } from '../lib/supabase';
import { friendlyAuthError, isStrongPassword } from '../lib/authErrors';

// ── Password Strength Logic ──
const calculateStrength = (password: string) => {
  let score = 0;
  if (!password) return 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return score; // Max score of 5
};

const PasswordStrengthMeter = ({ password, lang }: { password: string, lang: string }) => {
  const score = calculateStrength(password);
  
  const getColor = (s: number) => {
    if (s === 0) return 'var(--surface-3)';
    if (s <= 2) return '#F87171'; // Red (Weak)
    if (s === 3) return '#FBBF24'; // Yellow (Fair)
    if (s >= 4) return '#4ADE80'; // Green (Strong)
  };

  const getLabel = (s: number) => {
    if (s === 0) return '';
    if (s <= 2) return lang === 'ha' ? 'Mai rauni' : lang === 'fr' ? 'Faible' : 'Weak';
    if (s === 3) return lang === 'ha' ? 'Daidai' : lang === 'fr' ? 'Moyen' : 'Fair';
    if (s >= 4) return lang === 'ha' ? 'Mai ƙarfi' : lang === 'fr' ? 'Fort' : 'Strong';
  };

  return (
    <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px', padding: '0 4px', width: '100%' }}>
      <div style={{ display: 'flex', gap: '6px', height: '4px' }}>
        {[1, 2, 3, 4, 5].map((level) => (
          <div
            key={level}
            style={{
              flex: 1,
              borderRadius: '999px',
              backgroundColor: score >= level ? getColor(score) : 'var(--surface-3)',
              transition: 'background-color 0.3s ease'
            }}
          />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', height: '12px' }}>
        <span style={{ 
          fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700, 
          color: getColor(score), textTransform: 'uppercase', letterSpacing: '0.05em' 
        }}>
          {getLabel(score)}
        </span>
      </div>
    </div>
  );
};

const PasswordRequirements = ({ password, lang }: { password: string, lang: string }) => {
  const reqs = [
    { id: 'length', text: lang === 'ha' ? 'Hafuffuka 8 ko fiye' : lang === 'fr' ? '8 caractères minimum' : '8+ characters', met: password.length >= 8 },
    { id: 'upper', text: lang === 'ha' ? 'Babban baki (A-Z)' : lang === 'fr' ? 'Une majuscule (A-Z)' : 'One uppercase (A-Z)', met: /[A-Z]/.test(password) },
    { id: 'lower', text: lang === 'ha' ? 'Karamin baki (a-z)' : lang === 'fr' ? 'Une minuscule (a-z)' : 'One lowercase (a-z)', met: /[a-z]/.test(password) },
    { id: 'number', text: lang === 'ha' ? 'Lamba (0-9)' : lang === 'fr' ? 'Un chiffre (0-9)' : 'One number (0-9)', met: /[0-9]/.test(password) },
    { id: 'special', text: lang === 'ha' ? 'Alamar musamman (!@#)' : lang === 'fr' ? 'Un caractère spécial (!@#)' : 'One special char (!@#)', met: /[^A-Za-z0-9]/.test(password) }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px', padding: '0 4px', width: '100%' }}>
      {reqs.map(req => (
        <div key={req.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <motion.div
            initial={false}
            animate={{
              backgroundColor: req.met ? '#4ADE80' : 'transparent',
              borderColor: req.met ? '#4ADE80' : 'var(--slate-400)',
              color: req.met ? '#000000' : 'transparent'
            }}
            style={{
              width: 16, height: 16, borderRadius: '50%', border: '1.5px solid',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}
          >
            <Check size={10} strokeWidth={4} />
          </motion.div>
          <span style={{ 
            fontFamily: 'var(--font-body)', fontSize: '12.5px', 
            color: req.met ? 'var(--text-primary)' : 'var(--slate-400)',
            transition: 'color 0.3s ease'
          }}>
            {req.text}
          </span>
        </div>
      ))}
    </div>
  );
};

// ── Reusable Input Field ──
interface FieldProps {
  icon: React.ReactNode;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  type?: React.HTMLInputTypeAttribute;
  right?: React.ReactNode;
}

const Field = ({ icon, placeholder, value, onChange, type = 'text', right }: FieldProps) => (
  <div style={{ position: 'relative', width: '100%' }}>
    <div style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--slate-400)', pointerEvents: 'none', zIndex: 1 }}>
      {icon}
    </div>
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      type={type}
      className="input-field"
      style={{ 
        paddingLeft: 46,
        paddingRight: right ? 46 : 16,
        paddingTop: 16,
        paddingBottom: 16,
        borderRadius: 14,
        width: '100%',
        display: 'block'
      }}
    />
    {right && (
      <div style={{ position: 'absolute', right: 15, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {right}
      </div>
    )}
  </div>
);

export const AuthScreen: React.FC = () => {
  const { lang, setScreen } = useAppStore();
  const isHa = lang === 'ha';
  
  const [isLogin, setIsLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const passwordShakeControls = useAnimation();

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim() || (!isLogin && !name.trim())) {
      setError(isHa ? 'Don Allah cika dukkan bayanan.' : 'Please fill out all fields.');
      return;
    }

    if (!isLogin && !isStrongPassword(password)) {
      setError(friendlyAuthError('weak password', lang));
      passwordShakeControls.start({
        x: [-10, 10, -10, 10, -5, 5, 0],
        transition: { duration: 0.4 }
      });
      return;
    }

    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
        if (signInErr) throw signInErr;
        setScreen('dashboard');
      } else {
        const { data, error: signUpErr } = await supabase.auth.signUp({ 
          email, 
          password,
          options: { data: { full_name: name } }
        });
        if (signUpErr) throw signUpErr;
        
        if (data.user) {
          await supabase.from('profiles').upsert({ id: data.user.id, full_name: name });
        }
        setScreen('complete_profile');
      }
    } catch (err: unknown) {
      const rawMessage = err instanceof Error ? err.message : '';
      setError(friendlyAuthError(rawMessage, lang));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px', background: 'var(--surface-0)', position: 'relative' }}>
      
      {/* Ambient Background Glows for Glassmorphism */}
      <div style={{ position: 'absolute', top: '5%', left: '5%', width: '50vw', height: '50vw', background: 'var(--brand-primary)', filter: 'blur(100px)', opacity: 0.15, borderRadius: '50%', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '5%', right: '5%', width: '50vw', height: '50vw', background: 'var(--gold)', filter: 'blur(100px)', opacity: 0.12, borderRadius: '50%', pointerEvents: 'none' }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        style={{
          width: '100%', maxWidth: 380,
          background: 'var(--surface-glass)',
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-2xl)',
          padding: '40px 24px',
          boxShadow: 'var(--shadow-glass)',
          margin: 'auto',
          position: 'relative', zIndex: 10
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 72, height: 72, background: 'var(--surface-1)', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: 'var(--shadow-green)', border: '1px solid var(--border-hover)' }}>
            <img src="/images/logo1.png" alt="AgroLingo" style={{ width: 44, height: 44, objectFit: 'contain' }} />
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8, letterSpacing: '-0.02em' }}>AgroLingo AI</h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text-muted)' }}>
            {isHa ? 'Makomar noman Afrika' : 'The future of African farming'}
          </p>
        </div>

        <div style={{ display: 'flex', background: 'var(--surface-2)', borderRadius: 14, padding: 4, marginBottom: 32, border: '1px solid var(--border)' }}>
          <button style={{ flex: 1, padding: '10px', borderRadius: 10, fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, border: 'none', transition: 'all 0.2s', background: !isLogin ? 'var(--surface-0)' : 'transparent', color: !isLogin ? 'var(--text-primary)' : 'var(--slate-500)', boxShadow: !isLogin ? 'var(--shadow-sm)' : 'none' }} onClick={() => { setIsLogin(false); setError(''); }}>{isHa ? 'Rijista' : 'Register'}</button>
          <button style={{ flex: 1, padding: '10px', borderRadius: 10, fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, border: 'none', transition: 'all 0.2s', background: isLogin ? 'var(--surface-0)' : 'transparent', color: isLogin ? 'var(--text-primary)' : 'var(--slate-500)', boxShadow: isLogin ? 'var(--shadow-sm)' : 'none' }} onClick={() => { setIsLogin(true); setError(''); }}>{isHa ? 'Shiga' : 'Login'}</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%' }}>
          <AnimatePresence mode="popLayout">
            {!isLogin && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                <Field icon={<User size={16} />} placeholder={isHa ? 'Cikakken Suna' : 'Full Name'} value={name} onChange={setName} />
              </motion.div>
            )}
          </AnimatePresence>

          <Field icon={<Mail size={16} />} placeholder="Email" value={email} onChange={setEmail} type="email" />
          
          <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
            <motion.div animate={passwordShakeControls} style={{ width: '100%' }}>
              <Field 
                icon={<Lock size={16} />} placeholder={isHa ? 'Kalmar Sirri' : 'Password'} value={password} onChange={setPassword} type={showPassword ? 'text' : 'password'}
                right={<button type="button" onClick={() => setShowPassword(!showPassword)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: 4 }}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>}
              />
            </motion.div>
            
            {!isLogin && password.length > 0 && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ width: '100%', marginTop: 8 }}>
                <PasswordStrengthMeter password={password} lang={lang} />
                <PasswordRequirements password={password} lang={lang} />
              </motion.div>
            )}
          </div>
        </div>

        {error && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: '#F87171', fontSize: 13, fontFamily: 'var(--font-body)', textAlign: 'center', marginTop: 16, marginBottom: 0, background: 'rgba(248, 113, 113, 0.1)', padding: '8px 12px', borderRadius: 8 }}>
            {error}
          </motion.p>
        )}

        {/* Generous spacer before the button! */}
        <div style={{ marginTop: 32 }}>
          <motion.button 
            whileTap={{ scale: 0.97 }} onClick={handleSubmit} disabled={loading || (!isLogin && !isStrongPassword(password))} 
            style={{
              width: '100%', padding: '16px', borderRadius: 'var(--r-xl)', background: 'var(--brand-primary)', color: '#FFF',
              border: 'none', fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: 'var(--shadow-green)', cursor: 'pointer', transition: 'opacity 0.2s', opacity: (loading || (!isLogin && !isStrongPassword(password))) ? 0.6 : 1
            }}
          >
            {loading ? <div style={{ width: 20, height: 20, border: '2.5px solid rgba(0,0,0,0.2)', borderTopColor: 'var(--ink)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> : <><span>{isLogin ? (isHa ? 'Shiga ciki' : 'Login') : (isHa ? 'Ƙirƙiri asusu' : 'Create Account')}</span><ArrowRight size={18} strokeWidth={2.5} /></>}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};