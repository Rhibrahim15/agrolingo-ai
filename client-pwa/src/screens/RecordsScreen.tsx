import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Leaf, X, Check } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { translations } from '../utils/translations';
import { supabase } from '../lib/supabase';
import { AreaChart, Area, XAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

// ── Types ──────────────────────────────────────────────────────
type CropStatus = 'Growing' | 'Harvested' | 'Failed' | 'Planned';

interface CropRow {
  id: string;
  crop_type: string;
  variety: string | null;
  status: CropStatus;
  growth_stage: number;
  area_ha: number | null;
  planted_at: string | null;
  created_at: string;
}

// ── Status config ──────────────────────────────────────────────
type StatusConfig = { color: string; bg: string; label_en: string; label_ha: string; label_fr: string };

const STATUS_CONFIG: Record<CropStatus, StatusConfig> = {
  Growing:   { color: '#4ADE80', bg: 'rgba(74,222,128,0.10)',  label_en: 'Growing',   label_ha: 'Yana Girma', label_fr: 'En Croissance' },
  Harvested: { color: '#F5A623', bg: 'rgba(245,166,35,0.10)', label_en: 'Harvested', label_ha: 'An Girbi',   label_fr: 'Récolté'       },
  Failed:    { color: '#F87171', bg: 'rgba(248,113,113,0.10)',label_en: 'Failed',    label_ha: 'Ya Kasa',    label_fr: 'Échoué'        },
  Planned:   { color: '#60A5FA', bg: 'rgba(96,165,250,0.10)', label_en: 'Planned',   label_ha: 'An Shirya',  label_fr: 'Planifié'      },
};

const CROP_EMOJIS: Record<string, string> = {
  maize: '🌽', corn: '🌽', masara: '🌽',
  groundnut: '🥜', gyada: '🥜',
  millet: '🌾', gero: '🌾',
  sorghum: '🌾', dawa: '🌾',
  cowpea: '🫘', wake: '🫘',
  tomato: '🍅', tomato2: '🍅',
  rice: '🌾', shinkafa: '🌾',
  wheat: '🌾',
};

function cropEmoji(type: string): string {
  const key = type.toLowerCase().trim();
  return CROP_EMOJIS[key] ?? '🌿';
}

// ── Progress bar ───────────────────────────────────────────────
const GrowthBar = ({ value, status }: { value: number; status: CropStatus }) => {
  const cfg = STATUS_CONFIG[status];
  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Growth
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 600, color: cfg.color }}>
          {value}%
        </span>
      </div>
      <div style={{ height: 5, background: 'var(--surface-3)', borderRadius: 999, overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1], delay: 0.1 }}
          style={{ height: '100%', background: cfg.color, borderRadius: 999 }}
        />
      </div>
    </div>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
    <label style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{label}</label>
    {children}
  </div>
);

const RAW_CHART_DATA = [
  { mEn: 'Jan', mHa: 'Jan', mFr: 'Jan', yield: 120 },
  { mEn: 'Feb', mHa: 'Fab', mFr: 'Fév', yield: 210 },
  { mEn: 'Mar', mHa: 'Mar', mFr: 'Mar', yield: 180 },
  { mEn: 'Apr', mHa: 'Afi', mFr: 'Avr', yield: 340 },
  { mEn: 'May', mHa: 'May', mFr: 'Mai', yield: 450 },
  { mEn: 'Jun', mHa: 'Yun', mFr: 'Juin', yield: 400 },
];

// ── Component ─────────────────────────────────────────────────
export const RecordsScreen: React.FC = () => {
  const { lang } = useAppStore();
  const t: any = translations[lang as keyof typeof translations] || translations.en;
  const isHa = lang === 'ha';

  const [crops, setCrops]         = useState<CropRow[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [saving, setSaving]       = useState(false);

  // New crop form state
  const [newCrop, setNewCrop] = useState<{
    crop_type: string; variety: string; status: CropStatus;
    growth_stage: number; area_ha: string; planted_at: string;
  }>({
    crop_type: '', variety: '', status: 'Growing',
    growth_stage: 0, area_ha: '', planted_at: '',
  });

  const chartData = RAW_CHART_DATA.map(d => ({
    month: lang === 'ha' ? d.mHa : lang === 'fr' ? d.mFr : d.mEn,
    yield: d.yield
  }));

  // Summary stats
  const stats = {
    total:     crops.length,
    growing:   crops.filter(c => c.status === 'Growing').length,
    harvested: crops.filter(c => c.status === 'Harvested').length,
    totalHa:   crops.reduce((s, c) => s + (c.area_ha ?? 0), 0),
  };

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('crop_progress')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (data) setCrops(data as CropRow[]);
      setLoading(false);
    };
    load();
  }, []);

  const saveCrop = async () => {
    if (!newCrop.crop_type.trim()) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const { data } = await supabase
      .from('crop_progress')
      .insert([{
        user_id:      user.id,
        crop_type:    newCrop.crop_type.trim(),
        variety:      newCrop.variety.trim() || null,
        status:       newCrop.status,
        growth_stage: newCrop.growth_stage,
        area_ha:      newCrop.area_ha ? parseFloat(newCrop.area_ha) : null,
        planted_at:   newCrop.planted_at || null,
      }])
      .select()
      .single();

    if (data) setCrops(prev => [data as CropRow, ...prev]);
    setNewCrop({ crop_type: '', variety: '', status: 'Growing', growth_stage: 0, area_ha: '', planted_at: '' });
    setShowForm(false);
    setSaving(false);
  };

  const deleteCrop = async (id: string) => {
    await supabase.from('crop_progress').delete().eq('id', id);
    setCrops(prev => prev.filter(c => c.id !== id));
  };

  const updateStage = async (id: string, stage: number) => {
    await supabase.from('crop_progress').update({ growth_stage: stage }).eq('id', id);
    setCrops(prev => prev.map(c => c.id === id ? { ...c, growth_stage: stage } : c));
  };

  const inputStyle = {
    background: 'var(--surface-2)', border: '1.5px solid var(--border)',
    borderRadius: 10, padding: '10px 12px',
    fontFamily: 'var(--font-body)', fontSize: 13,
    color: 'var(--text-primary)', outline: 'none',
  } as React.CSSProperties;

  return (
    <div style={{ paddingTop: 108, paddingBottom: 24, minHeight: '100%' }}>

      {/* ── Header ── */}
      <div style={{ padding: '0 18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p className="t-label" style={{ color: 'var(--gold)', marginBottom: 4 }}>Analytics</p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1 }}>
            {t.recordsTitle}
          </h1>
        </div>
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => setShowForm(v => !v)}
          style={{
            width: 44, height: 44, borderRadius: 'var(--r-lg)',
            background: showForm ? 'var(--surface-2)' : 'var(--gold)',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: showForm ? 'var(--text-secondary)' : 'var(--ink)',
            boxShadow: showForm ? 'none' : 'var(--shadow-gold)',
            transition: 'all 200ms',
          }}
        >
          {showForm ? <X size={18} /> : <Plus size={18} />}
        </motion.button>
      </div>

      {/* ── Stats strip ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, padding: '0 16px 16px' }}>
        {[
          { label: lang === 'ha' ? 'Duka' : lang === 'fr' ? 'Total' : 'Total', value: stats.total, color: 'var(--text-secondary)' },
          { label: lang === 'ha' ? 'Girma' : lang === 'fr' ? 'En Cours' : 'Growing', value: stats.growing, color: '#4ADE80' },
          { label: lang === 'ha' ? 'Girbi' : lang === 'fr' ? 'Récoltés' : 'Harvested', value: stats.harvested, color: 'var(--gold)' },
          { label: lang === 'ha' ? 'Fili' : lang === 'fr' ? 'Hectares' : 'Hectares', value: `${stats.totalHa.toFixed(1)}ha`, color: '#60A5FA' },
        ].map((s, i) => (
          <div key={i} style={{
            background: 'var(--surface-1)', borderRadius: 'var(--r-lg)',
            border: '1px solid var(--border)', padding: '12px 10px', textAlign: 'center',
          }}>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: s.color, letterSpacing: '-0.02em', lineHeight: 1 }}>
              {s.value}
            </p>
            <p className="t-label" style={{ marginTop: 4 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Analytics Chart (Hollywood Shot) ── */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card glass"
        style={{ margin: '0 16px 16px', padding: '16px', height: 260, position: 'relative', overflow: 'hidden' }}
      >
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: 'var(--r-2xl)', pointerEvents: 'none', zIndex: 0 }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
            style={{ position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%' }}
          >
            <div style={{ position: 'absolute', top: '25%', left: '25%', width: '30%', height: '30%', background: 'var(--brand-primary)', filter: 'blur(45px)', opacity: 0.2, borderRadius: '50%' }} />
            <div style={{ position: 'absolute', bottom: '25%', right: '25%', width: '30%', height: '30%', background: 'var(--gold)', filter: 'blur(45px)', opacity: 0.15, borderRadius: '50%' }} />
          </motion.div>
        </div>

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            {lang === 'ha' ? 'Kiyasin Girbi (Tons)' : lang === 'fr' ? 'Projections de Récolte' : 'Harvest Projections (Tons)'}
          </h3>
          <span className="chip chip-green" style={{ background: 'var(--brand-primary)', color: 'var(--ink)' }}>2026</span>
        </div>
        
        <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '80%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorYield" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--brand-primary)" stopOpacity={0.6}/>
                  <stop offset="95%" stopColor="var(--brand-primary)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} opacity={0.5} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'var(--slate-400)', fontSize: 10, fontWeight: 600 }} dy={10} />
              <RechartsTooltip 
                contentStyle={{ backgroundColor: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-primary)', backdropFilter: 'blur(12px)' }}
                itemStyle={{ color: 'var(--brand-primary)' }}
                cursor={{ stroke: 'var(--border)', strokeWidth: 1 }}
              />
              <Area type="monotone" dataKey="yield" stroke="var(--brand-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorYield)" animationDuration={2000} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* ── Add crop form ── */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              margin: '0 16px 16px', padding: '18px', borderRadius: 'var(--r-2xl)',
              background: 'var(--surface-1)', border: '1px solid var(--border)',
              display: 'flex', flexDirection: 'column', gap: 12,
            }}
          >
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: 'var(--gold)', letterSpacing: '-0.01em' }}>
              {t.addCrop}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Field label={t.cropType}>
                <input
                  placeholder="e.g. Maize"
                  value={newCrop.crop_type}
                  onChange={e => setNewCrop(p => ({ ...p, crop_type: e.target.value }))}
                  style={inputStyle}
                />
              </Field>
              <Field label="Variety">
                <input
                  placeholder="Optional"
                  value={newCrop.variety}
                  onChange={e => setNewCrop(p => ({ ...p, variety: e.target.value }))}
                  style={inputStyle}
                />
              </Field>
              <Field label={t.areaHa}>
                <input
                  type="number" placeholder="e.g. 2.5"
                  value={newCrop.area_ha}
                  onChange={e => setNewCrop(p => ({ ...p, area_ha: e.target.value }))}
                  style={inputStyle}
                />
              </Field>
              <Field label={t.plantedDate}>
                <input
                  type="date"
                  value={newCrop.planted_at}
                  onChange={e => setNewCrop(p => ({ ...p, planted_at: e.target.value }))}
                  style={{ ...inputStyle, colorScheme: 'dark' }}
                />
              </Field>
            </div>

            {/* Status picker */}
            <Field label="Status">
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {(Object.keys(STATUS_CONFIG) as CropStatus[]).map(s => {
                  const cfg = STATUS_CONFIG[s];
                  const selected = newCrop.status === s;
                  return (
                    <button key={s} onClick={() => setNewCrop(p => ({ ...p, status: s }))}
                      style={{
                        padding: '6px 12px', borderRadius: 999,
                        border: selected ? `1.5px solid ${cfg.color}` : '1.5px solid var(--border)',
                        background: selected ? cfg.bg : 'transparent',
                        cursor: 'pointer', transition: 'all 150ms',
                        fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600,
                        color: selected ? cfg.color : 'var(--text-muted)',
                        letterSpacing: '0.06em',
                      }}
                    >
                      {lang === 'ha' ? cfg.label_ha : lang === 'fr' ? cfg.label_fr : cfg.label_en}
                    </button>
                  );
                })}
              </div>
            </Field>

            {/* Growth stage slider */}
            <Field label={`${t.growthStage}: ${newCrop.growth_stage}%`}>
              <input
                type="range" min={0} max={100}
                value={newCrop.growth_stage}
                onChange={e => setNewCrop(p => ({ ...p, growth_stage: +e.target.value }))}
                style={{ width: '100%', accentColor: 'var(--gold)' }}
              />
            </Field>

            <div style={{ display: 'flex', gap: 8 }}>
              <motion.button whileTap={{ scale: 0.97 }} onClick={saveCrop} disabled={saving || !newCrop.crop_type.trim()}
                style={{
                  flex: 1, padding: '12px', borderRadius: 'var(--r-xl)', border: 'none',
                  background: newCrop.crop_type.trim() ? 'var(--gold)' : 'var(--surface-3)',
                  color: newCrop.crop_type.trim() ? 'var(--ink)' : 'var(--text-muted)',
                  cursor: newCrop.crop_type.trim() ? 'pointer' : 'default',
                  fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
              >
                <Check size={15} /> {t.save}
              </motion.button>
              <button onClick={() => setShowForm(false)} style={{ padding: '12px 16px', borderRadius: 'var(--r-xl)', background: 'var(--surface-2)', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Crop cards ── */}
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading ? (
          [1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 120, borderRadius: 'var(--r-xl)' }} />)
        ) : crops.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', background: 'var(--surface-1)', borderRadius: 'var(--r-2xl)', border: '1px solid var(--border)' }}>
            <Leaf size={32} style={{ color: 'var(--slate-600)', margin: '0 auto 12px' }} />
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6 }}>
              {isHa ? 'Babu rikodin amfanin gona. Ƙara na farko.' : 'No crop records yet. Add your first crop above.'}
            </p>
          </div>
        ) : (
          crops.map(crop => {
            const cfg = STATUS_CONFIG[crop.status];
            return (
              <motion.div
                key={crop.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="card"
                style={{ padding: '16px' }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                  {/* Emoji */}
                  <div style={{
                    width: 44, height: 44, borderRadius: 14, flexShrink: 0,
                    background: cfg.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22,
                  }}>
                    {cropEmoji(crop.crop_type)}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <p style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                        {crop.crop_type}
                      </p>
                      <span style={{
                        fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 600,
                        padding: '3px 8px', borderRadius: 999,
                        background: cfg.bg, color: cfg.color, letterSpacing: '0.08em', textTransform: 'uppercase',
                      }}>
                        {lang === 'ha' ? cfg.label_ha : lang === 'fr' ? cfg.label_fr : cfg.label_en}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      {crop.variety && (
                        <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-muted)' }}>
                          {crop.variety}
                        </span>
                      )}
                      {crop.area_ha && (
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--slate-500)', fontWeight: 600 }}>
                          {crop.area_ha} ha
                        </span>
                      )}
                      {crop.planted_at && (
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--slate-500)' }}>
                          🗓 {new Date(crop.planted_at).toLocaleDateString('en-NG', { day: '2-digit', month: 'short' })}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Delete */}
                  <button
                    onClick={() => deleteCrop(crop.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--slate-600)', padding: 4 }}
                  >
                    <X size={14} />
                  </button>
                </div>

                {/* Progress bar + stage slider */}
                <GrowthBar value={crop.growth_stage} status={crop.status} />
                <input
                  type="range" min={0} max={100}
                  value={crop.growth_stage}
                  onChange={e => updateStage(crop.id, +e.target.value)}
                  style={{ width: '100%', marginTop: 8, accentColor: cfg.color }}
                />
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};
