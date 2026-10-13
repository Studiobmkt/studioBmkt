import { createClient } from '@supabase/supabase-js';

// These are public browser settings (never a service-role key). Keeping the
// defaults here makes the invitation/password screen available even before a
// hosting provider receives its environment-variable update.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://nldpvfllhtgpodxuyabo.supabase.co';
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_8EoECBbHTk2q26d5BXLW2A_6Qr_Cm6K';

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

