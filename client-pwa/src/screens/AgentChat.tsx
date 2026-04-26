import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Send, Paperclip, X, ChevronDown, ChevronLeft, Volume2, Square, Trash2 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { supabase } from '../lib/supabase';
import { api } from '../lib/api';

// ── Types ──────────────────────────────────────────────────────
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  ts: Date;
  image_url?: string;
}

// ── Quick suggestion pills ─────────────────────────────────────
const QUICK_EN = [
  'Diagnose my crops 🔬',
  'Maize prices today',
  'Best time to plant?',
  'Weather for farming',
  'How to treat rust?',
];
const QUICK_HA = [
  'Gano cuta a gonata 🔬',
  'Farashin masara yau',
  'Lokacin shuka?',
  'Yanayin sama',
  'Yadda ake magance kjawar-kwandon?',
];

// ── Safe ID Generator for non-HTTPS environments ───────────────
const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'msg-' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
};

// ── Typing indicator ───────────────────────────────────────────
const AIProcessingIndicator = ({ isHa }: { isHa: boolean }) => {
  const [step, setStep] = useState(0);
  const stepsEn = ['Analyzing input...', 'Cross-referencing agricultural database...', 'Generating predictive insights...'];
  const stepsHa = ['Ana duba bayanai...', 'Ana duba kundin bayanan gona...', 'Ana kawo shawara...'];
  const steps = isHa ? stepsHa : stepsEn;

  useEffect(() => {
    const interval = setInterval(() => setStep(s => (s + 1) % steps.length), 1800);
    return () => clearInterval(interval);
  }, [steps.length]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 2px' }}>
      <div style={{ position: 'relative', display: 'flex', width: 12, height: 12 }}>
        <span style={{ position: 'absolute', width: '100%', height: '100%', borderRadius: '50%', background: 'var(--brand-primary)', opacity: 0.75, animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite' }} />
        <span style={{ position: 'relative', display: 'inline-flex', borderRadius: '50%', width: 12, height: 12, background: 'var(--brand-primary)' }} />
      </div>
      <motion.span
        key={step}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -5 }}
        style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--brand-primary)', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}
      >
        {steps[step]}
      </motion.span>
    </div>
  );
};

// ── Markdown & Speech Helpers ─────────────────────────────────
const formatInline = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={i} style={{ color: 'var(--text-primary)' }}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('*') && part.endsWith('*')) return <em key={i}>{part.slice(1, -1)}</em>;
    return part;
  });
};

const formatMarkdown = (text: string) => {
  return text.split('\n').map((line, i) => {
    if (line.startsWith('### ')) return <h3 key={i} style={{ fontWeight: 800, fontSize: '1.15em', marginTop: 12, marginBottom: 4, color: 'var(--text-primary)' }}>{formatInline(line.replace('### ', ''))}</h3>;
    if (line.startsWith('## ')) return <h2 key={i} style={{ fontWeight: 800, fontSize: '1.25em', marginTop: 14, marginBottom: 6, color: 'var(--text-primary)' }}>{formatInline(line.replace('## ', ''))}</h2>;
    if (line.startsWith('# ')) return <h1 key={i} style={{ fontWeight: 800, fontSize: '1.4em', marginTop: 16, marginBottom: 8, color: 'var(--text-primary)' }}>{formatInline(line.replace('# ', ''))}</h1>;
    if (line.match(/^[-*]\s/)) return <li key={i} style={{ marginLeft: 20, marginBottom: 4 }}>{formatInline(line.replace(/^[-*]\s/, ''))}</li>;
    if (line.match(/^\d+\.\s/)) return <li key={i} style={{ marginLeft: 20, listStyleType: 'decimal', marginBottom: 4 }}>{formatInline(line.replace(/^\d+\.\s/, ''))}</li>;
    if (line.trim() === '') return <div key={i} style={{ height: 8 }} />;
    return <div key={i} style={{ marginBottom: 6 }}>{formatInline(line)}</div>;
  });
};

const stripMarkdownForSpeech = (text: string) => {
  return text
    .replace(/[*#_`~>\-]/g, ' ') // Strip all markdown formatting symbols
    .replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '') // Aggressively strip ALL emojis
    .replace(/\s+/g, ' ') // Clean up any double spaces left behind
    .trim();
};

const detectMsgLang = (text: string, defaultLang: string) => {
  const lower = text.toLowerCase();
  const hausaWords = [' yana ', ' kuma ', ' wannan ', ' yadda ', ' don ', ' za ', ' ake ', ' ne ', ' ce ', ' ganye ', ' cuta ', ' ruwa '];
  const frWords = [' le ', ' la ', ' les ', ' des ', ' est ', ' pour ', ' dans ', ' sur ', ' un ', ' une '];
  const enWords = [' the ', ' is ', ' for ', ' and ', ' to ', ' this ', ' it '];
  if (hausaWords.filter(w => lower.includes(w)).length > 1 || lower.includes('sannu') || lower.includes('barka')) return 'ha';
  if (frWords.filter(w => lower.includes(w)).length > 2 || lower.includes('bonjour')) return 'fr';
  if (enWords.filter(w => lower.includes(w)).length > 2) return 'en';
  return defaultLang;
};

// ── Message bubble ─────────────────────────────────────────────
const Bubble = ({ msg, isHa, lang }: { msg: Message; isHa: boolean; lang: string }) => {
  const isUser = msg.role === 'user';
  const [isPlaying, setIsPlaying] = useState(false);
  
  const msgLang = detectMsgLang(msg.content, lang);
  const cleanText = stripMarkdownForSpeech(msg.content);

  // Cleanup speech synthesis if bubble unmounts
  useEffect(() => () => window.speechSynthesis.cancel(), []);

  const toggleTTS = () => {
    if (!('speechSynthesis' in window)) return;

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    const startPlayback = () => {
      const utterance = new SpeechSynthesisUtterance(cleanText);
      const targetLang = msgLang === 'ha' ? 'ha-NG' : msgLang === 'fr' ? 'fr-FR' : 'en-US';
      utterance.lang = targetLang;

      // Target Neural Natural voices first, then fallback to Nigerian English or Swahili (much better Hausa accents!)
      const voices = window.speechSynthesis.getVoices();
      let bestVoice = voices.find(v => v.lang === targetLang && (v.name.includes('Premium') || v.name.includes('Enhanced') || v.name.includes('Natural'))) ||
                      voices.find(v => v.lang === targetLang && v.name.includes('Google')) || 
                      voices.find(v => v.lang === targetLang);
      
      // If no direct Hausa voice, find the best Nigerian or Swahili accent as a fallback
      if (isHa && !bestVoice) {
        bestVoice = voices.find(v => v.lang === 'en-NG' && (v.name.includes('Natural') || v.name.includes('Online'))) ||
                    voices.find(v => v.lang === 'en-NG') ||
                    voices.find(v => v.lang.startsWith('sw'));
      }
      if (bestVoice) utterance.voice = bestVoice;

      utterance.rate = 0.88; // Slightly slower for a much more natural, less robotic tone
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);
      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);
    };

    // Voices might not be loaded immediately.
    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = startPlayback;
    } else {
      startPlayback();
    }
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
      style={{
        display: 'flex',
        flexDirection: isUser ? 'row-reverse' : 'row',
        alignItems: 'flex-end',
        gap: 8,
        marginBottom: 12,
      }}
    >
      {/* Avatar (AI only) */}
      {!isUser && (
        <div style={{
          width: 32, height: 32, borderRadius: 10, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden', background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        }}>
            <img src="/images/logo1.png" alt="AI" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 2 }} onError={(e) => { e.currentTarget.style.display='none' }} />
        </div>
      )}

      <div style={{ maxWidth: '78%', display: 'flex', flexDirection: 'column', gap: 4, alignItems: isUser ? 'flex-end' : 'flex-start' }}>
        {/* Image preview if present */}
        {msg.image_url && (
          <img
            src={msg.image_url}
            alt="Scan"
            style={{
              width: 180, height: 120, borderRadius: 12,
              objectFit: 'cover', border: '1px solid var(--border)',
              marginBottom: 4,
            }}
          />
        )}

        {/* Text bubble */}
        <div style={{
          padding: '11px 15px',
          borderRadius: isUser ? '18px 18px 6px 18px' : '18px 18px 18px 6px',
          background: isUser
            ? 'linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-primary-hover) 100%)'
            : 'var(--surface-glass)',
          border: isUser ? 'none' : '1px solid rgba(255,255,255,0.08)',
          boxShadow: isUser ? 'var(--shadow-green)' : 'var(--shadow-glass)',
        }}>
          <div style={{
            fontFamily: 'var(--font-body)',
            fontSize: 14,
            lineHeight: 1.6,
            color: isUser ? 'var(--ink)' : 'var(--text-primary)',
            whiteSpace: isUser ? 'pre-wrap' : 'normal',
          }}>
            {isUser ? msg.content : formatMarkdown(msg.content)}
          </div>

          {/* TTS Audio Button for AI Messages */}
          {!isUser && (
            <button
              onClick={toggleTTS}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                marginTop: 10, padding: '6px 12px',
            borderRadius: 999, border: isPlaying ? '1px solid #EF4444' : '1px solid rgba(0, 255, 157, 0.25)',
            background: isPlaying ? 'rgba(239, 68, 68, 0.1)' : 'var(--surface-2)',
                width: 'fit-content'
              }}
            >
              {isPlaying ? <Square size={13} fill="currentColor" /> : <Volume2 size={13} />}
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {isPlaying ? (msgLang === 'ha' ? 'Tsaya' : msgLang === 'fr' ? 'Arrêter' : 'Stop') : (msgLang === 'ha' ? 'Saurara' : msgLang === 'fr' ? 'Écouter' : 'Listen')}
              </span>
            </button>
          )}
        </div>

        {/* Timestamp */}
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 9,
          color: 'var(--slate-500)',
          letterSpacing: '0.06em',
        }}>
          {msg.ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </motion.div>
  );
};

// ── Main component ─────────────────────────────────────────────
export const AgentChat: React.FC = () => {
  const { lang, setScreen, isAgentProcessing, setAgentProcessing } = useAppStore();
  const isHa = lang === 'ha';

  const [messages, setMessages]     = useState<Message[]>([]);
  const [input, setInput]           = useState('');
  const [isTyping, setIsTyping]     = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isVoiceSupported, setIsVoiceSupported] = useState(false);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl]   = useState<string | null>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  const listRef        = useRef<HTMLDivElement>(null);
  const inputRef       = useRef<HTMLTextAreaElement>(null);
  const fileInputRef   = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Scroll helpers
  const scrollToBottom = (smooth = true) => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: smooth ? 'smooth' : 'instant' });
  };

  // Check for voice support on mount
  useEffect(() => {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRec) {
      setIsVoiceSupported(true);
    }
  }, []);

  useEffect(() => {
    if (messages.length) scrollToBottom();
  }, [messages, isTyping]);

  const onScroll = () => {
    const el = listRef.current;
    if (!el) return;
    setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 80);
  };

  // Load history
  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('chat_messages')
        .select('id, role, content, created_at, image_url')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(40);
      if (data?.length) {
        setMessages(data.map(r => ({
          id: r.id, role: r.role, content: r.content, ts: new Date(r.created_at), image_url: r.image_url,
        })));
      }
        else {
          // Inject initial welcoming message if chat history is empty
          setMessages([{
            id: 'welcome-msg',
            role: 'assistant',
            content: isHa ? 'Barka da zuwa! Ni ne AgroLingo AI. Ta yaya zan iya taimaka maka a gonarka a yau?' : 'Welcome! I am AgroLingo AI. How can I help you with your farm today?',
            ts: new Date()
          }]);
        }
    };
    load();
  }, []);

  // Clear Chat History
  const clearChat = async () => {
    const confirmClear = window.confirm(isHa ? 'Shin kana son goge wannan tattaunawar?' : 'Are you sure you want to clear this chat history?');
    if (!confirmClear) return;
    
    setMessages([{
      id: 'welcome-msg', role: 'assistant',
      content: isHa ? 'Barka da zuwa! Ni ne AgroLingo AI. Ta yaya zan iya taimaka maka a gonarka a yau?' : 'Welcome! I am AgroLingo AI. How can I help you with your farm today?',
      ts: new Date()
    }]);

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('chat_messages').delete().eq('user_id', user.id);
    }
  };

  // Send message
  const send = useCallback(async (text: string, imgFile?: File | null) => {
    const trimmed = text.trim();
    if (!trimmed && !imgFile) return;

    const userMsg: Message = {
      id: generateId(), role: 'user', content: trimmed, ts: new Date(),
      image_url: imgFile ? URL.createObjectURL(imgFile) : undefined,
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setPreviewFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setIsTyping(true);
    setAgentProcessing(true);

    const controller = new AbortController();
    setAbortController(controller);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id ?? 'anon';

      // Upload image if present
      let uploadedUrl: string | undefined;
      let base64Data: string | undefined;

      if (imgFile) {
        // Convert locally to base64 so Groq can read it instantly
        base64Data = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(imgFile);
        });

        const path = `${userId}/${Date.now()}-${imgFile.name}`;
        const { error } = await supabase.storage.from('scans').upload(path, imgFile, { contentType: imgFile.type });
        if (!error) {
          const { data: { publicUrl } } = supabase.storage.from('scans').getPublicUrl(path);
          uploadedUrl = publicUrl;
        }
      }

      // Pass recent conversation history for memory
      const historyPayload = messages
        .filter(m => m.id !== 'welcome-msg')
        .slice(-20).map(m => ({ role: m.role, content: m.content }));

      // Call backend
      const { data, error } = await api.chat({ message: trimmed, imageUrl: uploadedUrl, base64Image: base64Data, lang, userId: userId, history: historyPayload }, controller.signal);
      
      if (error === 'Aborted') {
        setMessages(prev => prev.filter(m => m.id !== userMsg.id));
        setInput(text);
        if (imgFile) {
          setPreviewFile(imgFile);
          setPreviewUrl(userMsg.image_url || null);
        }
        return;
      }

      const reply = data?.reply ?? (error ? `Connection Failed: ${error}` : 'No response from AI.');

      const aiMsg: Message = { id: generateId(), role: 'assistant', content: reply, ts: new Date() };
      setMessages(prev => [...prev, aiMsg]);

      // Persist to Supabase in the background to prevent lingering typing indicators
      if (user) {
        (async () => {
          const { error } = await supabase.from('chat_messages').insert([
            { user_id: user.id, role: 'user',      content: trimmed, image_url: uploadedUrl },
            { user_id: user.id, role: 'assistant', content: reply },
          ]);
          if (error) console.warn('Failed to save chat history:', error);
        })();
      }
    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => [...prev, {
        id: generateId(), role: 'assistant',
        content: isHa ? 'Kuskure ya faru. Sake gwadawa.' : 'An error occurred. Please try again.',
        ts: new Date(),
      }]);
    } finally {
      setIsTyping(false);
      setAgentProcessing(false);
      setAbortController(null);
    }
  }, [lang, isHa, messages, setAgentProcessing]);

  // Voice input
  const toggleVoice = async () => {
    if (!isVoiceSupported) {

      alert(isHa ? 'Wannan browser din bata goyon bayan murya.' : 'Voice recognition is not supported on this browser/device.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      // Hack to force microphone permission prompt on mobile PWAs
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop()); // Immediately release mic so SpeechRec can use it
      }

      const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const rec = new SpeechRec();
      rec.lang = isHa ? 'ha-NG' : 'en-NG';
      rec.interimResults = false;
      rec.onresult = (e: any) => {
        setInput(prev => prev ? prev + ' ' + e.results[0][0].transcript : e.results[0][0].transcript);
        setIsListening(false);
      };
      rec.onerror = (e: any) => {
        console.warn("Speech Rec Error:", e.error);
        if (e.error !== 'no-speech') {
          alert(isHa ? 'Matsala wajen jin muryar: ' + e.error : 'Microphone error: ' + e.error);
        }
        setIsListening(false);
      };
      rec.onend   = () => setIsListening(false);
      rec.start();
      recognitionRef.current = rec;
      setIsListening(true);
    } catch (err: any) {
      console.error(err);
      alert(isHa ? 'An hana izinin amfani da makurofon.' : 'Microphone permission denied or unavailable.');
      setIsListening(false);
    }
  };

  // File pick
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setPreviewFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  };

  // Auto-grow textarea
  const onInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input, previewFile); }
  };

  const quickSuggestions = isHa ? QUICK_HA : QUICK_EN;
  const isEmpty = messages.length === 0;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100%', background: 'var(--surface-0)',
    }}>
      {/* ── Header ── */}
      <header style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '24px 16px 14px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        position: 'sticky', top: 0, zIndex: 10,
        background: 'var(--surface-glass)',
        backdropFilter: 'blur(25px) saturate(150%)',
        WebkitBackdropFilter: 'blur(25px) saturate(150%)',
      }}>
        <button onClick={() => setScreen('dashboard')} className="btn-icon" style={{ width: 40, height: 40, background: 'var(--surface-2)' }}>
          <ChevronLeft size={20} />
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
            AgroLingo <span style={{ color: 'var(--brand-primary)' }}>AI</span>
          </h1>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: isAgentProcessing ? 'var(--gold)' : 'var(--brand-primary)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            {isAgentProcessing
              ? (isHa ? 'Yana Tunani...' : 'Thinking...')
              : (isHa ? 'Yana Aiki' : 'Online')}
          </p>
        </div>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={clearChat}
          className="btn-icon"
          style={{ width: 36, height: 36, background: 'transparent', border: '1px solid var(--border)' }}
          title={isHa ? 'Sake Tattaunawa' : 'Clear Chat'}
        >
          <Trash2 size={16} style={{ color: 'var(--slate-500)' }} />
        </motion.button>
      </header>

      {/* ── Empty state ── */}
      <div ref={listRef} onScroll={onScroll} style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
        {isEmpty ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              padding: '0 28px',
              height: '100%',
              gap: 24,
            }}
          >
            {/* AI glyph */}
            <div style={{
              width: 80, height: 80, borderRadius: 24,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: 'var(--shadow-glass)',
                overflow: 'hidden', background: 'var(--surface-1)', 
                border: '1px solid var(--border-hover)'
            }}>
                <img src="/images/logo1.png" alt="AI" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 12 }} onError={(e) => { e.currentTarget.style.display='none' }} />
            </div>

            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <h2 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 26, fontWeight: 800,
                letterSpacing: '-0.03em',
                color: 'var(--text-primary)',
                lineHeight: 1,
              }}>
                {isHa ? 'Tambaya Kowa' : 'Ask Anything'}
              </h2>
              <p style={{
                fontFamily: 'var(--font-body)',
                fontSize: 13, color: 'var(--text-muted)',
                lineHeight: 1.6, maxWidth: 240,
              }}>
                {isHa
                  ? 'Nemo shawara game da gonaki, farashin kasuwa, da yanayin sama'
                  : 'Get expert advice on crops, market prices, and weather — in Hausa or English'}
              </p>
            </div>

            {/* Quick suggestions */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', maxWidth: 320 }}>
              {quickSuggestions.map((q, i) => (
                <motion.button
                  key={i}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => send(q)}
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: 12, fontWeight: 500,
                    padding: '9px 14px',
                    borderRadius: 999,
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 200ms',
                  }}
                >
                  {q}
                </motion.button>
              ))}
            </div>
          </motion.div>
        ) : (
          <>
          {messages.map(msg => <Bubble key={msg.id} msg={msg} isHa={isHa} lang={lang} />)}

          {/* Show quick suggestions below the welcome message if it's the only message */}
          {messages.length === 1 && messages[0].id === 'welcome-msg' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              style={{ display: 'flex', flexWrap: 'wrap', gap: 8, paddingLeft: 40, marginBottom: 20 }}
            >
              {quickSuggestions.map((q, i) => (
                <motion.button
                  key={i}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => send(q)}
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: 12, fontWeight: 500,
                    padding: '9px 14px',
                    borderRadius: 999,
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 200ms',
                  }}
                >
                  {q}
                </motion.button>
              ))}
            </motion.div>
          )}
  
          {/* Typing indicator */}
          <AnimatePresence>
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 12 }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden', background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                }}>
                    <img src="/images/logo1.png" alt="AI" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 2 }} onError={(e) => { e.currentTarget.style.display='none' }} />
                </div>
                <div style={{
                  padding: '11px 16px',
                  borderRadius: '18px 18px 18px 6px',
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                }}>
                  <AIProcessingIndicator isHa={isHa} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          </>
        )}
      </div>

      {/* Scroll-to-bottom button */}
      <AnimatePresence>
        {showScrollBtn && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => scrollToBottom()}
            style={{
              position: 'absolute',
              bottom: 100,
              right: 20,
              width: 36, height: 36,
              borderRadius: 999,
              background: 'var(--surface-3)',
              border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', zIndex: 10,
              boxShadow: 'var(--shadow-md)',
            }}
          >
            <ChevronDown size={16} style={{ color: 'var(--text-secondary)' }} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Input bar ── */}
      <div style={{
        padding: '10px 14px 14px',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        background: 'var(--surface-glass)',
      }}>
        {/* Image preview */}
        <AnimatePresence>
          {previewUrl && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 12px', marginBottom: 8,
                background: 'var(--surface-2)', borderRadius: 12,
                border: '1px solid var(--border)',
              }}
            >
              <img src={previewUrl} alt="Preview" style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover' }} />
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--text-muted)', flex: 1 }}>
                {previewFile?.name}
              </p>
              <button onClick={() => { setPreviewFile(null); setPreviewUrl(null); }}>
                <X size={14} style={{ color: 'var(--slate-400)' }} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
          {/* Attach */}
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onFileChange} />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-icon"
            style={{ flexShrink: 0, marginBottom: 2 }}
          >
            <Paperclip size={17} />
          </button>

          {/* Text area */}
          <div style={{
            flex: 1,
            background: 'var(--surface-2)',
            border: '1.5px solid var(--border)',
            borderRadius: 20,
            padding: '10px 14px',
            display: 'flex', alignItems: 'flex-end', gap: 8,
            transition: 'border-color 200ms',
          }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={onInputChange}
              onKeyDown={onKeyDown}
              rows={1}
              placeholder={isHa ? 'Tambayi AI...' : 'Ask AgroLingo AI...'}
              style={{
                flex: 1, background: 'none', border: 'none', outline: 'none',
                fontFamily: 'var(--font-body)', fontSize: 14,
                color: 'var(--text-primary)', lineHeight: 1.5,
                resize: 'none', maxHeight: 120,
              }}
            />
          </div>

          {/* Voice */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 2 }}>
            {/* Pulsating Sonar Ring */}
            {isListening && (
              <motion.div
                animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                style={{
                  position: 'absolute', width: 44, height: 44,
                borderRadius: '50%', background: 'var(--brand-primary)', zIndex: 0
                }}
              />
            )}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={toggleVoice}
              disabled={!isVoiceSupported}
              className="btn-icon"
              style={{
                flexShrink: 0, zIndex: 1,
                background: isListening ? 'var(--brand-primary)' : undefined,
                borderColor: isListening ? 'var(--brand-primary)' : undefined,
                color: isListening ? 'var(--ink)' : undefined,
                boxShadow: isListening ? 'var(--shadow-green)' : undefined,
                opacity: isVoiceSupported ? 1 : 0.4,
                cursor: isVoiceSupported ? 'pointer' : 'not-allowed',
              }}
            >
              <Mic size={17} />
            </motion.button>
          </div>

          {/* Send or Stop */}
          {isTyping ? (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                if (abortController) {
                  abortController.abort();
                  setAbortController(null);
                  setIsTyping(false);
                }
              }}
              style={{
                width: 44, height: 44, borderRadius: 999, flexShrink: 0,
                background: '#EF4444', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 20px rgba(239, 68, 68, 0.4)',
                transition: 'all 200ms', marginBottom: 2,
              }}
            >
              <Square size={17} fill="currentColor" style={{ color: '#FFFFFF' }} />
            </motion.button>
          ) : (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => send(input, previewFile)}
              disabled={!input.trim() && !previewFile}
              style={{
                width: 44, height: 44, borderRadius: 999, flexShrink: 0,
                background: (input.trim() || previewFile) ? 'var(--brand-primary)' : 'var(--surface-2)',
                border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: (input.trim() || previewFile) ? 'var(--shadow-green)' : 'none',
                transition: 'all 200ms', marginBottom: 2,
              }}
            >
              <Send size={17} style={{ color: (input.trim() || previewFile) ? 'var(--ink)' : 'var(--slate-600)' }} />
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
};
