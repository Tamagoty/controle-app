// src/lib/supabaseClient.js

import { createClient } from '@supabase/supabase-js';

// Lê as variáveis de ambiente fornecidas pelo Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);