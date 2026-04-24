import { create } from 'zustand';
import { supabase } from '../lib/supabase';

// ── Screen Registry ────────────────────────────────────────────
export type Screen =
  | 'splash'
  | 'onboarding'
  | 'auth'
  | 'dashboard'
  | 'chat'
  | 'profile'
  | 'settings'
  | 'journal'
  | 'records'
  | 'notifications'
  | 'market'
  | 'weather'
  | 'admin_dashboard';

export type Lang = 'ha' | 'en' | 'fr';
export type Theme = 'dark' | 'light';

// ── User ──────────────────────────────────────────────────────
interface AppUser {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  role?: 'admin' | 'farmer';
}

// ── Auth return shape ─────────────────────────────────────────
interface AuthResult {
  error: { message: string } | null;
}

// ── State ─────────────────────────────────────────────────────
interface AppState {
  screen: Screen;
  lang: Lang;
  theme: Theme;
  isAgentProcessing: boolean;
  user: AppUser | null;
  isAuthLoading: boolean;

  // Navigation
  setScreen: (screen: Screen) => void;
  setLang: (lang: Lang) => void;
  setTheme: (theme: Theme) => void;

  // Agent status — both names supported (Phase 1 compat + Phase 2 compat)
  setAgentProcessing:    (v: boolean) => void;
  setIsAgentProcessing:  (v: boolean) => void;

  // Auth actions — all return { error } so callers don't need try/catch
  signIn:           (email: string, password: string) => Promise<AuthResult>;
  signUp:           (email: string, password: string, name?: string) => Promise<AuthResult>;
  signInWithGithub: () => Promise<AuthResult>;
  signOut:          () => Promise<void>;
  resetPassword:    (email: string) => Promise<AuthResult>;
  initializeAuth:   () => Promise<void>;

  deferredPrompt: any;
  setDeferredPrompt: (p: any) => void;

  // Helpers
  isAdmin: () => boolean;
}

// ── Session parser ────────────────────────────────────────────
function userFromSession(session: {
  user: {
    id: string;
    email?: string;
    app_metadata?: Record<string, unknown>;
    user_metadata?: Record<string, unknown>;
  };
}): AppUser {
  const u = session.user;
  return {
    id:        u.id,
    email:     u.email ?? '',
    full_name: u.user_metadata?.full_name as string | undefined,
    avatar_url:u.user_metadata?.avatar_url as string | undefined,
    role:      u.app_metadata?.role as 'admin' | 'farmer' | undefined,
  };
}

// ── Guard: only init listener once ───────────────────────────
let listenerBooted = false;

// ── Store ─────────────────────────────────────────────────────
export const useAppStore = create<AppState>((set, get) => ({
  screen:            'splash',
  lang:              'ha',
  theme:             'dark',
  isAgentProcessing: false,
  user:              null,
  isAuthLoading:     true,
  deferredPrompt:    null,

  setScreen: (screen) => set({ screen }),
  setLang:   (lang)   => set({ lang }),
  setTheme:  (theme)  => set({ theme }),
  setDeferredPrompt: (p) => set({ deferredPrompt: p }),

  // Both names point to same setter — Phase 1 & 2 compatible
  setAgentProcessing:   (v) => set({ isAgentProcessing: v }),
  setIsAgentProcessing: (v) => set({ isAgentProcessing: v }),

  // ── SIGN IN ──────────────────────────────────────────────
  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: { message: friendlyError(error.message) } };
    if (data.session) {
      set({ user: userFromSession(data.session), screen: 'dashboard', isAuthLoading: false });
    }
    return { error: null };
  },

  // ── SIGN UP ──────────────────────────────────────────────
  signUp: async (email, password, name) => {
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: name ?? '' } },
    });
    if (error) return { error: { message: friendlyError(error.message) } };
    if (data.user) {
      // Best-effort profile row
      await supabase.from('profiles').upsert({
        id: data.user.id, email, full_name: name ?? '',
      }).catch(() => {});
      set({ user: userFromSession({ user: data.user }), screen: 'dashboard', isAuthLoading: false });
    }
    return { error: null };
  },

  // ── GITHUB OAUTH ─────────────────────────────────────────
  signInWithGithub: async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: window.location.origin },
    });
    if (error) return { error: { message: error.message } };
    return { error: null };
  },

  // ── SIGN OUT ─────────────────────────────────────────────
  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, screen: 'auth', isAuthLoading: false });
  },

  // ── RESET PASSWORD ────────────────────────────────────────
  resetPassword: async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) return { error: { message: error.message } };
    return { error: null };
  },

  // ── INITIALIZE (called once in App.tsx) ───────────────────
  initializeAuth: async () => {
    set({ isAuthLoading: true });
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      set({ user: userFromSession(session), screen: 'dashboard', isAuthLoading: false });
    } else {
      set({ isAuthLoading: false });
    }

    if (!listenerBooted) {
      supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          set({ user: userFromSession(session), isAuthLoading: false });
        } else {
          set({ user: null, screen: 'auth', isAuthLoading: false });
        }
      });
      listenerBooted = true;
    }
  },

  // ── ADMIN CHECK ───────────────────────────────────────────
  isAdmin: () => get().user?.role === 'admin',
}));

// ── Error message humanizer ───────────────────────────────────
function friendlyError(raw: string): string {
  const r = raw.toLowerCase();
  if (r.includes('invalid login'))     return 'Incorrect email or password.';
  if (r.includes('email not confirmed')) return 'Please verify your email first.';
  if (r.includes('user already'))      return 'An account with this email already exists.';
  if (r.includes('password'))          return 'Password must be at least 6 characters.';
  if (r.includes('network'))           return 'No internet connection. Please try again.';
  return raw;
}
