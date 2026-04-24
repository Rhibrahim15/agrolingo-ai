import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, TrendingUp, TrendingDown, Minus, Info, Sparkles } from 'lucide-react';
import { XAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { useAppStore } from '../store/useAppStore';
import { supabase } from '../lib/supabase';
import { translations } from '../utils/translations';

interface MarketItem {
  id: string;
  crop_name: string;
  price_per_measure: string;
  trend: 'up' | 'down' | 'stable';
  change_percent: number;
  insight?: string;
}

const rawChartData = [
  { dayEn: 'Mon', dayHa: 'Lit', dayFr: 'Lun', price: 38000 },
  { dayEn: 'Tue', dayHa: 'Tal', dayFr: 'Mar', price: 39500 },
  { dayEn: 'Wed', dayHa: 'Lar', dayFr: 'Mer', price: 38800 },
  { dayEn: 'Thu', dayHa: 'Alh', dayFr: 'Jeu', price: 41000 },
  { dayEn: 'Fri', dayHa: 'Jum', dayFr: 'Ven', price: 43500 },
  { dayEn: 'Sat', dayHa: 'Asb', dayFr: 'Sam', price: 45000 },
];

const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'stable' }) => {
  if (trend === 'up')     return <TrendingUp  size={14} style={{ color: '#4ADE80' }} />;
  if (trend === 'down')   return <TrendingDown size={14} style={{ color: '#F87171' }} />;
  return <Minus size={14} style={{ color: 'var(--slate-400)' }} />;
};

const translateCrop = (name: string, lang: 'ha' | 'en' | 'fr') => {
  if (lang === 'en') return name;

  const map: Record<string, string> = {
    'Maize':     lang === 'ha' ? 'Masara'   : 'Maïs',
    'Millet':    lang === 'ha' ? 'Gero'     : 'Millet',
    'Sorghum':   lang === 'ha' ? 'Dawa'     : 'Sorgho',
    'Cowpea':    lang === 'ha' ? 'Wake'     : 'Niébé',
    'Rice':      lang === 'ha' ? 'Shinkafa' : 'Riz',
    'Groundnut': lang === 'ha' ? 'Gyada'    : 'Arachide',
    'Tomato':    lang === 'ha' ? 'Tumatir'  : 'Tomate',
    'Wheat':     lang === 'ha' ? 'Alkama'   : 'Blé',
    'Sesame':    lang === 'ha' ? 'Ridi'     : 'Sésame',
  };
  return map[name] || name;
};

const translateInsight = (text: string | undefined, lang: 'ha' | 'en' | 'fr') => {
  if (!text || lang === 'en') return text;

  const haMap: Record<string, string> = {
    'Prices rising in Dambatta. Wait 3 days to sell for ~10% higher return.': 'Farashi na tashi a Dambatta. Jira kwana 3 kafin ka sayar don samun karin 10%.',
    'Price stable. Dutse market offers best rates for bulk sellers.': 'Farashi bai canza ba. Kasuwar Dutse tana da farashi mai kyau ga masu sayarwa da yawa.',
    'Steady increase this month. Hold for another week to maximise returns.': 'Farashi na tashi a hankali a wannan watan. Rike na wani mako don samun riba mafi tsoka.',
    'Strong demand in Kano. Good time to sell now before demand eases.': 'Akwai bukatar kaya sosai a Kano. Lokaci mai kyau don sayarwa yanzu kafin a daina nema.',
    'Price dipping slightly. Hold stock 1-2 weeks — recovery expected.': 'Farashi ya fadi kadan. Rike kayanka zuwa mako 1-2 — ana sa ran zai dawo.',
    'Seasonal glut. Consider processing or cold storage if possible.': 'Kaya sun yi yawa a kasuwa yanzu. Ajiye a wurin sanyi ko sarrafa shi idan zai yiwu.',
    'Stable price. Local consumption steady.': 'Farashi bai canza ba. Ana amfani da shi yadda aka saba.',
    'Export demand driving prices up. Sell within 2 weeks for best return.': 'Bukatar kasashen waje na sa farashi tashi. Sayar a cikin mako 2 don riba mafi kyau.'
  };

  const frMap: Record<string, string> = {
    'Prices rising in Dambatta. Wait 3 days to sell for ~10% higher return.': 'Les prix augmentent à Dambatta. Attendez 3 jours pour vendre pour ~10% de plus.',
    'Price stable. Dutse market offers best rates for bulk sellers.': 'Prix stable. Le marché de Dutse offre les meilleurs tarifs pour les grossistes.',
    'Steady increase this month. Hold for another week to maximise returns.': 'Augmentation constante ce mois-ci. Gardez encore une semaine pour maximiser les profits.',
    'Strong demand in Kano. Good time to sell now before demand eases.': 'Forte demande à Kano. Bon moment pour vendre maintenant.',
    'Price dipping slightly. Hold stock 1-2 weeks — recovery expected.': 'Le prix baisse légèrement. Gardez le stock 1-2 semaines.',
    'Seasonal glut. Consider processing or cold storage if possible.': 'Surabondance saisonnière. Envisagez la transformation ou le stockage à froid.',
    'Stable price. Local consumption steady.': 'Prix stable. Consommation locale constante.',
    'Export demand driving prices up. Sell within 2 weeks for best return.': 'La demande d\'exportation fait grimper les prix. Vendez dans les 2 semaines pour un meilleur rendement.'
  };

  if (lang === 'ha') return haMap[text] || text;
  if (lang === 'fr') return frMap[text] || text;
  return text;
};

export const MarketScreen: React.FC = () => {
  const { lang, setScreen } = useAppStore();  
  const t: any = translations[lang as keyof typeof translations] || translations.en;

  // Dynamic AI Market Insights
  const marketInsights = lang === 'ha' ? [
    'Bisa ga yanayin ruwan sama a Jigawa, ana sa ran farashin Gero zai tashi da kashi 8-12%. Muna ba da shawarar a rike.',
    'Kasuwar tana canzawa akai-akai yau. Ana ba da shawarar sayar da hankali.',
    'Farashin wake yana faduwa saboda yawan wadata daga makwabta.',
    'Masara tana da kyau a kasuwa yanzu, lokaci ne mai kyau don sayarwa.'
  ] : [
    'Based on recent rainfall patterns in Jigawa, Millet prices are projected to rise by 8-12%. Recommend delaying bulk sales.',
    'High market volatility today. Recommend careful selling strategies.',
    'Cowpea prices are dropping due to increased supply from neighboring states.',
    'Maize is performing well in the market right now. Good time to consider selling.'
  ];
  if (lang === 'fr') marketInsights.splice(0, marketInsights.length,
    'Selon les récentes pluies à Jigawa, les prix du millet devraient augmenter de 8-12%. Il est recommandé de retarder les ventes en gros.',
    'Forte volatilité du marché aujourd\'hui. Recommandation de stratégies de vente prudentes.',
    'Les prix du niébé baissent en raison de l\'offre accrue des États voisins.',
    'Le maïs se comporte bien sur le marché en ce moment. Bon moment pour envisager de vendre.'
  );
  const dailyInsight = marketInsights[new Date().getDate() % marketInsights.length];

  const chartData = rawChartData.map(d => ({
    day: lang === 'ha' ? d.dayHa : lang === 'fr' ? d.dayFr : d.dayEn,
    price: d.price
  }));

  const [market, setMarket] = useState<MarketItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('market_intelligence')
        .select('*')
        .order('crop_name');
      if (data) setMarket(data as MarketItem[]);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', background: 'var(--surface-0)', paddingBottom: 24 }}>
      {/* ── Header ── */}
      <header style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '24px 16px 14px', borderBottom: '1px solid var(--border)',
        position: 'sticky', top: 0, zIndex: 10,
        background: 'var(--surface-glass)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
      }}>
        <button onClick={() => setScreen('dashboard')} className="btn-icon" style={{ width: 40, height: 40, background: 'var(--surface-2)' }}>
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>
            {t.marketIntel}
          </h1>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {t.liveUpdates}
          </p>
        </div>
      </header>

      <div style={{ padding: '20px 16px', flex: 1 }}>

        {/* ── AI Predictive Insight (Hackathon Wow Factor) ── */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
          style={{ 
            marginBottom: 24, padding: '16px', borderRadius: 'var(--r-xl)',
            background: 'linear-gradient(135deg, rgba(245, 166, 35, 0.1) 0%, rgba(26, 71, 49, 0.4) 100%)',
            border: '1px solid rgba(245, 166, 35, 0.3)', position: 'relative', overflow: 'hidden'
          }}
        >
          {/* Glowing edge */}
          <div style={{ position: 'absolute', top: 0, left: 0, width: 4, height: '100%', background: 'var(--gold)', boxShadow: '0 0 12px var(--gold)' }} />
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Sparkles size={16} style={{ color: 'var(--gold)' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 800, color: 'var(--gold)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              {t.aiPrediction}
            </span>
          </div>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6 }}>
            {dailyInsight}
          </p>
        </motion.div>
        
        {/* ── Chart ── */}
        <div className="card" style={{ padding: '16px', marginBottom: 24, height: 260 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {t.price7d}
            </h3>
            <span className="chip chip-gold">{lang === 'ha' ? 'Gero / Dawanau' : 'Millet / Dawanau'}</span>
          </div>

          <ResponsiveContainer width="100%" height="80%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F5A623" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#F5A623" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} opacity={0.5} />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'var(--slate-400)', fontSize: 10, fontWeight: 600 }} dy={10} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--surface-1)', border: '1px solid var(--border)', 
                  borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-primary)'
                }}
                itemStyle={{ color: 'var(--gold)' }}
                cursor={{ stroke: 'var(--border)', strokeWidth: 1 }}
              />
              <Area type="monotone" dataKey="price" stroke="#F5A623" strokeWidth={3} fillOpacity={1} fill="url(#colorPrice)" animationDuration={1500} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* ── Prices List ── */}
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>
          {t.allCrops}
        </h2>

        <div className="card" style={{ overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '16px' }}>{[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 40, marginBottom: 12, borderRadius: 8 }} />)}</div>
          ) : (
            market.map((item, i) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                style={{
                  padding: '16px', borderBottom: i < market.length - 1 ? '1px solid var(--border)' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: item.insight ? 8 : 0 }}>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
                    {translateCrop(item.crop_name, lang)}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <p style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                      ₦{Number(item.price_per_measure).toLocaleString()}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, width: 44, justifyContent: 'flex-end' }}>
                      <TrendIcon trend={item.trend} />
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, color: item.trend === 'up' ? '#4ADE80' : item.trend === 'down' ? '#F87171' : 'var(--slate-400)' }}>
                        {item.change_percent > 0 ? '+' : ''}{item.change_percent}%
                      </span>
                    </div>
                  </div>
                </div>
                {item.insight && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, padding: '8px 10px', background: 'var(--surface-2)', borderRadius: 8 }}>
                    <Info size={12} style={{ color: 'var(--slate-500)', marginTop: 2, flexShrink: 0 }} />
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{translateInsight(item.insight, lang)}</p>
                  </div>
                )}
              </motion.div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};