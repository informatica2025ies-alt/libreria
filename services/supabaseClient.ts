import { createClient } from '@supabase/supabase-js';

// Estas variables ahora deben ser configuradas en Vercel
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Se recomienda una verificación para evitar un fallo en tiempo de ejecución
if (!supabaseUrl || !supabaseKey) {
  // Nota: Esta línea causará que el programa se detenga si faltan las variables.
  // Si la aplicación se detiene aquí, verás el error en la consola del navegador.
  throw new Error('Supabase URL o Key está faltando de las Variables de Entorno.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
