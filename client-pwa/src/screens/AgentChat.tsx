import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, Mic, Sparkles, User, Bot, ChevronLeft, Camera } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';
import { translations } from '../utils/translations';
import { uploadScan } from '../utils/UploadScan';

export const AgentChat = () => {
  const { lang, user, setScreen, setAgentProcessing, isAgentProcessing } = useAppStore();
  const t = translations[lang] || translations.en;
  
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 🖱️ Auto-scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAgentProcessing]);

  // 📥 Fetch Chat History on Load
  useEffect(() => {
    const fetchHistory = async () => {
      const { data } = await supabase
        .from('chat_messages')
        .select('*')
        .order('created_at', { ascending: true });
      if (data) setMessages(data);
    };
    fetchHistory();
  }, []);

  // 🚀 The Real AI Logic
  const handleSend = async (forcedInput?: string) => {
    const text = forcedInput || input;
    if (!text.trim() || isAgentProcessing) return;

    setInput("");
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return setScreen('auth');

    // 1. Persist User Message to Supabase
    const { data: savedUserMsg } = await supabase.from('chat_messages').insert([
      { user_id: user.id, role: 'user', content: text }
    ]).select().single();

    if (savedUserMsg) setMessages(prev => [...prev, savedUserMsg]);

    // 2. Start "Thinking" UI
    setAgentProcessing(true);

    try {
      // 🕵️ EXTRA STEP: Fetch latest journal for context
      const { data: journal } = await supabase
        .from('farm_journal')
        .select('activity_type, description')
        .limit(3);
      
      const journalContext = journal?.map(j => `${j.activity_type}: ${j.description}`).join(", ") || "";

      // 3. Call your Go Backend
      const response = await fetch('http://localhost:8080/api/v1/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
       body: JSON.stringify({ // 👈 HERE IS WHERE IT GOES
    message: text,
    context: journalContext, 
    lang: lang,
    userId: user.id
  }),
});

      const data = await response.json();

      // 4. Persist AI Response to Supabase
      const { data: savedAiMsg } = await supabase.from('chat_messages').insert([
        { user_id: user.id, role: 'assistant', content: data.reply }
      ]).select().single();

      if (savedAiMsg) setMessages(prev => [...prev, savedAiMsg]);

    } catch (err) {
      console.error("Engine Connection Failed:", err);
      // Fallback
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: lang === 'ha' ? "Ban iya tuntuɓar injin ba." : "I couldn't reach the AgroLingo engine." 
      }]);
    } finally {
      setAgentProcessing(false);
    }
  };

  const handleVoiceTap = () => {
    setIsListening(true);
    setTimeout(() => {
      setIsListening(false);
      const mockQuery = lang === 'ha' ? "Nawa ne farashin masara?" : "What is the price of maize?";
      handleSend(mockQuery);
    }, 2500);
  };

  // Refs and states for file upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Upload and send function
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsUploading(true);
    try {
      // Upload using the utility
      const publicUrl = await uploadScan(file, user.id);
      
      // Send to AI with the Image URL
      await handleSend(`[Photo Sent] Analyzing this crop image: ${publicUrl}`);
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#050a08]">
      
      {/* 🟢 Agent Header */}
      <div className="px-6 py-4 bg-[#0a1a14]/60 backdrop-blur-md border-b border-[#1B4332]/30 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button onClick={() => setScreen('dashboard')} className="p-2 bg-white/5 rounded-xl text-slate-400">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h2 className="text-sm font-black text-white uppercase tracking-widest">{t.chatHeader}</h2>
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${isAgentProcessing ? 'bg-[#FFB703] animate-pulse' : 'bg-emerald-500'}`} />
              <span className="text-[9px] font-black text-slate-500 uppercase">
                {isAgentProcessing ? 'Thinking...' : 'Agent Active'}
              </span>
            </div>
          </div>
        </div>
        <Sparkles className="text-[#FFB703]" size={20} />
      </div>

      {/* 💬 Message Area */}
      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6 scrollbar-none">
        {messages.map((msg, i) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={msg.id || i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[85%] flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-1 ${msg.role === 'user' ? 'bg-[#FFB703] text-[#264653]' : 'bg-white text-[#264653]'}`}>
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className={`p-4 rounded-2xl text-[13.5px] leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-[#FFB703] text-[#264653] font-bold rounded-tr-none' : 'bg-[#1B4332]/20 border border-[#1B4332]/30 text-white rounded-tl-none'}`}>
                {msg.content}
              </div>
            </div>
          </motion.div>
        ))}

        {/* 🧠 Thinking State */}
        {isAgentProcessing && (
          <div className="flex justify-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center animate-pulse"><Bot size={16} /></div>
            <div className="bg-[#1B4332]/20 border border-[#1B4332]/30 p-4 rounded-2xl rounded-tl-none flex gap-1 items-center">
              {[0, 1, 2].map(d => <span key={d} className="w-1.5 h-1.5 bg-[#FFB703] rounded-full animate-bounce" style={{ animationDelay: `${d * 0.15}s` }} />)}
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* ⌨️ Voice & Text Input */}
      <div className="p-6 pb-10 bg-[#050a08] border-t border-[#1B4332]/20">
        <div className="flex items-center gap-3 bg-[#0a1a14] border border-[#1B4332]/40 rounded-[2rem] p-2 pr-3 shadow-2xl">
          {/* Hidden File Input */}
          <input 
            type="file" 
            accept="image/*" 
            capture="environment" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
          />
          
          {/* Camera/Upload Button */}
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-12 h-12 rounded-full flex items-center justify-center text-[#FFB703] hover:bg-white/5 disabled:opacity-50 transition-all"
          >
            {isUploading ? (
              <div className="w-5 h-5 border-2 border-[#FFB703] border-t-transparent animate-spin rounded-full" />
            ) : (
              <Camera size={22} />
            )}
          </button>

          {/* Voice Button */}
          <button 
            onClick={handleVoiceTap}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-[#FFB703] hover:bg-white/5'}`}
          >
            <Mic size={22} />
          </button>

          {/* Text Input */}
          <input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder={t.chatInputPlaceholder}
            className="flex-1 bg-transparent border-none focus:ring-0 text-white text-sm placeholder:text-slate-600 font-bold"
          />

          {/* Send Button */}
          <button 
            onClick={() => handleSend()}
            disabled={!input.trim() || isAgentProcessing}
            className="w-12 h-12 rounded-full bg-[#FFB703] flex items-center justify-center text-[#264653] disabled:opacity-30 transition-all"
          >
            <Send size={18} strokeWidth={3} />
          </button>
        </div>
      </div>
    </div>
  );
};