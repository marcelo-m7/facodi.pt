import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './supabase.types';

const url = import.meta.env.VITE_SUPABASE_URL as string;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

type SupabaseGlobal = typeof globalThis & {
	__facodiSupabase?: SupabaseClient<Database>;
};

const supabaseGlobal = globalThis as SupabaseGlobal;

const supabaseClient = supabaseGlobal.__facodiSupabase ?? createClient<Database>(url, key);

if (import.meta.env.DEV) {
	supabaseGlobal.__facodiSupabase = supabaseClient;
}

export const supabase = supabaseClient;
