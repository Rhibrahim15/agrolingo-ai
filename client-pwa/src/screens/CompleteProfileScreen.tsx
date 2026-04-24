import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, MapPin, ArrowRight, Calendar, Phone, Tractor, Home } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { supabase } from '../lib/supabase';

const Field = ({ icon, placeholder, value, onChange, type = 'text' }: { icon: React.ReactNode; placeholder: string; value: string; onChange: (v: string) => void; type?: string; }) => (
  <div style={{ position: 'relative' }}>
    <div style={{ position: 'absolute', left: 15, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none', zIndex: 1 }}>
      {icon}
    </div>
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      type={type}
      className="input-field"
      style={{ paddingLeft: 46 }}
    />
  </div>
);

export const CompleteProfileScreen: React.FC = () => {
  const { lang, setScreen } = useAppStore();
  const isHa = lang === 'ha';

  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [phone, setPhone] = useState('');
  const [homeAddress, setHomeAddress] = useState('');
  const [farmType, setFarmType] = useState('');
  const [farmLocation, setFarmLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [agreed, setAgreed] = useState(false);

  const handleContinue = async () => {
    if (!fullName.trim() || !farmLocation.trim() || !phone.trim()) {
      setError(isHa ? 'Da fatan za a cika dukkan bayanan.' : 'Please fill out all fields.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          location: farmLocation.trim(),
          // Note: Ensure your Supabase 'profiles' table has these columns added!
          // dob, phone, home_address, farm_type
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Inject a "Wow" factor welcome notification so the dashboard isn't completely empty
      await supabase.from('notification_history').insert([{
        user_id: user.id,
        title: isHa ? 'Barka da zuwa AgroLingo AI!' : 'Welcome to AgroLingo AI!',
        message: isHa 
          ? 'An tsara asusunka. Tambayi AI kowace tambaya game da gonarka ko farashin kasuwa!' 
          : 'Your account is ready. Ask the AI any question about your crops or market prices!',
        type: 'info',
        is_read: false
      }]);

      // Save to offline cache instantly
      localStorage.setItem('agrolingo_profile', JSON.stringify({
        full_name: fullName.trim(),
        location: farmLocation.trim(),
      }));

      // Success, move to the main app
      setScreen('dashboard');

    } catch (e: any) {
      setError(e.message || 'Failed to save profile.');
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

        <div className="flex flex-col gap-4 mb-8 text-left">
          <Field icon={<User size={16} />} placeholder={isHa ? 'Sunan Cikakken' : 'Full Name'} value={fullName} onChange={setFullName} />
          <Field icon={<Phone size={16} />} placeholder={isHa ? 'Lambar Waya' : 'Phone Number'} value={phone} onChange={setPhone} type="tel" />
          <Field icon={<Calendar size={16} />} placeholder={isHa ? 'Ranar Haihuwa' : 'Date of Birth (YYYY-MM-DD)'} value={dob} onChange={setDob} type="date" />
          <Field icon={<Home size={16} />} placeholder={isHa ? 'Cikakken Adireshin Gida' : 'Full Home Address'} value={homeAddress} onChange={setHomeAddress} />
          <Field icon={<Tractor size={16} />} placeholder={isHa ? 'Irin Noma (Misali: Rake, Masara)' : 'Type of Farming (e.g., Poultry, Crop)'} value={farmType} onChange={setFarmType} />
          <Field icon={<MapPin size={16} />} placeholder={isHa ? 'Garin Gona / Jiha' : 'Farm City / State (e.g., Dutse)'} value={farmLocation} onChange={setFarmLocation} />
        </div>

        <label className="flex items-start gap-3 mt-2 mb-6 cursor-pointer text-left">
          <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="mt-1 w-4 h-4 accent-[#FFB703]" />
          <span className="t-body text-sm text-[var(--text-secondary)] leading-tight">
            {isHa ? 'Na yarda da Tsarin Sirri da Sharuɗɗan Amfani da wannan manhajar.' : 'I agree to the Privacy Policy and Terms of Service.'}
          </span>
        </label>

        {error && (<p className="text-red-500 text-sm mb-4">{error}</p>)}

        <motion.button whileTap={{ scale: 0.97 }} onClick={handleContinue} disabled={loading || !agreed} className="btn btn-primary w-full">
          {loading ? (<div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />) : (<><span>{isHa ? 'Ci gaba' : 'Continue'}</span><ArrowRight size={16} strokeWidth={2.5} /></>)}
        </motion.button>
      </motion.div>
    </div>
  );
};