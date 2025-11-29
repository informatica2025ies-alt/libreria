// vite.config.ts (Código Corregido)

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills'; // <-- NUEVA IMPORTACIÓN

export default defineConfig(({ mode }) => {
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [
      react(),
      nodePolyfills() // <-- NUEVA LÍNEA EN PLUGINS
    ],
    // NOTA: Se eliminaron las secciones 'define' y 'resolve' 
    // innecesarias para simplificar y usar solo el formato VITE_
  };
});
