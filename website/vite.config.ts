import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const car_ip = process.env.CAR_IP || 'https://192.168.0.82/';
const isE2ETest = process.env.PLAYWRIGHT_TEST === 'true' || process.env.E2E_TEST === 'true';

console.log('Connecting to car:', car_ip);
if (isE2ETest) {
  console.log('E2E test mode: API proxy disabled');
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    // Disable proxy during E2E tests to avoid connection errors
    proxy: isE2ETest ? undefined : {
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