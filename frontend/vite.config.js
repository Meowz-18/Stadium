import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

/**
 * Vite configuration for Stadium AI frontend.
 * Optimized for production performance with manual chunk splitting,
 * CSS code splitting, and aggressive minification.
 * @see https://vite.dev/config/
 */
export default defineConfig({
  plugins: [react(), tailwindcss()],

  // Production build optimizations
  build: {
    target: 'es2020',
    sourcemap: false,
    cssCodeSplit: true,
    minify: 'esbuild',
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        /**
         * Manual chunk strategy separates vendor libraries for optimal
         * long-term caching. Each chunk is loaded only when its route
         * is first visited, reducing initial bundle size.
         */
        manualChunks: (id) => {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/react-router')) {
            return 'vendor-router';
          }
          if (id.includes('node_modules/framer-motion')) {
            return 'vendor-framer';
          }
          if (id.includes('node_modules/firebase') || id.includes('node_modules/@firebase')) {
            return 'vendor-firebase';
          }
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3')) {
            return 'vendor-charts';
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-icons';
          }
          if (id.includes('node_modules')) {
            return 'vendor-misc';
          }
        },
      },
    },
  },

  // Dev server configuration
  server: {
    port: 5173,
    strictPort: true,
  },

  // Test configuration (Vitest)
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.js',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{js,jsx}'],
      exclude: ['src/main.jsx', 'src/firebase.js', 'src/constants/**'],
    },
  },
});
