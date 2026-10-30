import { createClient } from '@supabase/supabase-js';
// Generated table types live in src/types/db.ts (supabase gen types). Typing this client
// with them needs api.ts casts updated first, so it stays untyped for now.

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

