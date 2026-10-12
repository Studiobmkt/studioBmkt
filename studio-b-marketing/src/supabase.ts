import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

/**
 * Browser client for the Studio B site's dedicated Supabase project.
 *
 * It intentionally uses only the publishable key. Privileged keys must remain
 * server-side and are never bundled by Vite.
 */
export const supabase = supabaseUrl && supabasePublishableKey
  ? createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export function requireSupabase() {
  if (!supabase) {
    throw new Error('O armazenamento de imagens ainda não foi configurado. Verifique as variáveis do Supabase no ambiente de publicação.');
  }
  return supabase;
}
