import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['images/logo1.png'],
      manifest: {
        name: 'AgroLingo AI',
        short_name: 'AgroLingo',
        theme_color: '#050A07',
        background_color: '#050A07',
        display: 'standalone',
        icons: [
          {
            src: '/images/logo1.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/images/logo1.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    }),
  ],

  // ── Path aliases ──────────────────────────────────────────
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  // ── Build optimizations ───────────────────────────────────
  build: {
    // Target modern browsers (good for PWA)
    target: 'es2020',

    // Output directory
    outDir: 'dist',

    // Source maps for error tracking (disable in production if needed)
    sourcemap: false,

    // Chunk splitting strategy
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Split vendor bundle for better caching
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) return 'vendor-react';
          if (id.includes('node_modules/framer-motion/')) return 'vendor-motion';
          if (id.includes('node_modules/@supabase/supabase-js/')) return 'vendor-supabase';
          if (id.includes('node_modules/lucide-react/')) return 'vendor-lucide';
          // Group screens by usage frequency
          if (id.includes('src/screens/Dashboard') || id.includes('src/screens/AgentChat')) return 'screens-core';
          if (id.includes('src/screens/JournalScreen') || id.includes('src/screens/RecordsScreen') || id.includes('src/screens/NotificationsScreen')) return 'screens-secondary';
          if (id.includes('src/screens/AdminDashboard')) return 'screens-admin';
        },
      },
    },

    // Warn on large chunks
    chunkSizeWarningLimit: 500,

    // Asset inlining threshold (< 4kb = inline as base64)
    assetsInlineLimit: 4096,
  },

  // ── Dev server ────────────────────────────────────────────
  server: {
    port: 5173,
    host: true, // expose on network for mobile testing
  },

  // ── Preview server (simulates production) ────────────────
  preview: {
    port: 4173,
    host: true,
    proxy: {
      // Proxy API calls to Go backend in preview mode
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },

  // ── Environment variables ─────────────────────────────────
  envPrefix: 'VITE_',

  // ── CSS processing ────────────────────────────────────────
  css: {
    devSourcemap: true,
  },

  // ── Performance ───────────────────────────────────────────
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'framer-motion',
      '@supabase/supabase-js',
      'lucide-react',
      'zustand',
    ],
  },
});
