import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import './styles/globals.css';

import { useAppStore } from './store/useAppStore';
import { SplashScreen }         from './screens/SplashScreen';
import { OnboardingScreen }      from './screens/OnboardingScreen';
import { AuthScreen }            from './screens/AuthScreen';
import { Dashboard }             from './screens/Dashboard';
import { AgentChat }             from './screens/AgentChat';
import { ProfileScreen }         from './screens/ProfileScreen';
import { SettingsScreen }        from './screens/SettingsScreen';
import { JournalScreen }         from './screens/JournalScreen';
import { RecordsScreen }         from './screens/RecordsScreen';
import { CompleteProfileScreen } from './screens/CompleteProfileScreen';
import { NotificationsScreen }   from './screens/NotificationsScreen';
import { MarketScreen }          from './screens/MarketScreen';
import { WeatherScreen }         from './screens/WeatherScreen';
import { Layout } from './components/Layout';

const SHELL_SCREENS = new Set([
  'dashboard','profile','settings',
  'journal','records','notifications','market'
]);

export default function App() {
  const { screen, initializeAuth } = useAppStore();

  useEffect(() => { initializeAuth(); }, [initializeAuth]);

  useEffect(() => {
    const handleInstallPrompt = (e: Event) => {
      e.preventDefault();
      useAppStore.getState().setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
  }, []);

  const inShell = SHELL_SCREENS.has(screen);

  const renderScreen = () => {
    switch (screen) {
      case 'splash':          return <SplashScreen />;
      case 'onboarding':      return <OnboardingScreen />;
      case 'auth':            return <AuthScreen />;
      case 'complete_profile':return <CompleteProfileScreen />;
      case 'dashboard':       return <Dashboard />;
      case 'chat':            return <AgentChat />;
      case 'profile':         return <ProfileScreen />;
      case 'settings':        return <SettingsScreen />;
      case 'journal':         return <JournalScreen />;
      case 'records':         return <RecordsScreen />;
      case 'notifications':   return <NotificationsScreen />;
      // The prototype admin screen is intentionally not routed in production.
      // Restore it only after server-side authorization and auditable admin APIs exist.
      case 'admin_dashboard': return <Dashboard />;
      case 'market':          return <MarketScreen />;
      case 'weather':         return <WeatherScreen />;
      default:                return <Dashboard />;
    }
  };

  return (
    <div className="app-viewport">
      <AnimatePresence mode="wait">
        {inShell ? (
          <Layout key="shell">
            {renderScreen()}
          </Layout>
        ) : (
          <motion.div key={screen}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ width: '100%', height: '100%', overflowY: 'auto', overflowX: 'hidden' }}
          >
            {renderScreen()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
