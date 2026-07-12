import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Send, Paperclip, X, ChevronDown, ChevronLeft, Volume2, Square, Trash2 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { supabase } from '../lib/supabase';
import { api } from '../lib/api';
import { Client } from '@gradio/client';

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
const QUICK_FR = [
  'Diagnostiquer mes cultures 🔬',
  'Prix du maïs aujourd\'hui',
  'Meilleur moment pour planter ?',
  'Météo pour l\'agriculture',
  'Comment traiter la rouille ?',
];

// ── Safe ID Generator for non-HTTPS environments ───────────────
const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'msg-' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
};

// ── Hugging Face Client Setup ──────────────────────────────────
let hfClient: any = null;
const getHfClient = async () => {
  if (!hfClient) {
    hfClient = await Client.connect("Elgezy15/AgroLingo-Voice-API");
  }
  return hfClient;
};

// ── Image Compressor ───────────────────────────────────────────
const compressImage = (file: File): Promise<File> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_SIZE = 512;
      let width = img.width;
      let height = img.height;
      if (width > height && width > MAX_SIZE) {
        height *= MAX_SIZE / width; width = MAX_SIZE;
      } else if (height > MAX_SIZE) {
        width *= MAX_SIZE / height; height = MAX_SIZE;
      }
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      canvas.toBlob(blob => {
        if (blob) resolve(new File([blob], file.name, { type: 'image/jpeg' }));
        else resolve(file);
      }, 'image/jpeg', 0.65);
    };
    img.onerror = () => resolve(file);
    img.src = URL.createObjectURL(file);
  });
};

// ── Typing indicator ───────────────────────────────────────────
const AIProcessingIndicator = ({ lang }: { lang: string }) => {
  const [step, setStep] = useState(0);
  const steps = lang === 'ha' ? ['Ana duba bayanai...', 'Ana duba kundin bayanan gona...', 'Ana kawo shawara...'] 
              : lang === 'fr' ? ['Analyse en cours...', 'Vérification de la base de données...', 'Génération de conseils...']
              : ['Analyzing input...', 'Cross-referencing agricultural database...', 'Generating predictive insights...'];

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
    .replace(/\([^)]+\)/g, '') // Strip out English words/explanations inside parentheses (e.g. "(image generation)")
    .replace(/[*#_`~>\-]/g, ' ') // Strip all markdown formatting symbols
    .replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '') // Aggressively strip ALL emojis
    .replace(/\bAI\b/g, 'Ey Ay') // Phonetically spell AI so the Hausa voice doesn't stumble
    .replace(/\bAgroLingo\b/gi, 'Agro Lingo')
    .replace(/[,;:]/g, '.') // Convert all minor pauses into full stops so TTS respects them better and flows smoothly
    .replace(/\s+/g, ' ') // Clean up any double spaces left behind
    .trim();
};

const detectMsgLang = (text: string, defaultLang: string) => {
  if (!text) return defaultLang;
  // Detect Arabic script anywhere in the text
  if (/[\u0600-\u06FF]/.test(text)) return 'ar';
  
  const words = text.toLowerCase().split(/[\s,.;!?]+/);
  const hausaList = ['yana', 'kuma', 'wannan', 'yadda', 'don', 'za', 'ake', 'ne', 'ce', 'ganye', 'cuta', 'ruwa', 'sannu', 'barka', 'cikin', 'amma', 'idan', 'kake', 'yanzu', 'ya', 'ta', 'ba'];
  const frList = ['le', 'la', 'les', 'des', 'est', 'pour', 'dans', 'sur', 'un', 'une', 'bonjour', 'oui', 'non', 'avec', 'vous', 'nous', 'et', 'en'];
  const enList = ['the', 'is', 'for', 'and', 'to', 'this', 'it', 'you', 'hello', 'what', 'can', 'how', 'do', 'we', 'are', 'in', 'of'];
  
  let ha = 0, fr = 0, en = 0;
  words.forEach(w => {
    if (hausaList.includes(w)) ha++;
    if (frList.includes(w)) fr++;
    if (enList.includes(w)) en++;
  });
  
  if (ha === 0 && fr === 0 && en === 0) return defaultLang;
  if (ha >= fr && ha >= en) return 'ha';
  if (fr > ha && fr >= en) return 'fr';
  return 'en';
};

// ── Message bubble ─────────────────────────────────────────────
const Bubble = ({ msg, lang }: { msg: Message; lang: string }) => {
  const isUser = msg.role === 'user';
  const { theme } = useAppStore();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ttsActive = useRef(false);
  
  const msgLang = detectMsgLang(msg.content, lang);
  const cleanText = stripMarkdownForSpeech(msg.content);

  // Cleanup speech synthesis if bubble unmounts
  useEffect(() => {
    return () => {
      ttsActive.current = false;
      window.speechSynthesis.cancel();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, []);

  const toggleTTS = async () => {
    if (isPlaying || isSynthesizing) {
      ttsActive.current = false; // Stop the pipeline
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setIsSynthesizing(false);
      return;
    }

    const startBrowserFallback = (textToSpeak: string) => {
      if (!('speechSynthesis' in window)) {
        setIsPlaying(false);
        setIsSynthesizing(false);
        return;
      }
      setIsPlaying(true);
      setIsSynthesizing(false);
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      const targetLang = msgLang === 'ha' ? 'ha-NG' : msgLang === 'fr' ? 'fr-FR' : msgLang === 'ar' ? 'ar-SA' : 'en-US';
      utterance.lang = targetLang;

      const voices = window.speechSynthesis.getVoices();
      let bestVoice = voices.find(v => v.lang.startsWith(targetLang.split('-')[0]) && (v.name.includes('Premium') || v.name.includes('Enhanced') || v.name.includes('Natural') || v.name.includes('Online'))) ||
                      voices.find(v => v.lang === targetLang && v.name.includes('Google')) || 
                      voices.find(v => v.lang === targetLang) ||
                      (msgLang === 'ar' ? voices.find(v => v.lang.startsWith('ar-')) : undefined);
      
      if (lang === 'ha' && !bestVoice) {
        bestVoice = voices.find(v => v.lang === 'en-NG' && (v.name.includes('Natural') || v.name.includes('Online') || v.name.includes('Premium'))) ||
                    voices.find(v => v.lang === 'en-NG') ||
                    voices.find(v => v.lang.startsWith('en')) || 
                    voices.find(v => v.lang.startsWith('sw'));
      }
      if (bestVoice) utterance.voice = bestVoice;

      utterance.rate = 1.0; 
      utterance.pitch = 1.05; 
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);
      window.speechSynthesis.speak(utterance);
    };

    // ── HUGGING FACE NATIVE HAUSA TTS ──
    if (msgLang === 'ha') {
      ttsActive.current = true;
      setIsSynthesizing(true);
      setIsPlaying(true); // Treat as playing immediately so the stop button appears
      
      const chunks = cleanText.match(/[^.!?\n]+[.!?\n]*/g)?.map(c => c.trim()).filter(Boolean) || [cleanText];
      let currentChunkIndex = 0;

      try {
        const client = await getHfClient();
        
        // PIPELINE CHUNKING: Split text ONLY by full sentences (periods, exclamation, questions, newlines).
        // Commas have been removed so the voice doesn't stop mid-sentence and sound choppy/slow!
        
        let nextPromise = client.predict("/synthesize", [chunks[0]]);
        
        for (; currentChunkIndex < chunks.length; currentChunkIndex++) {
          if (!ttsActive.current) break;
          
          setIsSynthesizing(true);
          // 12-second timeout so it never hangs indefinitely
          const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("HF Timeout")), 12000));
          const resultData = await Promise.race([nextPromise, timeoutPromise]);

          if (!ttsActive.current) break;

          // Pipeline: Start fetching the next chunk immediately while this one prepares to play
          if (currentChunkIndex + 1 < chunks.length) {
            nextPromise = client.predict("/synthesize", [chunks[currentChunkIndex + 1]]);
          }
          
          const audioData = (resultData as any).data[0];
          const audioUrl = typeof audioData === 'string' ? audioData : (audioData?.url || audioData?.path || audioData?.data);
          const finalUrl = audioUrl.startsWith('http') || audioUrl.startsWith('data:') ? audioUrl : `https://elgezy15-agrolingo-voice-api.hf.space${audioUrl.startsWith('/') ? '' : '/'}${audioUrl}`;
          
          await new Promise<void>((resolve, reject) => {
            const audio = new Audio(finalUrl);
            audioRef.current = audio;
            audio.onended = resolve;
            audio.onerror = reject;
            setIsSynthesizing(false);
            
            // Play immediately! The tiny fraction of a second it takes to load the next network chunk
            // naturally sounds exactly like a human taking a breath between sentences.
            if (currentChunkIndex === 0) audio.play().catch(reject);
            else setTimeout(() => { if (ttsActive.current) audio.play().catch(reject); else resolve(); }, 150);
          });
        }
        
        // If everything succeeded, stop here!
        ttsActive.current = false;
        setIsSynthesizing(false);
        setIsPlaying(false);
        return;
      } catch (err) {
        console.warn("Hugging Face TTS Error, falling back to native Browser TTS:", err);
        if (!ttsActive.current) return;
        const remainingText = chunks.slice(currentChunkIndex).join(' ');
        if (remainingText) {
          const playFallback = () => startBrowserFallback(remainingText);
          if (window.speechSynthesis.getVoices().length === 0) {
            window.speechSynthesis.onvoiceschanged = playFallback;
            setTimeout(playFallback, 500);
          } else {
            playFallback();
          }
        }
        return;
      }
    }

    // English/French standard route
    const playFallback = () => startBrowserFallback(cleanText);
    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = playFallback;
      setTimeout(playFallback, 500);
    } else {
      playFallback();
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
            <img src={theme === 'dark' ? '/images/logo-light.png' : '/images/logo-dark.png'} alt="AI" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 2 }} onError={(e) => { e.currentTarget.src='/images/logo1.png' }} />
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
          padding: '14px 18px',
          borderRadius: isUser ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
          background: isUser
            ? 'linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-primary-hover) 100%)'
            : 'var(--surface-glass)',
          backdropFilter: isUser ? 'none' : 'blur(16px)',
          WebkitBackdropFilter: isUser ? 'none' : 'blur(16px)',
          border: isUser ? 'none' : '1px solid rgba(255,255,255,0.1)',
          boxShadow: isUser ? '0 6px 16px rgba(0, 214, 133, 0.2)' : '0 4px 16px rgba(0, 0, 0, 0.1)',
        }}>
          <div style={{
            fontFamily: 'var(--font-body)',
            fontSize: 14.5,
            lineHeight: 1.65,
            letterSpacing: isUser ? '-0.01em' : '0',
            color: isUser ? 'var(--ink)' : 'var(--text-primary)',
            whiteSpace: isUser ? 'pre-wrap' : 'normal',
            fontWeight: isUser ? 500 : 400,
          }}>
            {isUser ? msg.content : formatMarkdown(msg.content)}
          </div>

          {/* TTS Audio Button for AI Messages */}
          {!isUser && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
              <button
                onClick={toggleTTS}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 12px',
                  borderRadius: 999, border: isPlaying ? '1px solid #EF4444' : '1px solid rgba(0, 255, 157, 0.25)',
                  background: isPlaying ? 'rgba(239, 68, 68, 0.1)' : 'var(--surface-2)',
                  width: 'fit-content'
                }}
              >
                {isSynthesizing ? (
                  <div style={{ width: 13, height: 13, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                ) : isPlaying ? (
                  <Square size={13} fill="currentColor" />
                ) : (
                  <Volume2 size={13} />
                )}
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {isPlaying ? (msgLang === 'ha' ? 'Tsaya' : msgLang === 'fr' ? 'Arrêter' : 'Stop') : (msgLang === 'ha' ? 'Saurara' : msgLang === 'fr' ? 'Écouter' : 'Listen')}
                </span>
              </button>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'var(--slate-500)', fontStyle: 'italic' }}>
                {msgLang === 'ha' ? '🤖 Muryar AI (Ba lallai ta zama daidai 100% ba)' : 
                 msgLang === 'fr' ? '🤖 Voix IA (Peut avoir des imperfections)' : 
                 '🤖 AI Voice (May have imperfections)'}
              </span>
            </div>
          )}
        </div>

        {/* Timestamp */}
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', padding: '0 4px', marginTop: 2 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--slate-500)', letterSpacing: '0.06em' }}>
            {msg.ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--slate-400)', letterSpacing: '0.06em' }}>
            {msg.ts.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

// ── Main component ─────────────────────────────────────────────
export const AgentChat: React.FC = () => {
  const { lang, setScreen, isAgentProcessing, setAgentProcessing, theme } = useAppStore();

  const [messages, setMessages]     = useState<Message[]>([]);
  const [input, setInput]           = useState('');
  const [isTyping, setIsTyping]     = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl]   = useState<string | null>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const listRef        = useRef<HTMLDivElement>(null);
  const inputRef       = useRef<HTMLTextAreaElement>(null);
  const fileInputRef   = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef   = useRef<BlobPart[]>([]);

  // Warm up the Hugging Face Server Connection immediately on mount
  useEffect(() => {
    getHfClient().catch(() => console.warn("Background HF connection warming failed"));
  }, []);

  // Scroll helpers
  const scrollToBottom = (smooth = true) => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: smooth ? 'smooth' : 'instant' });
  };

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
            .order('created_at', { ascending: false })
        .limit(40);
      if (data?.length) {
            setMessages(data.reverse().map(r => ({
          id: r.id, role: r.role, content: r.content, ts: new Date(r.created_at), image_url: r.image_url,
        })));
      }
        else {
          // Inject initial welcoming message if chat history is empty
          setMessages([{
            id: 'welcome-msg',
            role: 'assistant',
            content: lang === 'ha' ? 'Barka da zuwa! Ni ne AgroLingo AI. Ta yaya zan iya taimaka maka a gonarka a yau?' : lang === 'fr' ? "Bienvenue ! Je suis AgroLingo AI. Comment puis-je vous aider avec votre ferme aujourd'hui ?" : 'Welcome! I am AgroLingo AI. How can I help you with your farm today?',
            ts: new Date()
          }]);
        }
      setLoadingHistory(false);
    };
    load();
  }, []);

  // Clear Chat History
  const clearChat = async () => {
    const confirmClear = window.confirm(lang === 'ha' ? 'Shin ka tabbata kana son goge wannan tattaunawar?' : lang === 'fr' ? 'Êtes-vous sûr de vouloir effacer cet historique ?' : 'Are you sure you want to clear this chat history?');
    if (!confirmClear) return;
    
    setMessages([{
      id: 'welcome-msg', role: 'assistant',
      content: lang === 'ha' ? 'Barka da zuwa! Ni ne AgroLingo AI. Ta yaya zan iya taimaka maka a gonarka a yau?' : lang === 'fr' ? "Bienvenue ! Je suis AgroLingo AI. Comment puis-je vous aider avec votre ferme aujourd'hui ?" : 'Welcome! I am AgroLingo AI. How can I help you with your farm today?',
      ts: new Date()
    }]);

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('chat_messages').delete().eq('user_id', user.id);
    }
  };

  // Send message
  const send = useCallback(async (text: string, imgFile?: File | null) => {
    // 📳 Haptic Feedback (Vibrates for 50ms)
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50);

    const trimmed = text.trim();
    
    // If the user uploads an image without text, we MUST provide a default prompt for the AI to scan it
    const finalMessage = trimmed || (imgFile ? (lang === 'ha' ? 'Mene ne a cikin wannan hoton? Kuma wace shawara zaka bayar?' : lang === 'fr' ? 'Que contient cette image ? Veuillez fournir des conseils agricoles.' : 'What is in this image? Please provide farming advice.') : '');
    if (!finalMessage && !imgFile) return;

    const optimizedImage = imgFile ? await compressImage(imgFile) : undefined;

    let base64Data: string | undefined;
    if (optimizedImage) {
      // Convert locally to base64 so Groq can read it instantly and we have a reliable fallback
      base64Data = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(optimizedImage);
      });
    }

    const userMsg: Message = {
      id: generateId(), role: 'user', content: finalMessage, ts: new Date(),
      image_url: base64Data, // Use base64 immediately so it persists locally
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    if (inputRef.current) inputRef.current.style.height = 'auto';
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
      let uploadedUrl: string | undefined = base64Data; // Fallback to base64 if storage fails

      if (optimizedImage) {
        try {
          const path = `${userId}/${Date.now()}-${optimizedImage.name}`;
          const { error } = await supabase.storage.from('scans').upload(path, optimizedImage, { contentType: optimizedImage.type });
          if (!error) {
            const { data: { publicUrl } } = supabase.storage.from('scans').getPublicUrl(path);
            uploadedUrl = publicUrl;
          } else {
            console.warn('Storage upload error. Falling back to base64.', error);
          }
        } catch (e) {
          console.warn('Supabase storage unavailable. Relying purely on local Base64 vision.');
        }
      }

       // 1. Persist User Message IMMEDIATELY before calling API
      if (user) {
        supabase.from('chat_messages').insert({ 
          user_id: user.id, 
          role: 'user', 
          content: finalMessage, 
          image_url: uploadedUrl 
        }).then(({ error }) => {
          if (error) console.warn('Failed to save user message:', error);
        });
      }

      // 2. Pass recent conversation history for memory
      const historyPayload = messages
        .filter(m => m.id !== 'welcome-msg')
        .slice(-20).map(m => ({ role: m.role, content: m.content }));

      // 3. Call backend
      const { data, error } = await api.chat({ message: finalMessage, imageUrl: uploadedUrl, base64Image: base64Data, lang, userId: userId, history: historyPayload }, controller.signal);
      
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

      // 4. Persist AI Reply IMMEDIATELY
      if (user && !controller.signal.aborted) {
        supabase.from('chat_messages').insert({ 
          user_id: user.id, 
          role: 'assistant', 
          content: reply 
        }).then(({ error }) => {
          if (error) console.warn('Failed to save AI reply:', error);
        });
      }
    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => [...prev, {
        id: generateId(), role: 'assistant',
        content: lang === 'ha' ? 'An sami matsala. Don Allah sake gwadawa.' : lang === 'fr' ? 'Une erreur est survenue. Veuillez réessayer.' : 'An error occurred. Please try again.',
        ts: new Date(),
      }]);
    } finally {
      setIsTyping(false);
      setAgentProcessing(false);
      setAbortController(null);
    }
  }, [lang, messages, setAgentProcessing]);

  // Voice input (Real MediaRecorder Implementation - Step 1)
  const toggleVoice = async () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50);

    if (isListening) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
      setIsListening(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm';
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        // Small delay ensures final chunk is captured before constructing blob
        await new Promise(res => setTimeout(res, 100));
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        await processRealVoice(audioBlob, mimeType);
      };

      // Timeslice (250ms) ensures continuous flushing, preventing empty mobile recordings
      mediaRecorder.start(250);
      setIsListening(true);
    } catch (err) {
      console.error("Microphone error:", err);
      alert(lang === 'ha' ? "An hana izinin amfani da makurofon." : lang === 'fr' ? "Accès au microphone refusé." : "Microphone access denied.");
    }
  };

  const processRealVoice = async (audioBlob: Blob, mimeType: string) => {
    setIsTyping(true);
    setAgentProcessing(true);
    console.log("Step 1 Complete! Audio Blob ready. Size:", audioBlob.size);

    try {
      // 1. Initialize Client and convert Blob to File
      const client = await getHfClient();
      const extension = mimeType.includes('mp4') ? 'mp4' : 'webm';
      const audioFile = new File([audioBlob], `voice.${extension}`, { type: mimeType });

      // 2. Call Hugging Face API for Transcription
      const resultData = await client.predict("/transcribe", [audioFile]);
      const transcribedText = ((resultData as any).data[0] || "").trim();

      // Intercept Whisper silent-audio hallucinations
      const hallucinated = ['you', 'you.', 'you...', 'thank you', 'thank you.', 'thank you...', 'subscribe', 'subscribe.', 'thanks', 'thanks.'];
      if (!transcribedText || hallucinated.includes(transcribedText.toLowerCase())) {
        throw new Error("No speech detected");
      }

      // 3. Send transcribed text to Groq/Supabase
      await send(transcribedText);

    } catch (err) {
      console.error("Voice processing error:", err);
      setMessages(prev => [...prev, {
        id: generateId(), role: 'assistant',
        content: lang === 'ha' ? 'Gafara dai, ban ji abin da kake faɗa ba sosai. Don Allah sake gwadawa.' : lang === 'fr' ? "Désolé, je n'ai pas bien entendu. Veuillez réessayer." : 'Sorry, I could not hear that clearly. Please try again.',
        ts: new Date()
      }]);
      setIsTyping(false);
      setAgentProcessing(false);
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

  const quickSuggestions = lang === 'ha' ? QUICK_HA : lang === 'fr' ? QUICK_FR : QUICK_EN;
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
              ? (lang === 'ha' ? 'Yana Tunani...' : lang === 'fr' ? 'En réflexion...' : 'Thinking...')
              : (lang === 'ha' ? 'Yana Aiki' : lang === 'fr' ? 'En Ligne' : 'Online')}
          </p>
        </div>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={clearChat}
          className="btn-icon"
          style={{ width: 36, height: 36, background: 'transparent', border: '1px solid var(--border)' }}
          title={lang === 'ha' ? 'Sake Tattaunawa' : lang === 'fr' ? 'Effacer le chat' : 'Clear Chat'}
        >
          <Trash2 size={16} style={{ color: 'var(--slate-500)' }} />
        </motion.button>
      </header>

      {/* ── Empty state ── */}
      <div ref={listRef} onScroll={onScroll} style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
        {loadingHistory ? (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 28, height: 28, border: '3px solid var(--border)', borderTopColor: 'var(--brand-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          </div>
        ) : isEmpty ? (
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
            className="card"          >
            {/* Animated Mastercard Orbs Behind Empty State */}
            <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: 'var(--r-2xl)', pointerEvents: 'none', zIndex: 0 }}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                style={{ position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%' }}
              >
                <div style={{ position: 'absolute', top: '25%', left: '25%', width: '30%', height: '30%', background: 'var(--brand-primary)', filter: 'blur(40px)', opacity: 0.55, borderRadius: '50%' }} />
                <div style={{ position: 'absolute', bottom: '25%', right: '25%', width: '30%', height: '30%', background: 'var(--gold)', filter: 'blur(40px)', opacity: 0.55, borderRadius: '50%' }} />
              </motion.div>
            </div>

            <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
            
            {/* AI glyph */}
            <div style={{
              width: 80, height: 80, borderRadius: 24,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: 'var(--shadow-glass)',
                overflow: 'hidden', background: 'var(--surface-1)', 
                border: '1px solid var(--border-hover)'
            }}>
                <img src={theme === 'dark' ? '/images/logo-light.png' : '/images/logo-dark.png'} alt="AI" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 12 }} onError={(e) => { e.currentTarget.src='/images/logo1.png' }} />
            </div>

            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <h2 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 26, fontWeight: 800,
                letterSpacing: '-0.03em',
                color: 'var(--text-primary)',
                lineHeight: 1,
              }}>
                {lang === 'ha' ? 'Tambayi Duk Wani Abu' : lang === 'fr' ? "Demandez N'importe Quoi" : 'Ask Anything'}
              </h2>
              <p style={{
                fontFamily: 'var(--font-body)',
                fontSize: 13, color: 'var(--text-muted)',
                lineHeight: 1.6, maxWidth: 240,
              }}>
                {lang === 'ha'
                  ? 'Nemo shawara kan amfanin gona, farashin kasuwa, da yanayin sama — a Hausa, Turanci ko Faransanci'
                  : lang === 'fr' ? 'Obtenez des conseils sur les cultures, les prix et la météo — en Haoussa, Anglais ou Français'
                  : 'Get expert advice on crops, market prices, and weather — in Hausa, English, or French'}
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
            </div>
          </motion.div>
        ) : (
          <>
          {messages.map(msg => <Bubble key={msg.id} msg={msg} lang={lang} />)}

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
                    <img src={theme === 'dark' ? '/images/logo-light.png' : '/images/logo-dark.png'} alt="AI" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 2 }} onError={(e) => { e.currentTarget.src='/images/logo1.png' }} />
                </div>
                <div style={{
                  padding: '11px 16px',
                  borderRadius: '18px 18px 18px 6px',
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                }}>
                  <AIProcessingIndicator lang={lang} />
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
              placeholder={lang === 'ha' ? 'Tambayi AgroLingo AI...' : lang === 'fr' ? 'Demander à AgroLingo AI...' : 'Ask AgroLingo AI...'}
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
              onClick={(e) => { e.preventDefault(); toggleVoice(); }}
              type="button"
              className="btn-icon"
              style={{
                flexShrink: 0, zIndex: 1,
                background: isListening ? 'var(--brand-primary)' : undefined,
                borderColor: isListening ? 'var(--brand-primary)' : undefined,
                color: isListening ? 'var(--ink)' : undefined,
                boxShadow: isListening ? 'var(--shadow-green)' : undefined,
                opacity: 1,
                pointerEvents: 'auto',
                cursor: 'pointer',
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
