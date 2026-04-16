import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Mic } from 'lucide-react';

// Store & Utils
import { useAppStore } from './store/useAppStore';
import { translations } from './utils/translations';
import { Layout } from './components/Layout';

// --- 🚪 Entry & Identity ---
import { SplashScreen } from './screens/SplashScreen';
import { OnboardingScreen } from './screens/OnboardingScreen';
import { AuthScreen } from './screens/AuthScreen';
import { ForgotPassword } from './screens/ForgotPassword';

// --- 🏠 Core Experience ---
import { Dashboard } from './screens/Dashboard';
import { AgentChat } from './screens/AgentChat';
import { ProfileScreen } from './screens/ProfileScreen';
import { SettingsScreen } from './screens/SettingsScreen';

// --- 🌾 The "GreenByte" Utility ---
import { Journal } from './screens/Journal';
import { Records } from './screens/Records';
import { Notifications } from './screens/Notifications';
import { AdminDashboard } from './screens/AdminDashboard';

export default function App() {
  const { 
    screen, 
    lang, 
    setScreen, 
    initializeAuth, 
    isAgentProcessing, 
    setAgentProcessing 
  } = useAppStore();

  const t = translations[lang] || translations.en;

  // 🔐 1. Initialize Auth on Boot
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // 🤖 2. Agent Simulation
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (screen === 'dashboard' && !isAgentProcessing) {
      setAgentProcessing(true);
      timer = setTimeout(() => setAgentProcessing(false), 2500);
    }
    return () => clearTimeout(timer);
  }, [screen, setAgentProcessing]);

  const authenticatedScreens = ['dashboard', 'chat', 'profile', 'settings', 'journal', 'records', 'notifications', 'admin_dashboard'];
  const showVoiceTrigger = ['dashboard', 'profile', 'journal', 'records'].includes(screen);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center font-inter overflow-hidden">
      <div className="w-full h-screen lg:max-w-[450px] lg:h-[90vh] lg:rounded-[3rem] lg:border-[10px] lg:border-[#1B4332]/20 lg:shadow-2xl overflow-hidden relative bg-[#050a08] flex flex-col">
        
        <div className="absolute top-[-10%] left-[-20%] w-[140%] h-[40%] bg-[radial-gradient(circle_at_center,#1B433233,transparent_70%)] pointer-events-none z-0" />

        <AnimatePresence mode="wait">
          {screen === 'splash' && (
            <motion.div key="splash" exit={{ opacity: 0, y: -20 }} className="flex-1">
              <SplashScreen />
            </motion.div>
          )}

          {screen === 'onboarding' && (
            <motion.div key="onboarding" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1">
              <OnboardingScreen />
            </motion.div>
          )}

          {screen === 'auth' && (
            <motion.div key="auth" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="flex-1">
              <AuthScreen />
            </motion.div>
          )}

          {screen === 'forgot' && (
            <motion.div key="forgot" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="flex-1">
              <ForgotPassword />
            </motion.div>
          )}

          {authenticatedScreens.includes(screen) && (
            <Layout key="app-layout"> 
              <motion.main
                key={screen}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="flex-1"
              >
                {screen === 'dashboard' && <Dashboard />}
                {screen === 'chat' && <AgentChat />}
                {screen === 'profile' && <ProfileScreen />}
                {screen === 'settings' && <SettingsScreen />}
                {screen === 'journal' && <Journal />}
                {screen === 'records' && <Records />}
                {screen === 'notifications' && <Notifications />}
                {screen === 'admin_dashboard' && <AdminDashboard />}
              </motion.main>
            </Layout>
          )}
        </AnimatePresence>

        {showVoiceTrigger && (
          <motion.button
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            whileTap={{ scale: 0.9 }}
            className="fixed bottom-28 right-6 lg:absolute lg:bottom-28 lg:right-8 w-16 h-16 bg-[#FFB703] text-[#050a08] rounded-2xl shadow-2xl flex items-center justify-center z-50"
            onClick={() => setScreen('chat')}
          >
            <Mic className="w-6 h-6" />
            {isAgentProcessing && (
               <span className="absolute inset-0 rounded-2xl border-4 border-[#FFB703] animate-ping opacity-50" />
            )}
          </motion.button>
        )}
      </div>
    </div>
  );
}