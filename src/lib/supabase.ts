import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/db';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://iarkgoekjvudcprcsqtq.supabase.co';
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlhcmtnb2VranZ1ZGNwcmNzcXRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMzNDE2NTYsImV4cCI6MjEwODkxNzY1Nn0.g4WoCLofAKCBfXxXhw_CjhuPE0DPdktCvqzSb06pPww';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

