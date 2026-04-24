import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Check, BookOpen, Download } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { translations } from '../utils/translations';
import { supabase } from '../lib/supabase';

// ── Types ──────────────────────────────────────────────────────
type ActivityType = 'Planting' | 'Irrigation' | 'Fertilizer' | 'Harvest' | 'Spraying' | 'Other';

interface JournalEntry {
  id: string;
  activity_type: ActivityType;
  description: string;
  created_at: string;
}

// ── Activity config ────────────────────────────────────────────
const ACTIVITY_CONFIG: Record<ActivityType, { emoji: string; color: string; bg: string }> = {
  Planting:   { emoji: '🌱', color: 'var(--brand-primary)',  bg: 'rgba(16, 185, 129, 0.10)'  },
  Irrigation: { emoji: '💧', color: '#60A5FA',  bg: 'rgba(96,165,250,0.10)'  },
  Fertilizer: { emoji: '🌿', color: '#A78BFA',  bg: 'rgba(167,139,250,0.10)' },
  Harvest:    { emoji: '🌾', color: '#F5A623',  bg: 'rgba(245,166,35,0.10)'  },
  Spraying:   { emoji: '🚿', color: '#F87171',  bg: 'rgba(248,113,113,0.10)' },
  Other:      { emoji: '📝', color: 'var(--slate-400)', bg: 'rgba(148,163,184,0.08)' },
};

// ── Date label helper ─────────────────────────────────────────
function dateLabel(iso: string, today: string, yesterday: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diff === 0) return today;
  if (diff === 1) return yesterday;
  return d.toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── Component ─────────────────────────────────────────────────
export const JournalScreen: React.FC = () => {
  const { lang } = useAppStore();
  const t: any = translations[lang as keyof typeof translations] || translations.en;

  const [entries, setEntries]       = useState<JournalEntry[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [actType, setActType]       = useState<ActivityType>('Planting');
  const [desc, setDesc]             = useState('');
  const [saving, setSaving]         = useState(false);

  // Load entries
  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('farm_journal')
        .select('id, activity_type, description, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(60);
      if (data) setEntries(data as JournalEntry[]);
      setLoading(false);
    };
    load();
  }, []);

  const saveEntry = async () => {
    if (!desc.trim()) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const { data } = await supabase
      .from('farm_journal')
      .insert([{ user_id: user.id, activity_type: actType, description: desc.trim() }])
      .select()
      .single();

    if (data) setEntries(prev => [data as JournalEntry, ...prev]);
    setDesc('');
    setShowForm(false);
    setSaving(false);
  };

  const deleteEntry = async (id: string) => {
    await supabase.from('farm_journal').delete().eq('id', id);
    setEntries(prev => prev.filter(e => e.id !== id));
  };

  const exportToPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to download the PDF.');
      return;
    }

    const html = `
      <html>
        <head>
          <title>AgroLingo AI - ${t.journalTitle}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #111; }
            h1 { color: #10B981; margin-bottom: 5px; }
            p { color: #666; margin-top: 0; margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; }
            th, td { border-bottom: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #f4f7f5; color: #10B981; text-transform: uppercase; font-size: 12px; letter-spacing: 1px;}
            .date { color: #555; white-space: nowrap; }
          </style>
        </head>
        <body>
          <h1>🌾 AgroLingo AI - ${t.journalTitle}</h1>
          <p>Generated on: ${new Date().toLocaleDateString('en-NG', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <table>
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Activity</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              ${entries.map(e => `
                <tr>
                  <td class="date">${new Date(e.created_at).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                  <td><strong>${(t as any)[`activity${e.activity_type}`] ?? e.activity_type}</strong></td>
                  <td>${e.description}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <script>
            window.onload = () => { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const activityKeys = Object.keys(ACTIVITY_CONFIG) as ActivityType[];

  return (
    <div style={{ paddingTop: 108, paddingBottom: 24, minHeight: '100%' }}>

      {/* ── Header ── */}
      <div style={{ padding: '0 18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p className="t-label" style={{ color: 'var(--gold)', marginBottom: 4 }}>
            GreenByte Tech
          </p>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800,
            color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1,
          }}>
            {t.journalTitle}
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={exportToPDF}
            title={lang === 'ha' ? 'Saukewa a PDF' : 'Export to PDF'}
            style={{
              width: 44, height: 44, borderRadius: 'var(--r-lg)',
              background: 'var(--surface-2)', border: '1px solid var(--border)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-secondary)', transition: 'all 200ms',
            }}
          >
            <Download size={18} />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => setShowForm(v => !v)}
            style={{
              width: 44, height: 44, borderRadius: 'var(--r-lg)',
              background: showForm ? 'var(--surface-2)' : 'var(--brand-primary)',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: showForm ? 'var(--text-secondary)' : 'var(--ink)',
              boxShadow: showForm ? 'none' : 'var(--shadow-green)',
              transition: 'all 200ms',
            }}
          >
            {showForm ? <X size={18} /> : <Plus size={18} />}
          </motion.button>
        </div>
      </div>

      {/* ── Add entry form ── */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            className="card"
            style={{ margin: '0 16px 16px', padding: '18px', display: 'flex', flexDirection: 'column', gap: 14 }}
          >
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
              {t.addEntry}
            </p>

            {/* Activity type pills */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {activityKeys.map(a => {
                const c = ACTIVITY_CONFIG[a];
                const selected = actType === a;
                return (
                  <button
                    key={a}
                    onClick={() => setActType(a)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      padding: '7px 12px', borderRadius: 999,
                      border: selected ? `1.5px solid ${c.color}` : '1.5px solid var(--border)',
                      background: selected ? c.bg : 'transparent',
                      cursor: 'pointer', transition: 'all 180ms',
                      fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600,
                      color: selected ? c.color : 'var(--text-muted)',
                      letterSpacing: '0.06em',
                    }}
                  >
                    <span>{c.emoji}</span>
                    <span>{(t as any)[`activity${a}`] ?? a}</span>
                  </button>
                );
              })}
            </div>

            {/* Description textarea */}
            <textarea
              value={desc}
              onChange={e => setDesc(e.target.value)}
              placeholder={t.descPlaceholder}
              rows={3}
              className="input-field"
              style={{ resize: 'none', padding: '12px 16px' }}
            />

            {/* Buttons */}
            <div style={{ display: 'flex', gap: 8 }}>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={saveEntry}
                disabled={saving || !desc.trim()}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                {saving
                  ? <div style={{ width: 18, height: 18, border: '2px solid rgba(0,0,0,0.25)', borderTopColor: 'var(--ink)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  : <><Check size={15} /> {t.save}</>
                }
              </motion.button>
              <button
                onClick={() => { setShowForm(false); setDesc(''); }}
                className="btn btn-secondary"
                style={{ padding: '12px 16px' }}
              >
                <X size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Entry list ── */}
      <div style={{ padding: '0 16px' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1,2,3].map(i => (
              <div key={i} className="skeleton" style={{ height: 80, borderRadius: 'var(--r-xl)' }} />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div style={{
            padding: '48px 24px', textAlign: 'center',
            background: 'var(--surface-1)', borderRadius: 'var(--r-2xl)',
            border: '1px solid var(--border)',
          }}>
            <BookOpen size={32} style={{ color: 'var(--slate-600)', margin: '0 auto 12px' }} />
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6 }}>
              {t.noEntries}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {entries.map((entry, i) => {
              const cfg = ACTIVITY_CONFIG[entry.activity_type] ?? ACTIVITY_CONFIG.Other;
              const label = dateLabel(entry.created_at, t.today, t.yesterday);
              const prevLabel = i > 0
                ? dateLabel(entries[i - 1].created_at, t.today, t.yesterday)
                : null;
              const showDateHeader = label !== prevLabel;

              return (
                <React.Fragment key={entry.id}>
                  {showDateHeader && (
                    <p style={{
                      fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 600,
                      letterSpacing: '0.12em', textTransform: 'uppercase',
                      color: 'var(--text-muted)',
                      padding: i === 0 ? '0 4px 4px' : '8px 4px 4px',
                    }}>
                      {label}
                    </p>
                  )}
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="card"
                    style={{ padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: 12 }}
                  >
                    {/* Activity icon */}
                    <div style={{
                      width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                      background: cfg.bg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 18,
                    }}>
                      {cfg.emoji}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                        <span style={{
                          fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 600,
                          padding: '3px 8px', borderRadius: 999,
                          background: cfg.bg, color: cfg.color,
                          letterSpacing: '0.08em', textTransform: 'uppercase',
                        }}>
                          {(t as any)[`activity${entry.activity_type}`] ?? entry.activity_type}
                        </span>
                        <span style={{
                          fontFamily: 'var(--font-mono)', fontSize: 9,
                          color: 'var(--slate-600)',
                        }}>
                          {new Date(entry.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p style={{
                        fontFamily: 'var(--font-body)', fontSize: 13, lineHeight: 1.55,
                        color: 'var(--text-secondary)',
                      }}>
                        {entry.description}
                      </p>
                    </div>

                    {/* Delete */}
                    <button
                      onClick={() => deleteEntry(entry.id)}
                      style={{
                        width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                        background: 'transparent', border: 'none',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', color: 'var(--slate-600)',
                        transition: 'color 150ms',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#F87171')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'var(--slate-600)')}
                    >
                      <X size={13} />
                    </button>
                  </motion.div>
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
