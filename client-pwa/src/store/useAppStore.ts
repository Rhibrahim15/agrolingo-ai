import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export type Screen =
  | 'splash'
  | 'onboarding'
  | 'auth'
  | 'forgot'
  | 'complete_profile'
  | 'dashboard'
  | 'chat'
  | 'profile'
  | 'settings'
  | 'records'
  | 'journal'
  | 'notifications'
  | 'admin_dashboard'
  | 'market'
  | 'weather';

export type Lang = 'ha' | 'en' | 'fr';

export type Theme = 'light' | 'dark';

interface AppUser {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  // Role comes from Supabase JWT app_metadata
  role?: 'admin' | 'farmer';
}

interface AppState {
  screen: Screen;
  lang: Lang;
  theme: Theme;
  isAgentProcessing: boolean;
  user: AppUser | null;
  isAuthLoading: boolean;
  deferredPrompt: any | null;

  // Actions
  setScreen: (screen: Screen) => void;
  setLang: (lang: Lang) => void;
  setTheme: (theme: Theme) => void;
  setAgentProcessing: (status: boolean) => void;
  setDeferredPrompt: (prompt: any | null) => void;

  // Auth
  signUp: (email: string, password: string, name: string, location: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGithub: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  initializeAuth: () => Promise<void>;

  // Computed helpers
  isAdmin: () => boolean;
}

let authListenerInitialized = false;

const savedTheme = (localStorage.getItem('agrolingo_theme') as Theme) || 'dark';
if (savedTheme === 'dark') document.documentElement.classList.add('dark');

/**
 * Check if profile is complete to determine the next screen
 */
async function getNextScreenForUser(userId: string): Promise<Screen> {
  try {
    const { data } = await supabase
      .from('profiles')
      .select('location, full_name')
      .eq('id', userId)
      .maybeSingle();

    if (!data?.location || !data?.full_name) return 'complete_profile';
    return 'dashboard';
  } catch {
    return 'dashboard'; // Fallback to dashboard on error
  }
}

/**
 * Extract user profile from Supabase session
 */
function buildUserFromSession(session: any): AppUser {
  const { user } = session;
  return {
    id: user.id,
    email: user.email ?? '',
    full_name: user.user_metadata?.full_name,
    avatar_url: user.user_metadata?.avatar_url,
    role: user.app_metadata?.role as 'admin' | 'farmer' | undefined,
  };
}

export const useAppStore = create<AppState>((set, get) => ({
  screen: 'splash',
  lang: 'ha',
  theme: savedTheme,
  isAgentProcessing: false,
  user: null,
  isAuthLoading: true,
  deferredPrompt: null,

  setScreen: (screen) => set({ screen }),
  setLang: (lang) => set({ lang }),
  setTheme: (theme) => {
    localStorage.setItem('agrolingo_theme', theme);
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    set({ theme });
  },
  setAgentProcessing: (status) => set({ isAgentProcessing: status }),
  setDeferredPrompt: (prompt) => set({ deferredPrompt: prompt }),

  // ── REAL AUTH ─────────────────────────────────────────────

  signUp: async (email, password, name, location) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          location: location,
        },
      },
    });

    if (error) throw new Error(error.message);

    if (data.user) {
      // Create profile row in profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: data.user.id,
          full_name: name,
          location: location,
          email,
        });

      if (profileError) {
        console.warn('[Auth] Profile creation warning:', profileError.message);
      }

      const nextScreen = await getNextScreenForUser(data.user.id);
      set({
        user: buildUserFromSession({ user: data.user }),
        screen: nextScreen,
        isAuthLoading: false,
      });
    }
  },

  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw new Error(error.message);

    if (data.user && data.session) {
      const nextScreen = await getNextScreenForUser(data.user.id);
      set({
        user: buildUserFromSession(data.session),
        screen: nextScreen,
        isAuthLoading: false,
      });
    }
  },

  signInWithGithub: async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) throw new Error(error.message);
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, screen: 'auth', isAuthLoading: false });
  },

  resetPassword: async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw new Error(error.message);
  },

  initializeAuth: async () => {
    set({ isAuthLoading: true });

    // Check for existing session on app load
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.user) {
      const nextScreen = await getNextScreenForUser(session.user.id);
      set({
        user: buildUserFromSession(session),
        screen: nextScreen,
        isAuthLoading: false,
      });
    } else {
      set({ isAuthLoading: false });
    }

    // Listen for auth changes (login, logout, token refresh)
    if (!authListenerInitialized) {
      supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          set({
            user: buildUserFromSession(session),
            isAuthLoading: false,
          });
        } else {
          const currentScreen = get().screen;
          if (currentScreen !== 'splash' && currentScreen !== 'onboarding') {
            set({ user: null, screen: 'auth', isAuthLoading: false });
          } else {
            set({ user: null, isAuthLoading: false });
          }
        }
      });
      authListenerInitialized = true;
    }
  },

  // ── COMPUTED ──────────────────────────────────────────────

  isAdmin: () => {
    return get().user?.role === 'admin';
  },
}));
