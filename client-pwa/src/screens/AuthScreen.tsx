import React, { useState } from 'react';
import { ArrowLeft, Check, Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { supabase } from '../lib/supabase';
import { friendlyAuthError, isStrongPassword } from '../lib/authErrors';

export const AuthScreen: React.FC = () => {
  const { lang, setScreen } = useAppStore();
  const isHa = lang === 'ha';
  const [isLogin, setIsLogin] = useState(() => sessionStorage.getItem('agrolingo_auth_mode') === 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const copy = isHa ? {
    pilot: 'Gwajin farko',
    titleLogin: 'Barka da dawowa',
    titleRegister: 'Buɗe asusun gwaji',
    bodyLogin: 'Shiga domin ci gaba da amfani da AgroLingo.',
    bodyRegister: 'Ƙirƙiri asusu domin gwada bayanan noma cikin Hausa ko Turanci.',
    register: 'Rijista', login: 'Shiga', name: 'Cikakken suna', password: 'Kalmar sirri',
    submitLogin: 'Shiga asusu', submitRegister: 'Ƙirƙiri asusu',
    required: 'Da fatan a cika bayanan da ake buƙata.',
    passwordHelp: 'Haruffa 8 ko fiye, da babban harafi, ƙaramin harafi, lamba da alama.',
    privacy: 'AgroLingo manhajar gwaji ce. Kada ka saka bayanan sirri a cikin tattaunawa.',
    back: 'Koma baya',
  } : {
    pilot: 'Early pilot',
    titleLogin: 'Welcome back',
    titleRegister: 'Create a pilot account',
    bodyLogin: 'Sign in to continue using AgroLingo.',
    bodyRegister: 'Create an account to explore agricultural information in Hausa or English.',
    register: 'Register', login: 'Sign in', name: 'Full name', password: 'Password',
    submitLogin: 'Sign in', submitRegister: 'Create account',
    required: 'Complete the required fields.',
    passwordHelp: 'Use 8+ characters with uppercase, lowercase, a number and a symbol.',
    privacy: 'AgroLingo is an early pilot. Do not enter sensitive personal information in chat.',
    back: 'Go back',
  };

  const changeMode = (login: boolean) => {
    setIsLogin(login);
    setError('');
    sessionStorage.setItem('agrolingo_auth_mode', login ? 'login' : 'register');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim() || !password.trim() || (!isLogin && !name.trim())) {
      setError(copy.required);
      return;
    }
    if (!isLogin && !isStrongPassword(password)) {
      setError(friendlyAuthError('weak password', lang));
      return;
    }

    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (signInError) throw signInError;
        setScreen('dashboard');
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { full_name: name.trim() } },
        });
        if (signUpError) throw signUpError;
        if (data.user) {
          await supabase.from('profiles').upsert({ id: data.user.id, full_name: name.trim() });
        }
        setScreen('complete_profile');
      }
    } catch (caught: unknown) {
      setError(friendlyAuthError(caught instanceof Error ? caught.message : '', lang));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="entry-screen auth-screen">
      <header className="entry-topbar">
        <button className="entry-back" onClick={() => setScreen('onboarding')} aria-label={copy.back}><ArrowLeft size={20} /></button>
        <span className="entry-brand"><img src="/images/logo1.png" alt="" /><strong>AgroLingo</strong></span>
        <span className="pilot-chip">{copy.pilot}</span>
      </header>

      <section className="auth-panel">
        <div className="auth-heading">
          <h1>{isLogin ? copy.titleLogin : copy.titleRegister}</h1>
          <p>{isLogin ? copy.bodyLogin : copy.bodyRegister}</p>
        </div>

        <div className="auth-tabs" role="tablist" aria-label={isHa ? 'Zaɓin asusu' : 'Account action'}>
          <button role="tab" aria-selected={!isLogin} className={!isLogin ? 'active' : ''} onClick={() => changeMode(false)}>{copy.register}</button>
          <button role="tab" aria-selected={isLogin} className={isLogin ? 'active' : ''} onClick={() => changeMode(true)}>{copy.login}</button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {!isLogin && (
            <label className="form-field"><span>{copy.name}</span><div><User size={18} /><input value={name} onChange={e => setName(e.target.value)} autoComplete="name" /></div></label>
          )}
          <label className="form-field"><span>Email</span><div><Mail size={18} /><input type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" inputMode="email" /></div></label>
          <label className="form-field"><span>{copy.password}</span><div><Lock size={18} /><input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} autoComplete={isLogin ? 'current-password' : 'new-password'} /><button type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></label>

          {!isLogin && password && <p className={isStrongPassword(password) ? 'password-help valid' : 'password-help'}><Check size={14} />{copy.passwordHelp}</p>}
          {error && <p className="auth-error" role="alert">{error}</p>}

          <button className="entry-primary" type="submit" disabled={loading || (!isLogin && !isStrongPassword(password))}>
            {loading ? (isHa ? 'Ana jira…' : 'Please wait…') : isLogin ? copy.submitLogin : copy.submitRegister}
          </button>
        </form>

        <p className="auth-privacy">{copy.privacy}</p>
      </section>
    </main>
  );
};
