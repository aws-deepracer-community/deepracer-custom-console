import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const car_ip = process.env.CAR_IP || 'https://192.168.0.82/';
console.log('Connecting to car:', car_ip);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/login': {
        target: car_ip,
        changeOrigin: true,
        secure: false,
      },
      '/redirect_login': {
       target: car_ip,
        changeOrigin: true,
       secure: false,
      },
      '/api': {
        target: car_ip,
        changeOrigin: true,
        secure: false,
      },
      '/route?topic': {
        target: car_ip,
        changeOrigin: true,
        secure: false,
      },
      '/auth': {
        target: car_ip,
        changeOrigin: true,
        secure: false,
      }
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        login: 'login.html'
      },
      output: {
        entryFileNames: 'static/[name].js',
        chunkFileNames: 'static/[name].js',
        assetFileNames: 'static/[name].[ext]',
      },
    },
  },
});