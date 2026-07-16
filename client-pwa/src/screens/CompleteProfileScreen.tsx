import React, { useEffect, useState } from 'react';
import { MapPin, ShieldCheck, Tractor, User } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { supabase } from '../lib/supabase';
import { showToast } from '../utils/toast';

export const CompleteProfileScreen: React.FC = () => {
  const { lang, setScreen } = useAppStore();
  const isHa = lang === 'ha';
  const [fullName, setFullName] = useState('');
  const [farmType, setFarmType] = useState('');
  const [farmLocation, setFarmLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const copy = isHa ? {
    pilot: 'Gwajin farko', title: 'Kammala bayanan asusu',
    body: 'Muna buƙatar bayanai kaɗan domin mu tsara yadda manhajar za ta bayyana. Kada ka saka cikakken adireshin gidanka.',
    name: 'Cikakken suna', type: 'Irin noma (ba dole ba)', location: 'Gari ko jiha',
    typeHint: 'Misali: amfanin gona, kaji ko kifi', locationHint: 'Misali: Dutse, Jigawa',
    continue: 'Ajiye sannan a ci gaba', skip: 'Tsallake yanzu', required: 'A cika suna da gari ko jiha.',
    notice: 'Za ka iya canza waɗannan bayanan daga asusunka daga baya.',
  } : {
    pilot: 'Early pilot', title: 'Complete your profile',
    body: 'We only need a few details to personalize the interface. Do not enter your full home address.',
    name: 'Full name', type: 'Type of farming (optional)', location: 'City or state',
    typeHint: 'For example: crops, poultry or fish', locationHint: 'For example: Dutse, Jigawa',
    continue: 'Save and continue', skip: 'Skip for now', required: 'Enter your name and city or state.',
    notice: 'You can update these details later from your profile.',
  };

  useEffect(() => {
    const load = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase.from('profiles').select('full_name, farm_type, location').eq('id', user.id).maybeSingle();
        if (data?.full_name) setFullName(data.full_name);
        if (data?.farm_type) setFarmType(data.farm_type);
        if (data?.location) setFarmLocation(data.location);
      } finally {
        setInitialLoading(false);
      }
    };
    load();
  }, []);

  const handleContinue = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!fullName.trim() || !farmLocation.trim()) {
      showToast(copy.required);
      return;
    }
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');
      const { error } = await supabase.from('profiles').update({
        full_name: fullName.trim(),
        farm_type: farmType.trim() || null,
        location: farmLocation.trim(),
      }).eq('id', user.id);
      if (error) throw error;
      setScreen('dashboard');
    } catch (caught: unknown) {
      const message = caught instanceof Error ? caught.message : '';
      showToast(message || (isHa ? 'Ba a iya adana bayanan ba.' : 'Unable to save your profile.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="entry-screen profile-setup-screen">
      <header className="entry-topbar">
        <span className="entry-brand"><img src="/images/logo1.png" alt="" /><strong>AgroLingo</strong></span>
        <span className="pilot-chip">{copy.pilot}</span>
      </header>

      <section className="profile-setup-panel">
        <div className="auth-heading"><h1>{copy.title}</h1><p>{copy.body}</p></div>

        {initialLoading ? <div className="entry-loading" aria-label="Loading"><span /><span /><span /></div> : (
          <form className="auth-form" onSubmit={handleContinue}>
            <label className="form-field"><span>{copy.name}</span><div><User size={18} /><input value={fullName} onChange={e => setFullName(e.target.value)} autoComplete="name" /></div></label>
            <label className="form-field"><span>{copy.type}</span><div><Tractor size={18} /><input value={farmType} onChange={e => setFarmType(e.target.value)} placeholder={copy.typeHint} /></div></label>
            <label className="form-field"><span>{copy.location}</span><div><MapPin size={18} /><input value={farmLocation} onChange={e => setFarmLocation(e.target.value)} placeholder={copy.locationHint} autoComplete="address-level1" /></div></label>
            <aside className="setup-notice"><ShieldCheck size={18} /><p>{copy.notice}</p></aside>
            <button className="entry-primary" type="submit" disabled={loading}>{loading ? (isHa ? 'Ana ajiye…' : 'Saving…') : copy.continue}</button>
          </form>
        )}

        <button className="entry-secondary" onClick={() => setScreen('dashboard')} disabled={loading}>{copy.skip}</button>
      </section>
    </main>
  );
};
