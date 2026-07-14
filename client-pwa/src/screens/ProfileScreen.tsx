import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Camera, Edit2, Check, X, LogOut, MapPin, Leaf, MessageSquare, BookOpen } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { supabase } from '../lib/supabase';

interface ProfileData {
  full_name: string;
  location: string;
  avatar_url: string | null;
  created_at: string;
}

interface Stats {
  chatCount: number;
  journalCount: number;
  cropsTracked: number;
}

export const ProfileScreen: React.FC = () => {
  const { lang, logout } = useAppStore();
  const isHa = lang === 'ha';

  // Load profile and statistics only for the authenticated user.
  const [profile, setProfile]       = useState<ProfileData | null>(null);
  const [stats, setStats]           = useState<Stats>({ chatCount: 0, journalCount: 0, cropsTracked: 0 });
  const [editingName, setEditingName] = useState(false);
  const [editingLoc, setEditingLoc]   = useState(false);
  const [draftName, setDraftName]     = useState('');
  const [draftLoc, setDraftLoc]       = useState('');
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [error, setError]             = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  // Load profile
  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('profiles')
        .select('full_name, location, avatar_url, created_at')
        .eq('id', user.id)
        .maybeSingle();
      if (data) {
        setProfile(data as ProfileData);
        setDraftName(data.full_name ?? '');
        setDraftLoc(data.location ?? '');
      }

      // Stats
      const [chats, journals, crops] = await Promise.all([
        supabase.from('chat_messages').select('id', { count: 'exact' }).eq('user_id', user.id).eq('role', 'user'),
        supabase.from('farm_journal').select('id', { count: 'exact' }).eq('user_id', user.id),
        supabase.from('crop_progress').select('id', { count: 'exact' }).eq('user_id', user.id),
      ]);
      const newStats = {
        chatCount:    chats.count ?? 0,
        journalCount: journals.count ?? 0,
        cropsTracked: crops.count ?? 0,
      };
      setStats(newStats);
    };
    load();
  }, []);

  const saveName = async () => {
    if (!draftName.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('profiles').update({ full_name: draftName.trim() }).eq('id', user.id);
    setProfile(p => {
      const next = p ? { ...p, full_name: draftName.trim() } : { full_name: draftName.trim() } as ProfileData;
      return next;
    });
    setEditingName(false);
  };

  const saveLoc = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('profiles').update({ location: draftLoc.trim() }).eq('id', user.id);
    setProfile(p => {
      const next = p ? { ...p, location: draftLoc.trim() } : { location: draftLoc.trim() } as ProfileData;
      return next;
    });
    setEditingLoc(false);
  };

  const onAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarLoading(true);
    setError('');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setAvatarLoading(false); return; }

    const ext  = file.name.split('.').pop();
    const path = `${user.id}/avatar.${ext}`;
    const { error: uploadErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true, contentType: file.type });

    if (uploadErr) { setError('Upload failed. Please try again.'); setAvatarLoading(false); return; }

    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
    await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);
    setProfile(p => {
      const next = p ? { ...p, avatar_url: publicUrl } : { avatar_url: publicUrl } as ProfileData;
      return next;
    });
    setAvatarLoading(false);
  };

  const initials = (profile?.full_name ?? '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-NG', { year: 'numeric', month: 'long' })
    : '';

  return (
    <div style={{ minHeight: '100%', background: 'var(--surface-0)' }}>
      {/* ── Sticky Header ── */}
      <header style={{
        padding: '20px 16px', borderBottom: '1px solid var(--border)',
        position: 'sticky', top: 0, zIndex: 20,
        background: 'var(--surface-glass)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)'
      }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
          {isHa ? 'Asusun' : 'Profile'}
        </h1>
      </header>

      {/* ── Hero section ── */}
      <div style={{
        padding: '24px 20px',
        borderBottom: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
      }}>
        {/* Avatar */}
        <div style={{ position: 'relative' }}>
          <div style={{
            width: 88, height: 88, borderRadius: 28,
            background: 'var(--surface-1)',
            border: '1px solid var(--border-hover)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden', position: 'relative',
            boxShadow: 'var(--shadow-green)',
          }}>
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" decoding="async" fetchPriority="high" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{
                fontFamily: 'var(--font-display)',
                fontSize: 30, fontWeight: 800,
                color: 'var(--dew)', letterSpacing: '-0.02em',
              }}>
                {initials}
              </span>
            )}
            {avatarLoading && (
              <div style={{
                position: 'absolute', inset: 0,
                background: 'rgba(14,45,26,0.7)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{
                  width: 24, height: 24, border: '2.5px solid var(--gold)',
                  borderTopColor: 'transparent', borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }} />
              </div>
            )}
          </div>

          {/* Camera button */}
          <button
            onClick={() => fileRef.current?.click()}
            style={{
              position: 'absolute', bottom: -4, right: -4,
              width: 30, height: 30, borderRadius: 999,
              background: 'var(--brand-primary)', border: '2px solid var(--surface-0)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <Camera size={13} style={{ color: 'var(--ink)' }} />
          </button>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onAvatarChange} />
        </div>

        {/* Name (editable) */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {editingName ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                value={draftName}
                onChange={e => setDraftName(e.target.value)}
                autoFocus
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 22, fontWeight: 800,
                  background: 'var(--surface-2)',
                  border: '1.5px solid var(--moss)',
                  borderRadius: 10, padding: '6px 12px',
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.02em',
                  textAlign: 'center', width: 200,
                  outline: 'none',
                }}
              />
              <button onClick={saveName} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4ADE80' }}>
                <Check size={18} />
              </button>
              <button onClick={() => setEditingName(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#F87171' }}>
                <X size={18} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 24, fontWeight: 800,
                color: 'var(--text-primary)',
                letterSpacing: '-0.03em',
              }}>
                {profile?.full_name ?? (isHa ? 'Manomi' : 'Farmer')}
              </h1>
              <button onClick={() => setEditingName(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--slate-500)' }}>
                <Edit2 size={14} />
              </button>
            </div>
          )}

          {/* Location (editable) */}
          {editingLoc ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                value={draftLoc}
                onChange={e => setDraftLoc(e.target.value)}
                autoFocus
                placeholder={isHa ? 'Gari / Jiha' : 'City / State'}
                style={{
                  fontFamily: 'var(--font-body)', fontSize: 13,
                  background: 'var(--surface-2)', border: '1.5px solid var(--moss)',
                  borderRadius: 8, padding: '5px 10px', color: 'var(--text-secondary)',
                  textAlign: 'center', outline: 'none',
                }}
              />
              <button onClick={saveLoc} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4ADE80' }}><Check size={16} /></button>
              <button onClick={() => setEditingLoc(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#F87171' }}><X size={16} /></button>
            </div>
          ) : (
            <div
              onClick={() => setEditingLoc(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'center', cursor: 'pointer' }}
            >
              <MapPin size={12} style={{ color: 'var(--slate-500)' }} />
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)' }}>
                {profile?.location ?? (isHa ? 'Kara wuri...' : 'Add location...')}
              </span>
            </div>
          )}

          {/* Member since */}
          {memberSince && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--slate-600)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {isHa ? 'Mamba tun' : 'Member since'} {memberSince}
            </span>
          )}
        </div>

        {/* GreenByte badge */}
        <div style={{
          padding: '6px 14px', borderRadius: 999,
          background: 'rgba(0, 255, 157, 0.1)',
          border: '1px solid rgba(0, 255, 157, 0.25)',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <Leaf size={12} style={{ color: 'var(--sprout)' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--sprout)' }}>
            GreenByte Tech · RC 9467262
          </span>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
        padding: '20px 16px',
        borderBottom: '1px solid var(--border)',
        gap: 10,
      }}>
        {[
          { label: isHa ? 'Tattaunawa' : 'Chats',    value: stats.chatCount,    Icon: MessageSquare, color: 'var(--gold)', route: 'chat' },
          { label: isHa ? 'Littafin'  : 'Entries',   value: stats.journalCount, Icon: BookOpen,      color: 'var(--sprout)', route: 'journal' },
          { label: isHa ? 'Amfanin'   : 'Crops',     value: stats.cropsTracked, Icon: Leaf,          color: '#60A5FA', route: 'records' },
        ].map(({ label, value, Icon, color, route }, i) => (
          <motion.div key={i} whileTap={{ scale: 0.95 }} onClick={() => useAppStore.getState().setScreen(route as any)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
            <div style={{
              width: 38, height: 38, borderRadius: 12,
              background: `${color}14`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon size={17} style={{ color }} />
            </div>
            <p style={{
              fontFamily: 'var(--font-display)',
              fontSize: 22, fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
            }}>
              {value}
            </p>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {label}
            </p>
          </motion.div>
        ))}
      </div>

      {/* ── Error ── */}
      {error && (
        <div style={{ margin: '12px 20px', padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#F87171' }}>{error}</p>
        </div>
      )}

      {/* ── Sign out ── */}
      <div style={{ padding: '16px 20px' }}>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={logout}
          style={{
            width: '100%', padding: '14px', borderRadius: 'var(--r-xl)',
            background: 'rgba(239,68,68,0.06)',
            border: '1.5px solid rgba(239,68,68,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            cursor: 'pointer', transition: 'all 200ms',
          }}
        >
          <LogOut size={16} style={{ color: '#F87171' }} />
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: '#F87171', letterSpacing: '-0.01em' }}>
            {isHa ? 'Fita' : 'Sign Out'}
          </span>
        </motion.button>
      </div>
    </div>
  );
};
