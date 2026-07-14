import React, { useState, useEffect, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { User, MapPin, ArrowRight, Tractor, Camera } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { supabase } from '../lib/supabase';
import { showToast } from '../utils/toast';
import { compressImage } from '../utils/image';

const Field = ({ icon, placeholder, value, onChange, type = 'text' }: { icon: React.ReactNode; placeholder: string; value: string; onChange: (v: string) => void; type?: string; }) => {
  const [currentType, setCurrentType] = useState(type === 'date' ? 'text' : type);
  
  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div style={{ position: 'absolute', left: 15, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none', zIndex: 1 }}>
        {icon}
      </div>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        type={currentType}
        onFocus={() => { if (type === 'date') setCurrentType('date'); }}
        onBlur={() => { if (type === 'date' && !value) setCurrentType('text'); }}
        className="input-field"
        style={{ 
          paddingLeft: 46,
          color: 'var(--text-primary)',
          backgroundColor: 'var(--surface-2)',
          width: '100%',
          display: 'block'
        }}
      />
    </div>
  );
};

export const CompleteProfileScreen: React.FC = () => {
  const { lang, setScreen } = useAppStore();
  const isHa = lang === 'ha';

  const [fullName, setFullName] = useState('');
  const [farmType, setFarmType] = useState('');
  const [farmLocation, setFarmLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const nameShakeControls = useAnimation();
  const locationShakeControls = useAnimation();

  // Fetch existing profile data on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
        if (data) {
          if (data.full_name) setFullName(data.full_name);
          if (data.farm_type) setFarmType(data.farm_type);
          if (data.location) setFarmLocation(data.location);
          if (data.avatar_url) setAvatarUrl(data.avatar_url);
        }
      } finally {
        setInitialLoading(false);
      }
    };
    fetchProfile();
  }, []);
  
  const onAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      const optimizedImage = await compressImage(file);
      const ext = file.name.split('.').pop();
      const path = `${user.id}/avatar.${ext}`;
      const { error: uploadErr } = await supabase.storage.from('avatars').upload(path, optimizedImage, { upsert: true, contentType: optimizedImage.type });
      if (uploadErr) throw uploadErr;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
      setAvatarUrl(publicUrl);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '';
      showToast(message || (isHa ? 'Ba a iya ɗora hoton ba.' : 'Upload failed. Please try again.'));
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleContinue = async () => {
    let hasEmpty = false;
    const shakeAnimation = { x: [-10, 10, -10, 10, -5, 5, 0], transition: { duration: 0.4 } };

    if (!fullName.trim()) { nameShakeControls.start(shakeAnimation); hasEmpty = true; }
    if (!farmLocation.trim()) { locationShakeControls.start(shakeAnimation); hasEmpty = true; }

    if (hasEmpty) {
      showToast(isHa ? 'Da fatan za a cika dukkan bayanan.' : 'Please fill out all fields.');
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          location: farmLocation.trim(),
          farm_type: farmType.trim(),
          avatar_url: avatarUrl
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      const firstName = fullName.trim().split(' ')[0];
      const welcomeEn = `Welcome ${firstName}! AgroLingo AI is your intelligent farming assistant. Get crop advice, market prices, and weather updates directly in your pocket.`;
      const welcomeHa = `Barka da zuwa ${firstName}! AgroLingo AI shine mataimakinka na noma mai wayo. Samu shawarwari akan amfanin gona da farashin kasuwa.`;
      const welcomeFr = `Bienvenue ${firstName}! AgroLingo AI est votre assistant agricole intelligent. Obtenez des conseils sur les cultures et les prix du marché.`;

      // Inject welcome notifications in all 3 languages
      await supabase.from('notification_history').insert([
        { user_id: user.id, title: 'Welcome to AgroLingo AI!', message: welcomeEn, type: 'info', is_read: false },
        { user_id: user.id, title: 'Barka da zuwa AgroLingo AI!', message: welcomeHa, type: 'info', is_read: false },
        { user_id: user.id, title: 'Bienvenue sur AgroLingo AI!', message: welcomeFr, type: 'info', is_read: false }
      ]);

      // Trigger Native OS Notification
      if ('Notification' in window) {
        const perm = await Notification.requestPermission();
        if (perm === 'granted') {
          const title = isHa ? 'Barka da zuwa AgroLingo AI!' : 'Welcome to AgroLingo AI!';
          const body = isHa ? welcomeHa : welcomeEn;
          
          navigator.serviceWorker?.ready.then(reg => {
            reg.showNotification(title, { body, icon: '/images/logo1.png', badge: '/images/logo1.png' });
          }).catch(() => {
            new Notification(title, { body, icon: '/images/logo1.png' });
          });
        }
      }

      // Success, move to the main app
      setScreen('dashboard');

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '';
      showToast(message || (isHa ? 'Ba a iya adana bayanan ba.' : 'Failed to save profile.'));
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center min-h-[100dvh] p-6 bg-surface-0 pt-16 pb-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-sm text-center"
      >
        <div className="mb-10">
          <h1 className="t-display text-3xl mb-2">
            {isHa ? 'Kammala Bayanan Ka' : 'Complete Your Profile'}
          </h1>
          <p className="t-body text-base">
            {isHa ? 'Don Allah cika waɗannan bayanan don kammala asusunka.' : 'Please provide a few more details to set up your farm profile.'}
          </p>
        </div>

        {/* Avatar Upload Container */}
        <div style={{ position: 'relative', width: 88, height: 88, margin: '0 auto 24px' }}>
          <div style={{
            width: '100%', height: '100%', borderRadius: 28,
            background: 'var(--surface-1)', border: '1px solid var(--border-hover)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden', position: 'relative', boxShadow: 'var(--shadow-glass)'
          }}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <User size={32} style={{ color: 'var(--slate-500)' }} />
            )}
            {avatarLoading && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(14,45,26,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 24, height: 24, border: '2.5px solid var(--gold)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              </div>
            )}
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            style={{
              position: 'absolute', bottom: -4, right: -4, width: 30, height: 30, borderRadius: 999,
              background: 'var(--brand-primary)', border: '2px solid var(--surface-0)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}
          >
            <Camera size={13} style={{ color: 'var(--ink)' }} />
          </button>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onAvatarChange} />
        </div>

        {initialLoading ? (
          <div className="flex flex-col gap-4 text-left w-full mb-2">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="skeleton" style={{ height: 52, borderRadius: '12px', width: '100%' }} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-4 text-left w-full">
            <motion.div animate={nameShakeControls} className="w-full">
              <Field icon={<User size={16} />} placeholder={isHa ? 'Sunan Cikakken' : 'Full Name'} value={fullName} onChange={setFullName} />
            </motion.div>
            <Field icon={<Tractor size={16} />} placeholder={isHa ? 'Irin Noma (Misali: Rake, Masara)' : 'Type of Farming (e.g., Poultry, Crop)'} value={farmType} onChange={setFarmType} />
            <motion.div animate={locationShakeControls} className="w-full">
              <Field icon={<MapPin size={16} />} placeholder={isHa ? 'Garin Gona / Jiha' : 'Farm City / State (e.g., Dutse)'} value={farmLocation} onChange={setFarmLocation} />
            </motion.div>
          </div>
        )}

        <div style={{ width: '100%', marginTop: '24px', marginBottom: '24px', padding: '16px', background: 'var(--surface-1)', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <label className="flex items-start gap-3 cursor-pointer text-left m-0">
            <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="mt-1 w-4 h-4 accent-[#FFB703] flex-shrink-0" />
            <span className="t-body text-sm text-[var(--text-secondary)] leading-tight">
              {isHa ? 'Na yarda da Tsarin Sirri da Sharuɗɗan Amfani da wannan manhajar.' : 'I agree to the Privacy Policy and Terms of Service.'}
            </span>
          </label>
        </div>

        <motion.button whileTap={{ scale: 0.97 }} onClick={handleContinue} disabled={loading || !agreed} className="btn btn-primary w-full">
          {loading ? (<div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />) : (<><span>{isHa ? 'Ci gaba' : 'Continue'}</span><ArrowRight size={16} strokeWidth={2.5} /></>)}
        </motion.button>

        <motion.button 
          whileTap={{ scale: 0.97 }} 
          onClick={() => setScreen('dashboard')} 
          disabled={loading} 
          className="w-full mt-4 py-3 rounded-xl font-bold text-[var(--text-secondary)] bg-transparent border border-[var(--border)] hover:bg-[var(--surface-1)] transition-colors"
        >
          {isHa ? 'Tsallake tukunna' : 'Skip for now'}
        </motion.button>
      </motion.div>
    </div>
  );
};