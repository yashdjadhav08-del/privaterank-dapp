/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import wasm from 'vite-plugin-wasm';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: __dirname,
  plugins: [wasm(), react()],
  resolve: {
    dedupe: [
      'react',
      'react-dom',
      'react-dom/client',
      'react/jsx-runtime',
      'react/jsx-dev-runtime'
    ],
    alias: {
      '@contracts': path.resolve(__dirname, './contracts'),
      buffer: path.resolve(__dirname, './node_modules/buffer'),
      'object-inspect': path.resolve(__dirname, './src/shims/object-inspect.ts')
    }

  },
  define: {
    global: 'globalThis',
    'process.env': {}
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-dom/client',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
      'lucide-react',
      'clsx'
    ],
    exclude: [
      '@midnight-ntwrk/midnight-js-contracts',
      '@midnight-ntwrk/midnight-js-utils',
      '@midnight-ntwrk/onchain-runtime-v3',
      '@midnight-ntwrk/compact-runtime',
      '@midnight-ntwrk/compact-js',
      '@midnight-ntwrk/dapp-connector-api'
    ]
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      external: [
        '@midnight-ntwrk/midnight-js-contracts',
        '@midnight-ntwrk/midnight-js-utils',
        '@midnight-ntwrk/onchain-runtime-v3',
        '@midnight-ntwrk/compact-runtime',
        '@midnight-ntwrk/compact-js',
        '@midnight-ntwrk/dapp-connector-api'
      ],
      output: {
        manualChunks(id) {
          if (id.includes('@midnight-ntwrk')) {
            return 'midnight-sdk';
          }
        }
      }
    }
  },
  server: {
    port: 3001,
    strictPort: true,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
    },
    open: false,
    fs: {
      strict: false
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts']
  }
});
