import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig(({ mode }) => ({
  plugins: [react()],

  resolve: {
    alias: {
      '@': '/src',
      '@/api': '/src/api',
      '@/app': '/src/app',
      '@/features': '/src/features',
      '@/shared': '/src/shared',
      '@/assets': '/src/assets',
    },
  },

  build: {
    target: 'esnext',
    minify: 'esbuild',
    cssMinify: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'tanstack-vendor': ['@tanstack/react-query', '@tanstack/react-router'],
          'ui-vendor': ['@headlessui/react', '@heroicons/react'],
          'form-vendor': ['react-hook-form', '@hookform/resolvers', 'yup'],
          'utils-vendor': ['axios', 'date-fns', 'clsx', 'tailwind-merge'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },

  server: {
    port: 5173,
    host: true,
    strictPort: true,
    hmr: {
      port: 5173,
    },
  },

  preview: {
    port: 5173,
    host: '0.0.0.0',
    strictPort: true,
  },

  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@tanstack/react-query',
      '@tanstack/react-router',
      'axios',
      'zustand',
    ],
    exclude: ['@tanstack/router-devtools'],
  },

  envPrefix: 'VITE_',

  define: {
    __DEV__: JSON.stringify(mode === 'development'),
  },
}))
