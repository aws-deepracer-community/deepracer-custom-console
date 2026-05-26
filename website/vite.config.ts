import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const car_ip = process.env.CAR_IP || "https://192.168.0.82/";
const isE2ETest = process.env.E2E_TEST === "true";

if (process.env.NODE_ENV === "development") {
  console.log("Development mode. Connecting to car on IP ", car_ip);
} else if (process.env.NODE_ENV === "test" && isE2ETest) {
  console.log("E2E test mode. Disabling proxy to avoid connection errors.");
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    // Disable proxy during E2E tests to avoid connection errors
    proxy: isE2ETest
      ? undefined
      : {
          "/login": {
            target: car_ip,
            changeOrigin: true,
            secure: false,
          },
          "/redirect_login": {
            target: car_ip,
            changeOrigin: true,
            secure: false,
          },
          "/api": {
            target: car_ip,
            changeOrigin: true,
            secure: false,
          },
          "/route?topic": {
            target: car_ip,
            changeOrigin: true,
            secure: false,
          },
          "/auth": {
            target: car_ip,
            changeOrigin: true,
            secure: false,
          },
        },
  },
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        login: "login.html",
      },
      output: {
        entryFileNames: "static/[name].js",
        chunkFileNames: "static/[name].js",
        assetFileNames: "static/[name].[ext]",
      },
    },
  },
});
