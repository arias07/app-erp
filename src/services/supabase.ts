import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error(
    'EXPO_PUBLIC_SUPABASE_URL no está definida. Por favor, crea un archivo .env en la raíz del proyecto con tu URL de Supabase.'
  );
}

if (!supabaseAnonKey) {
  throw new Error(
    'EXPO_PUBLIC_SUPABASE_ANON_KEY no está definida. Por favor, crea un archivo .env en la raíz del proyecto con tu clave anónima de Supabase.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
