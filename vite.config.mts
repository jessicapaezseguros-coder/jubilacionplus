// vite.config.mts

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // ¡ESTE ES EL FIX! Define la base del path de los assets como la raíz del dominio.
  base: '/', 
  plugins: [react()],
  resolve: {
    alias: {
      // Mantenemos el alias para @/src
      '@/': '/src/', 
    },
  },
});