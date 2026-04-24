import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import './styles/globals.css';

// ── Register Service Worker ───────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then(reg => {
        console.log('[SW] Registered:', reg.scope);

        // Check for updates every 60 minutes
        setInterval(() => reg.update(), 60 * 60 * 1000);

        // Notify user of update available
        reg.onupdatefound = () => {
          const worker = reg.installing;
          if (!worker) return;
          worker.onstatechange = () => {
            if (worker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available — reload to get it
              console.log('[SW] New version available. Reloading...');
              window.location.reload();
            }
          };
        };
      })
      .catch(err => console.warn('[SW] Registration failed:', err));
  });
}

// ── Handle PWA install prompt ─────────────────────────────
// Store prompt for use in a custom install button if desired
let deferredInstallPrompt: BeforeInstallPromptEvent | null = null;

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = e as BeforeInstallPromptEvent;
  console.log('[PWA] Install prompt ready');
  // Dispatch custom event so any component can trigger install
  window.dispatchEvent(new CustomEvent('pwa-installable'));
});

window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null;
  console.log('[PWA] App installed successfully');
});

// Export for use in components (e.g., settings screen)
export const triggerInstall = async () => {
  if (!deferredInstallPrompt) return false;
  await deferredInstallPrompt.prompt();
  const { outcome } = await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  return outcome === 'accepted';
};

// ── Network status monitoring ─────────────────────────────
window.addEventListener('online',  () => console.log('[Network] Online'));
window.addEventListener('offline', () => console.log('[Network] Offline'));

// ── Mount app ─────────────────────────────────────────────
const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
