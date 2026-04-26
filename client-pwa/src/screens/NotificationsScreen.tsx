import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BellOff, CheckCheck, CloudRain, TrendingUp, Bug, Info, Trash2 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { translations } from '../utils/translations';
import { supabase } from '../lib/supabase';

// ── Types ──────────────────────────────────────────────────────
type NotifType = 'market' | 'weather' | 'pest' | 'info';

interface Notif {
  id: string;
  title: string;
  message: string;
  type: NotifType;
  is_read: boolean;
  created_at: string;
}

// ── Type config ────────────────────────────────────────────────
const TYPE_CONFIG: Record<NotifType, { Icon: React.ElementType; color: string; bg: string }> = {
  market:  { Icon: TrendingUp, color: 'var(--gold)',   bg: 'rgba(245,166,35,0.10)'  },
  weather: { Icon: CloudRain,  color: '#60A5FA',       bg: 'rgba(96,165,250,0.10)'  },
  pest:    { Icon: Bug,        color: '#F87171',       bg: 'rgba(248,113,113,0.10)' },
  info:    { Icon: Info,       color: 'var(--brand-primary)', bg: 'rgba(0, 255, 157, 0.10)'  },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ── Component ─────────────────────────────────────────────────
export const NotificationsScreen: React.FC = () => {
  const { lang } = useAppStore();
  const t: any = translations[lang as keyof typeof translations] || translations.en;

  const [notifs, setNotifs]     = useState<Notif[]>([]);
  const [loading, setLoading]   = useState(true);
  const unreadCount = notifs.filter(n => !n.is_read).length;

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('notification_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(40);
      if (data) setNotifs(data as Notif[]);
      setLoading(false);
    };
    load();
  }, []);

  const markRead = async (id: string) => {
    await supabase.from('notification_history').update({ is_read: true }).eq('id', id);
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('notification_history').update({ is_read: true }).eq('user_id', user.id);
    setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const deleteNotif = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await supabase.from('notification_history').delete().eq('id', id);
    setNotifs(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div style={{ paddingTop: 108, paddingBottom: 24, minHeight: '100%' }}>

      {/* ── Header ── */}
      <div style={{ padding: '0 18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          {unreadCount > 0 && (
            <p className="t-label" style={{ color: 'var(--gold)', marginBottom: 4 }}>
              {unreadCount} {t.unreadNotifs}
            </p>
          )}
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1 }}>
            {t.notifTitle}
          </h1>
        </div>

        {unreadCount > 0 && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={markAllRead}
            className="chip chip-green"
          >
            <CheckCheck size={13} /> {t.readAll}
          </motion.button>
        )}
      </div>

      {/* ── List ── */}
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {loading ? (
          [1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 'var(--r-xl)' }} />)
        ) : notifs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              padding: '56px 24px', textAlign: 'center',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
            }}
            className="card"
          >
            <div style={{
              width: 56, height: 56, borderRadius: 18,
              background: 'var(--surface-2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <BellOff size={24} style={{ color: 'var(--slate-600)' }} />
            </div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6 }}>
              {t.noNotifs}
            </p>
          </motion.div>
        ) : (
          <AnimatePresence>
            {notifs.map((n, i) => {
              const cfg = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.info;
              const { Icon } = cfg;
              return (
                <motion.div
                  key={n.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => !n.is_read && markRead(n.id)}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 12,
                    padding: '14px 16px',
                    background: n.is_read ? 'var(--surface-1)' : 'rgba(0, 255, 157, 0.08)',
                    border: `1px solid ${n.is_read ? 'transparent' : 'rgba(0, 255, 157, 0.25)'}`,
                    borderTop: n.is_read ? '1px solid rgba(255, 255, 255, 0.15)' : undefined,
                    borderLeft: n.is_read ? '1px solid rgba(255, 255, 255, 0.08)' : undefined,
                    borderRadius: 'var(--r-xl)',
                    cursor: n.is_read ? 'default' : 'pointer',
                    transition: 'all 200ms',
                    position: 'relative',
                  }}
                >
                  {/* Unread dot */}
                  {!n.is_read && (
                    <div style={{
                      position: 'absolute', top: 14, right: 14,
                      width: 7, height: 7, borderRadius: '50%',
                      background: 'var(--gold)',
                    }} />
                  )}

                  {/* Icon */}
                  <div style={{
                    width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                    background: cfg.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    opacity: n.is_read ? 0.6 : 1,
                  }}>
                    <Icon size={18} style={{ color: cfg.color }} />
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0, paddingRight: 16 }}>
                    <p style={{
                      fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700,
                      color: n.is_read ? 'var(--text-secondary)' : 'var(--text-primary)',
                      letterSpacing: '-0.01em', marginBottom: 3, lineHeight: 1.3,
                    }}>
                      {n.title}
                    </p>
                    <p style={{
                      fontFamily: 'var(--font-body)', fontSize: 12, lineHeight: 1.5,
                      color: 'var(--text-muted)',
                    }}>
                      {n.message}
                    </p>
                    <p style={{
                      fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--slate-600)',
                      marginTop: 5, letterSpacing: '0.06em',
                    }}>
                      {timeAgo(n.created_at)}
                    </p>
                  </div>

                  {/* Delete Button */}
                  <button 
                    onClick={(e) => deleteNotif(n.id, e)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--slate-400)', transition: 'color 200ms' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};
