import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun, Globe, Bell, Lock, Shield, ChevronRight, ChevronLeft, Info, LogOut, Download } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { supabase } from '../lib/supabase';

type SubView = 'main' | 'password' | 'privacy' | 'about';

// ── Reusable UI Components ──
const SettingGroup = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <div className="mb-6">
    <h3 style={{ 
      marginLeft: 16, marginBottom: 8, fontSize: 12, fontWeight: 700, 
      color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' 
    }}>
      {title}
    </h3>
    <div style={{ 
      background: 'var(--surface-1)', borderRadius: 20, 
      border: '1px solid var(--border)', overflow: 'hidden' 
    }}>
      {children}
    </div>
  </div>
);

const SettingRow = ({ icon: Icon, label, right, onClick, border = true, danger = false }: any) => (
  <div 
    onClick={onClick} 
    style={{ 
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
      padding: '14px 16px', borderBottom: border ? '1px solid var(--border)' : 'none', 
      cursor: onClick ? 'pointer' : 'default', background: 'var(--surface-1)' 
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ 
        width: 34, height: 34, borderRadius: 10, 
        background: danger ? 'rgba(239,68,68,0.1)' : 'var(--surface-2)', 
        display: 'flex', alignItems: 'center', justifyContent: 'center' 
      }}>
        <Icon size={18} style={{ color: danger ? '#F87171' : 'var(--text-secondary)' }} />
      </div>
      <span style={{ fontSize: 15, fontWeight: 600, color: danger ? '#F87171' : 'var(--text-primary)' }}>
        {label}
      </span>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {right}
    </div>
  </div>
);

// ── Main Screen Component ──
export const SettingsScreen: React.FC = () => {
  const { lang, setLang, theme, setTheme, logout, deferredPrompt, setDeferredPrompt } = useAppStore();
  const isHa = lang === 'ha';

  const [view, setView] = useState<SubView>('main');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securityQ, setSecurityQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  // Handle Password Change
  const updatePassword = async () => {
    if (newPassword.length < 8) {
      setMsg({ type: 'error', text: isHa ? 'Kalmar sirri ta yi gajarta (mafi karanci 8).' : 'Password is too short (min 8 chars).' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMsg({ type: 'error', text: isHa ? 'Kalmomin sirri ba su dace ba.' : 'Passwords do not match.' });
      return;
    }
    setLoading(true);
    setMsg({ type: '', text: '' });
    
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setMsg({ type: 'success', text: isHa ? 'An sabunta kalmar sirri cikin nasara!' : 'Password updated successfully!' });
      setNewPassword('');
      setConfirmPassword('');
    } catch (e: any) {
      setMsg({ type: 'error', text: e.message });
    } finally {
      setLoading(false);
    }
  };

  // Handle PWA Install
  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  return (
    <div style={{ 
      display: 'flex', flexDirection: 'column', minHeight: '100%', 
      paddingTop: 100, paddingBottom: 100, paddingLeft: 16, paddingRight: 16 
    }}>
      
      {/* ── Dynamic Header ── */}
      <div className="flex items-center gap-3 mb-6">
        {view !== 'main' && (
          <button onClick={() => { setView('main'); setMsg({ type: '', text: '' }); }} className="btn-icon">
            <ChevronLeft size={20} />
          </button>
        )}
        <h1 className="t-display text-3xl">
          {view === 'main' ? (isHa ? 'Saituna' : 'Settings') : 
           view === 'password' ? (isHa ? 'Kalmar Sirri' : 'Security') : 
           view === 'about' ? (isHa ? 'Game da AgroLingo' : 'About AgroLingo') :
           (isHa ? 'Tsarin Sirri' : 'Privacy Policy')}
        </h1>
      </div>

      <div className="flex-1 relative">
        <AnimatePresence mode="wait">
          {/* ── Main Settings View ── */}
          {view === 'main' && (
            <motion.div
              key="main"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              {/* Preferences */}
              <SettingGroup title={isHa ? 'Zaɓuɓɓuka' : 'Preferences'}>
                <SettingRow 
                  icon={theme === 'dark' ? Moon : Sun} 
                  label={isHa ? 'Yanayin Gani' : 'Appearance'} 
                  right={
                    <button 
                      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                      style={{
                        width: 46, height: 26, borderRadius: 999,
                        background: theme === 'dark' ? 'var(--gold)' : 'var(--surface-3)',
                        position: 'relative', border: 'none', cursor: 'pointer', transition: 'background 300ms'
                      }}
                    >
                      <motion.div 
                        animate={{ left: theme === 'dark' ? 22 : 3 }}
                        style={{
                          width: 20, height: 20, borderRadius: '50%', background: 'var(--white)',
                          position: 'absolute', top: 3, boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }}
                      />
                    </button>
                  }
                />
                <SettingRow 
                  icon={Globe} 
                  label={isHa ? 'Harshe' : 'Language'} 
                  right={
                    <div style={{ display: 'flex', background: 'var(--surface-2)', padding: 3, borderRadius: 10 }}>
                      {(['ha', 'en', 'fr'] as const).map(l => (
                        <button
                          key={l}
                          onClick={() => setLang(l)}
                          style={{
                            background: lang === l ? 'var(--surface-1)' : 'transparent',
                            color: lang === l ? 'var(--text-primary)' : 'var(--text-muted)',
                            boxShadow: lang === l ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                            border: 'none', padding: '6px 12px', borderRadius: 8,
                            fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer', transition: 'all 200ms'
                          }}
                        >
                          {l}
                        </button>
                      ))}
                    </div>
                  }
                />
                <SettingRow 
                  icon={Bell} 
                  label={isHa ? 'Sanarwa' : 'Notifications'} 
                  border={false}
                  right={<span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{isHa ? 'Kunnne' : 'Enabled'}</span>}
                />
              </SettingGroup>

              {/* App Installation (Only shows if browser allows it) */}
              {deferredPrompt && (
                <SettingGroup title={isHa ? 'Manhajar' : 'App'}>
                  <SettingRow 
                    icon={Download} 
                    label={isHa ? 'Saka a Waya' : 'Install App'} 
                    border={false}
                    onClick={handleInstall}
                  />
                </SettingGroup>
              )}

              {/* Security */}
              <SettingGroup title={isHa ? 'Tsaro' : 'Security'}>
                <SettingRow 
                  icon={Lock} 
                  label={isHa ? 'Canza Kalmar Sirri' : 'Change Password'} 
                  border={false}
                  onClick={() => setView('password')}
                  right={<ChevronRight size={18} style={{ color: 'var(--slate-400)' }} />}
                />
              </SettingGroup>

              {/* About */}
              <SettingGroup title={isHa ? 'Game da mu' : 'About'}>
                <SettingRow 
                  icon={Info} 
                  label={isHa ? 'Game da Manhajar' : 'About App'} 
                  onClick={() => setView('about')}
                  right={<ChevronRight size={18} style={{ color: 'var(--slate-400)' }} />}
                />
                <SettingRow 
                  icon={Shield} 
                  label={isHa ? 'Manufar Sirri' : 'Privacy Policy'} 
                  onClick={() => setView('privacy')}
                  right={<ChevronRight size={18} style={{ color: 'var(--slate-400)' }} />}
                />
              </SettingGroup>

              {/* Account Actions */}
              <SettingGroup title={isHa ? 'Asusun' : 'Account'}>
                <SettingRow 
                  icon={LogOut} 
                  label={isHa ? 'Fita' : 'Sign Out'} 
                  border={false}
                  danger={true}
                  onClick={logout}
                />
              </SettingGroup>
            </motion.div>
          )}

          {/* ── Password Change View ── */}
          {view === 'password' && (
            <motion.div
              key="password"
               initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.25 }}
              style={{ width: '100%' }}
            >
              <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                  {isHa ? 'Shigar da sabon kalmar sirri don asusunka. Tabbatar tana da karfi.' : 'Enter a new strong password for your account to stay secure.'}
                </p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={isHa ? 'Sabon Kalmar Sirri...' : 'New Password...'}
                    className="input-field" style={{ paddingLeft: 16 }}
                  />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={isHa ? 'Tabbatar da Kalmar Sirri...' : 'Confirm Password...'}
                    className="input-field" style={{ paddingLeft: 16 }}
                  />
                  <select 
                    value={securityQ} onChange={e => setSecurityQ(e.target.value)}
                    className="input-field" style={{ paddingLeft: 16 }}
                  >
                    <option value="" disabled>{isHa ? '-- Zaɓi Tambayar Tsaro --' : '-- Select Security Question --'}</option>
                    <option value="1">{isHa ? 'Menene sunan makarantar ka ta farko?' : 'What was your first school?'}</option>
                    <option value="2">{isHa ? 'Wane gari aka haife ka?' : 'In what city were you born?'}</option>
                  </select>
                </div>

                {msg.text && (
                  <div style={{ 
                    padding: '10px 14px', borderRadius: 12, marginBottom: 16,
                    background: msg.type === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(74,222,128,0.1)',
                    border: `1px solid ${msg.type === 'error' ? 'rgba(239,68,68,0.2)' : 'rgba(74,222,128,0.2)'}`
                  }}>
                    <p style={{ fontSize: 12, color: msg.type === 'error' ? '#F87171' : '#4ADE80' }}>{msg.text}</p>
                  </div>
                )}

                <button onClick={updatePassword} disabled={loading} className="btn btn-primary" style={{ width: '100%' }}>
                  {loading ? '...' : (isHa ? 'Sabunta Kalmar Sirri' : 'Update Password')}
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Privacy Policy View ── */}
          {view === 'privacy' && (
            <motion.div
              key="privacy"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.25 }}
              style={{ width: '100%' }}
            >
              <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <Shield size={32} style={{ color: 'var(--brand-primary)', marginBottom: '8px' }} />
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>AgroLingo Privacy</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <p style={{ background: 'var(--surface-2)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                    {isHa ? 'Muna mutunta sirrin ku. Ana amfani da bayanan da kuka bayar kawai don inganta gogewar ku a matsayin manomi akan AgroLingo AI.' : 'We respect your privacy. The data you provide is exclusively used to improve your farming experience on AgroLingo AI.'}
                  </p>
                  <p style={{ background: 'var(--surface-2)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                    {isHa ? 'Ba za mu taba sayar da bayanan ku ga wasu ba. Idan kuna da tambayoyi game da tsaro, tuntuɓi sashen tallafi.' : 'We will never sell your personal data to third parties. If you have security concerns, please contact support.'}
                  </p>
                </div>
                <button onClick={() => setView('main')} className="btn btn-secondary" style={{ width: '100%', marginTop: '8px' }}>
                  {isHa ? 'Na Gane' : 'I Understand'}
                </button>
              </div>
            </motion.div>
          )}

          {/* ── About App View ── */}
          {view === 'about' && (
            <motion.div
              key="about"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.25 }}
              style={{ width: '100%' }}
            >
              <div className="card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ background: '#10B981', padding: '32px 20px', textAlign: 'center', color: '#050A07', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: 64, height: 64, background: '#FFFFFF', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', marginBottom: 12 }}>
                    <img src="/images/logo1.png" alt="Logo" style={{ width: 40, height: 40, objectFit: 'contain' }} />
                  </div>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>AgroLingo <span style={{ color: '#050A07' }}>AI</span></h2>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', marginTop: 4, opacity: 0.8 }}>v2.0.1 • GreenByte Tech</p>
                </div>
                
                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '18px', color: 'var(--gold)', margin: 0 }}>{isHa ? 'Tarihin Mu' : 'Our Story'}</h3>
                    <p style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--text-secondary)', margin: 0 }}>
                      {isHa ? 'An gina wannan manhajar ne daga dan manomi a Gezawa, Jihar Kano, don cike gibin fasaha tsakanin manoman karkara da zamani. AgroLingo AI shine abokin aikin manomi na zamani.' : 'Built by a farmer\'s son from Gezawa, Kano State, to bridge the technology gap for rural agriculture. AgroLingo AI is the modern farmer\'s ultimate companion.'}
                    </p>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '18px', color: 'var(--brand-primary)', margin: 0 }}>{isHa ? 'Kamfanin Mu' : 'The Company'}</h3>
                    <p style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--text-secondary)', margin: 0 }}>
                      {isHa ? 'Makomar Noman Afrika. Hangen mu shine gina fasahar zamani daga Najeriya zuwa duniya.' : 'The Future of African Agriculture. Our vision is to build world-class technology from Nigeria to the globe.'}
                    </p>
                    <div style={{ background: 'var(--surface-2)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '12px', color: 'var(--text-primary)', fontWeight: 500, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <p style={{ margin: 0 }}>🏢 GreenByte Tech Co (RC 9467262)</p>
                      <p style={{ margin: 0 }}>👨‍💻 Founder: Khalifa Elgezy</p>
                      <p style={{ margin: 0 }}>📞 +234 815 300 5657</p>
                      <p style={{ margin: 0 }}>📧 rabiuhalifaibrahim@gmail.com</p>
                      <p style={{ margin: 0 }}>📧 greenbyte.tech01@gmail.com</p>
                      <p style={{ margin: 0 }}>🌐 bit.ly/greenbyteco</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
};