// vite.config.ts (CÓDIGO CORREGIDO Y COMPLETO)

import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
// 1. IMPORTAR EL PLUGIN DE POLYFILLS
import { nodePolyfills } from 'vite-plugin-node-polyfills'; 

export default defineConfig(({ mode }) => {
  // Las variables de entorno ya están disponibles con el prefijo VITE_
  // en el código de tu aplicación (ej. import.meta.env.VITE_API_KEY)
  
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [
      react(),
      // 2. AGREGAR EL PLUGIN DE POLYFILLS
      nodePolyfills() 
    ],
    // 3. SE ELIMINA LA SECCIÓN 'DEFINE' INNECESARIA.
    
    // Configuración opcional de alias si la necesitas:
    // resolve: {
    //   alias: {
    //     '@': path.resolve(__dirname, './src'),
    //   },
    // },
  };
});
