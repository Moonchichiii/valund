import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const isDev = mode === 'development'
  const isProd = mode === 'production'

  return {
    plugins: [
      react(),
      tailwindcss(),
    ],

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

    // Optimized esbuild settings
    esbuild: {
      target: 'es2022',
      ...(isProd && {
        drop: ['console', 'debugger'],
        legalComments: 'none',
        minifyIdentifiers: true,
        minifySyntax: true,
        minifyWhitespace: true,
      }),
    },

    css: {
      devSourcemap: isDev,
    },

    build: {
      target: 'es2022',
      minify: 'esbuild',
      cssMinify: 'lightningcss',
      sourcemap: isDev,
      modulePreload: { polyfill: false },
      reportCompressedSize: false,
      assetsInlineLimit: 2048,
      cssCodeSplit: true,
      treeshake: true,
      rollupOptions: {
        output: {
          // Smart vendor chunking for Vite 7.x
          manualChunks: {
            // Core React libraries
            'react-core': ['react', 'react-dom'],
            // TanStack ecosystem
            'tanstack': ['@tanstack/react-query', '@tanstack/react-router'],
            // UI libraries
            'ui-libs': ['@headlessui/react', '@heroicons/react', 'lucide-react'],
            // Form handling
            'forms': ['react-hook-form', '@hookform/resolvers', 'yup'],
            // Utilities
            'utils': ['axios', 'date-fns', 'clsx', 'tailwind-merge', 'zustand'],
          },
          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name?.split('.') ?? [];
            const ext = info[info.length - 1];
            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
              return `assets/images/[name]-[hash][extname]`;
            }
            if (/woff2?|eot|ttf|otf/i.test(ext)) {
              return `assets/fonts/[name]-[hash][extname]`;
            }
            return `assets/[name]-[hash][extname]`;
          },
        },
      },
      chunkSizeWarningLimit: 800,
    },

    server: {
      host: true,
      port: 5173,
      strictPort: true,
      open: false,
      cors: true,
      hmr: {
        protocol: 'ws',
        clientPort: 5173,
        overlay: true,
      },
      watch: {
        usePolling: false,
        ignored: ['**/node_modules/**', '**/.git/**'],
      },
    },

    preview: {
      host: '0.0.0.0',
      port: 5173,
      strictPort: true,
      cors: true,
    },

    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        '@tanstack/react-query',
        '@tanstack/react-router',
        'axios',
        'zustand',
        'clsx',
        'tailwind-merge',
        'lucide-react',
        'react-hot-toast',
      ],
      exclude: [
        '@tanstack/router-devtools',
        '@tanstack/react-query-devtools',
      ],
      esbuildOptions: {
        target: 'es2022',
      },
    },

    envPrefix: 'VITE_',

    define: {
      __DEV__: JSON.stringify(isDev),
      __PROD__: JSON.stringify(isProd),
      'process.env.NODE_ENV': JSON.stringify(mode),
      // Valunds-specific environment variables
      __APP_NAME__: JSON.stringify('Valunds'),
      __APP_VERSION__: JSON.stringify(env.npm_package_version || '1.0.0'),
    },
  }
})
