import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/login': {
        target: 'https://192.168.0.82/',
        changeOrigin: true,
        secure: false,
      },
      '/logout': {
        target: 'https://192.168.0.82/',
        changeOrigin: true,
        secure: false,
      },
      '/api': {
        target: 'https://192.168.0.82/',
        changeOrigin: true,
        secure: false,
      },
      '/route?topic': {
        target: 'https://192.168.0.82/',
        changeOrigin: true,
        secure: false,
      }
    },
  },
  build: {
    rollupOptions: {
      input: 'index.html',
      output: {
        entryFileNames: 'static/[name].js',
        chunkFileNames: 'static/[name].js',
        assetFileNames: 'static/[name].[ext]',
      },
    },
  },
});