import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Users, Leaf, MessageSquare, Send, Check, Edit2, Trash2, Plus, X } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { supabase } from '../lib/supabase';
import { translations } from '../utils/translations';

export const AdminDashboard: React.FC = () => {
  const { setScreen, lang } = useAppStore();  
  const t: any = translations[lang as keyof typeof translations] || translations.en;

  const [stats, setStats] = useState({ users: 0, crops: 0, chats: 0 });
  const [loading, setLoading] = useState(true);
  
  // Broadcast State
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'info' | 'weather' | 'market' | 'pest'>('info');
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);

  // User Management State
  const [usersList, setUsersList] = useState<any[]>([]);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [showUserForm, setShowUserForm] = useState(false);
  const [userFormData, setUserFormData] = useState({ id: '', full_name: '', email: '', location: '' });
  const [userLoading, setUserLoading] = useState(false);

  // Market Control State
  const [marketList, setMarketList] = useState<any[]>([]);
  const [showMarketForm, setShowMarketForm] = useState(false);
  const [marketFormData, setMarketFormData] = useState({ id: '', crop_name: '', price_per_measure: '', trend: 'stable', change_percent: 0, insight: '' });

  useEffect(() => {
    const loadStats = async () => {
      const [usersRes, cropsRes, chatsRes, profilesRes, marketRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact' }),
        supabase.from('crop_progress').select('id', { count: 'exact' }),
        supabase.from('chat_messages').select('id', { count: 'exact' }),
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('market_intelligence').select('*').order('crop_name'),
      ]);
      
      setStats({
        users: usersRes.count ?? 0,
        crops: cropsRes.count ?? 0,
        chats: chatsRes.count ?? 0,
      });
      if (profilesRes.data) setUsersList(profilesRes.data);
      if (marketRes.data) setMarketList(marketRes.data);
      setLoading(false);
    };
    loadStats();
  }, []);

  const handleBroadcast = async () => {
    if (!title.trim() || !message.trim()) return;
    setSending(true);
    setSuccess(false);

    try {
      // 1. Get all user IDs
      const { data: users } = await supabase.from('profiles').select('id');
      if (!users) throw new Error('No users found');

      // 2. Prepare notifications array
      const notifications = users.map((u) => ({
        user_id: u.id,
        title: title.trim(),
        message: message.trim(),
        type,
        is_read: false,
      }));

      // 3. Bulk insert
      const { error } = await supabase.from('notification_history').insert(notifications);
      if (error) throw error;

      setSuccess(true);
      setTitle('');
      setMessage('');
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Broadcast failed:', error);
      alert('Failed to send broadcast.');
    } finally {
      setSending(false);
    }
  };

  const handleSaveUser = async () => {
    if (!userFormData.full_name || !userFormData.email) return;
    setUserLoading(true);
    try {
      if (editingUser) {
        const { error } = await supabase.from('profiles').update({
          full_name: userFormData.full_name, location: userFormData.location, email: userFormData.email,
        }).eq('id', editingUser.id);
        if (error) throw error;
        setUsersList(prev => prev.map(u => u.id === editingUser.id ? { ...u, ...userFormData } : u));
      } else {
        // Safe ID generation for environments without HTTPS crypto
        const newId = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : 'id-' + Date.now();
        const { error } = await supabase.from('profiles').insert([{
          id: newId, full_name: userFormData.full_name, location: userFormData.location, email: userFormData.email,
        }]);
        if (error) throw error;
        setUsersList(prev => [{ ...userFormData, id: newId, created_at: new Date().toISOString() }, ...prev]);
      }
      setShowUserForm(false);
      setEditingUser(null);
    } catch (e: any) {
      alert('Error saving user: ' + e.message);
    } finally {
      setUserLoading(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this profile?')) return;
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', id);
      if (error) throw error;
      setUsersList(prev => prev.filter(u => u.id !== id));
    } catch (e: any) { alert('Error deleting user: ' + e.message); }
  };

  const handleSaveMarket = async () => {
    if (!marketFormData.crop_name || !marketFormData.price_per_measure) return;
    try {
      const payload = { ...marketFormData, change_percent: Number(marketFormData.change_percent) };
      const { error } = await supabase.from('market_intelligence').update(payload).eq('id', marketFormData.id);
      if (error) throw error;
      setMarketList(prev => prev.map(m => m.id === marketFormData.id ? { ...m, ...payload } : m));
      setShowMarketForm(false);
    } catch (e: any) {
      alert('Error updating market: ' + e.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', background: 'var(--surface-0)', paddingBottom: 24 }}>
      {/* ── Header ── */}
      <header style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '24px 16px 14px',
        borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 10,
        background: 'var(--surface-glass)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
      }}>
        <button onClick={() => setScreen('dashboard')} className="btn-icon" style={{ width: 40, height: 40 }}>
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>
            {t.commandCenter}
          </h1>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--gold)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {t.adminOnly}
          </p>
        </div>
      </header>

      <div style={{ padding: '20px 16px', flex: 1 }}>
        {/* ── Global Stats ── */}
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 12 }}>{t.systemHealth}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 32 }}>
          {[
            { label: t.farmers, value: stats.users, Icon: Users, color: '#60A5FA' },
            { label: t.crops,   value: stats.crops, Icon: Leaf,  color: 'var(--brand-primary)' },
            { label: t.aiChats, value: stats.chats, Icon: MessageSquare, color: 'var(--gold)' },
          ].map((s, i) => (
            <div key={i} className="card" style={{ padding: '16px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <s.Icon size={18} style={{ color: s.color }} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>
                  {loading ? '-' : s.value}
                </p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {s.label}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Broadcast Tool ── */}
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 12 }}>{t.globalBroadcast}</h2>
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            
            <div>
              <label style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>{t.alertType}</label>
              <select 
                value={type} onChange={(e) => setType(e.target.value as any)}
                className="input-field" style={{ paddingLeft: 16 }}
              >
                <option value="info">{t.alertInfo}</option>
                <option value="weather">{t.alertWeather}</option>
                <option value="pest">{t.alertPest}</option>
                <option value="market">{t.alertMarket}</option>
              </select>
            </div>

            <div>
              <label style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>{t.headline}</label>
              <input 
                value={title} onChange={(e) => setTitle(e.target.value)} 
                placeholder="e.g., Heavy Rain Expected Tomorrow"
                className="input-field" style={{ paddingLeft: 16 }}
              />
            </div>

            <div>
              <label style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>{t.message}</label>
              <textarea 
                value={message} onChange={(e) => setMessage(e.target.value)} 
                placeholder="Type the full message..." rows={3}
                className="input-field" style={{ paddingLeft: 16, resize: 'none' }}
              />
            </div>

            <motion.button 
              whileTap={{ scale: 0.97 }} 
              onClick={handleBroadcast} 
              disabled={sending || !title.trim() || !message.trim()}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px', width: '100%', marginTop: 8 }}
            >
              {sending ? (
                <div style={{ width: 18, height: 18, border: '2px solid rgba(0,0,0,0.2)', borderTopColor: 'var(--ink)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              ) : success ? (
                <><Check size={18} /> {t.sentSuccess}</>
              ) : (
                <><Send size={18} /> {t.broadcastToFarmers}</>
              )}
            </motion.button>

          </div>
        </div>

        {/* ── Market Intelligence Control ── */}
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 12, marginTop: 32 }}>{t.marketControl}</h2>
        <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
                  <th style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t.crop}</th>
                  <th style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t.priceN}</th>
                  <th style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>{t.actions}</th>
                </tr>
              </thead>
              <tbody>
                {marketList.map((m, i) => (
                  <tr key={m.id} style={{ borderBottom: i < marketList.length - 1 ? '1px solid var(--border)' : 'none', background: 'var(--surface-1)' }}>
                    <td style={{ padding: '14px 16px', fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>
                      {m.crop_name}
                      <div style={{ fontSize: 11, color: m.trend === 'up' ? '#4ADE80' : m.trend === 'down' ? '#F87171' : 'var(--text-muted)', fontWeight: 400, marginTop: 2 }}>{m.trend.toUpperCase()} ({m.change_percent}%)</div>
                    </td>
                    <td style={{ padding: '14px 16px', fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: 'var(--gold)' }}>₦{m.price_per_measure}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <button onClick={() => { setMarketFormData(m); setShowMarketForm(true); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#60A5FA' }}><Edit2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Market Form Modal */}
        <AnimatePresence>
          {showMarketForm && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, background: 'rgba(10,15,12,0.8)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
            >
              <motion.div
                initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                className="card" style={{ width: '100%', maxWidth: 400, padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>Edit {marketFormData.crop_name}</h3>
                  <button onClick={() => setShowMarketForm(false)} className="btn-icon" style={{ width: 32, height: 32 }}><X size={16} /></button>
                </div>
                
                <input placeholder="Price (e.g. 45000)" value={marketFormData.price_per_measure} onChange={e => setMarketFormData(p => ({ ...p, price_per_measure: e.target.value }))} className="input-field" style={{ paddingLeft: 16 }} type="number" />
                <div style={{ display: 'flex', gap: 10 }}>
                  <select value={marketFormData.trend} onChange={e => setMarketFormData(p => ({ ...p, trend: e.target.value }))} className="input-field" style={{ paddingLeft: 16, flex: 1 }}>
                    <option value="up">Trending Up</option>
                    <option value="down">Trending Down</option>
                    <option value="stable">Stable</option>
                  </select>
                  <input placeholder="% Change" value={marketFormData.change_percent} onChange={e => setMarketFormData(p => ({ ...p, change_percent: Number(e.target.value) }))} className="input-field" style={{ paddingLeft: 16, width: 100 }} type="number" />
                </div>
                <textarea placeholder="AI Insight override (optional)" value={marketFormData.insight || ''} onChange={e => setMarketFormData(p => ({ ...p, insight: e.target.value }))} className="input-field" style={{ paddingLeft: 16, resize: 'none' }} rows={2} />
                
                <button onClick={handleSaveMarket} className="btn btn-primary" style={{ width: '100%', marginTop: 8 }}>Update Market</button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── User Management Table ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, marginTop: 32 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text-secondary)' }}>{t.userDirectory}</h2>
          <button 
            onClick={() => { setEditingUser(null); setUserFormData({ id: '', full_name: '', email: '', location: '' }); setShowUserForm(true); }}
            className="chip chip-gold"
            style={{ padding: '6px 14px' }}
          >
            <Plus size={14} /> {t.addProfile}
          </button>
        </div>

        <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
                  <th style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Name</th>
                  <th style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Email</th>
                  <th style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {usersList.map((u, i) => (
                  <tr key={u.id} style={{ borderBottom: i < usersList.length - 1 ? '1px solid var(--border)' : 'none', background: 'var(--surface-1)' }}>
                    <td style={{ padding: '14px 16px', fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>
                      {u.full_name || 'N/A'}
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400, marginTop: 2 }}>{u.location || 'No location'}</div>
                    </td>
                    <td style={{ padding: '14px 16px', fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-secondary)' }}>{u.email || 'N/A'}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                        <button onClick={() => { setEditingUser(u); setUserFormData({ id: u.id, full_name: u.full_name || '', email: u.email || '', location: u.location || '' }); setShowUserForm(true); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#60A5FA' }}><Edit2 size={16} /></button>
                        <button onClick={() => handleDeleteUser(u.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#F87171' }}><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {usersList.length === 0 && !loading && (
                  <tr>
                    <td colSpan={3} style={{ padding: '32px 16px', textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-muted)' }}>No users found in directory.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── User Form Modal ── */}
        <AnimatePresence>
          {showUserForm && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, background: 'rgba(10,15,12,0.8)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
            >
              <motion.div
                initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                className="card" style={{ width: '100%', maxWidth: 400, padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>
                    {editingUser ? 'Edit Profile' : 'Add Profile'}
                  </h3>
                  <button onClick={() => setShowUserForm(false)} className="btn-icon" style={{ width: 32, height: 32 }}><X size={16} /></button>
                </div>
                
                <input placeholder="Full Name" value={userFormData.full_name} onChange={e => setUserFormData(p => ({ ...p, full_name: e.target.value }))} className="input-field" style={{ paddingLeft: 16 }} />
                <input placeholder="Email" value={userFormData.email} onChange={e => setUserFormData(p => ({ ...p, email: e.target.value }))} className="input-field" style={{ paddingLeft: 16 }} type="email" />
                <input placeholder="Location" value={userFormData.location} onChange={e => setUserFormData(p => ({ ...p, location: e.target.value }))} className="input-field" style={{ paddingLeft: 16 }} />
                
                <button onClick={handleSaveUser} disabled={userLoading || !userFormData.full_name} className="btn btn-primary" style={{ width: '100%', marginTop: 8 }}>
                  {userLoading ? 'Saving...' : 'Save Profile'}
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};