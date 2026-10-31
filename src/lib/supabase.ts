import { createClient } from '@supabase/supabase-js';
// Generated table types live in src/types/db.ts (supabase gen types). Typing this client
// with them needs api.ts casts updated first, so it stays untyped for now.

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

// Read what an email link brought back BEFORE the client tidies the URL.
// A confirm-signup link lands with #access_token=…&type=signup; a stale or
// used link lands with #error_code=otp_expired&error_description=….
export interface AuthLinkResult {
  kind: 'confirmed' | 'link_error';
  message?: string;
}
export const authLinkResult: AuthLinkResult | null = (() => {
  if (typeof window === 'undefined') return null;
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const query = new URLSearchParams(window.location.search);
  const code = hash.get('error_code') || query.get('error_code');
  if (code || hash.get('error') || query.get('error')) {
    return {
      kind: 'link_error',
      message: code === 'otp_expired'
        ? 'That confirmation link has expired or was already used.'
        : (hash.get('error_description') || query.get('error_description') || 'That link did not work.').replace(/\+/g, ' '),
    };
  }
  if (hash.get('type') === 'signup' && hash.get('access_token')) return { kind: 'confirmed' };
  return null;
})();

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

