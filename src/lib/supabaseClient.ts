/**
 * Cliente Supabase que usa as variáveis de ambiente corretas.
 * Este cliente deve ser usado em vez do auto-gerado quando precisamos
 * garantir que estamos conectando ao backend correto do Lovable Cloud.
 */
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
}

export const supabaseClient = createClient<Database>(
  supabaseUrl || '',
  supabaseKey || '',
  {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    }
  }
);

// Export also as 'supabase' for backward compatibility
export const supabase = supabaseClient;
