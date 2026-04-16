import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export type Screen = 
  | 'splash' 
  | 'onboarding' 
  | 'auth' 
  | 'forgot' 
  | 'dashboard' 
  | 'chat' 
  | 'profile' 
  | 'settings' 
  | 'records' 
  | 'journal'
  | 'notifications'
  | 'admin_dashboard';

interface AppState {
  screen: Screen;
  lang: 'ha' | 'en' | 'fr';
  isAgentProcessing: boolean;
  user: any | null;
  setScreen: (screen: Screen) => void;
  setLang: (lang: 'ha' | 'en' | 'fr') => void;
  setAgentProcessing: (status: boolean) => void;
  signUp: (email: string, pass: string, name: string) => Promise<void>;
  signIn: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  initializeAuth: () => Promise<void>;
}

let authListenerInitialized = false;

export const useAppStore = create<AppState>((set) => ({
  screen: 'splash',
  lang: 'ha',
  isAgentProcessing: false,
  user: null,

  setScreen: (screen) => set({ screen }),
  setLang: (lang) => set({ lang }),
  setAgentProcessing: (status) => set({ isAgentProcessing: status }),

  signUp: async (email, password, name) => {
    const { data, error } = await supabase.auth.signUp({
      email, password, options: { data: { full_name: name } }
    });
    if (error) throw error;
    if (data.user) set({ user: data.user, screen: 'dashboard' });
  },

  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (data.user) set({ user: data.user, screen: 'dashboard' });
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, screen: 'auth' });
  },

  initializeAuth: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      set({ user: session.user, screen: 'dashboard' });
    }

    if (!authListenerInitialized) {
      supabase.auth.onAuthStateChange((_event, session) => {
        if (session) set({ user: session.user });
        else set({ user: null, screen: 'auth' });
      });
      authListenerInitialized = true;
    }
  }
}));