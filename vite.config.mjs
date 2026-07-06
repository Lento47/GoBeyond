import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // bust-cache-1783358605751: true,
    // Usamos un target moderno para reducir el tamaño del polyfill
    target: 'esnext',
    // Eliminamos manualChunks manual para que Vite resuelva las dependencias circulares solo
    rollupOptions: {
      output: {
        // Esta función organiza los archivos en carpetas limpias sin forzar divisiones lógicas
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
      },
    },
    // Subimos el límite para que el motor 3D (Three.js) no dispare alertas innecesarias
    chunkSizeWarningLimit: 1200,
  },
});