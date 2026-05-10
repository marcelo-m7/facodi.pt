import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { EnvValidationError, getSupabaseEnv } from './env';
import type { Database } from './supabase.types';

type SupabaseGlobal = typeof globalThis & {
	__facodiSupabase?: SupabaseClient<Database>;
};

const supabaseGlobal = globalThis as SupabaseGlobal;

function createValidatedSupabaseClient(): SupabaseClient<Database> {
	const { url, publishableKey } = getSupabaseEnv();
	return createClient<Database>(url, publishableKey);
}

function createLegacyFallbackClient(): SupabaseClient<Database> {
	const url = import.meta.env.VITE_SUPABASE_URL as string;
	const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
	return createClient<Database>(url, key);
}

function initializeSupabaseClient(): SupabaseClient<Database> {
	try {
		return createValidatedSupabaseClient();
	} catch (error) {
		if (error instanceof EnvValidationError) {
			const { legacyFallbackEnabled } = getSupabaseEnvForFallbackFlag();
			if (legacyFallbackEnabled) {
				console.warn(
					'[supabase:init] Environment validation failed; using legacy fallback client because VITE_SUPABASE_LEGACY_INIT_FALLBACK=true.',
				);
				return createLegacyFallbackClient();
			}
		}
		throw error;
	}
}

function getSupabaseEnvForFallbackFlag() {
	try {
		return getSupabaseEnv();
	} catch {
		return {
			legacyFallbackEnabled:
				typeof import.meta.env.VITE_SUPABASE_LEGACY_INIT_FALLBACK === 'string' &&
				import.meta.env.VITE_SUPABASE_LEGACY_INIT_FALLBACK.toLowerCase() === 'true',
		};
	}
}

const supabaseClient = supabaseGlobal.__facodiSupabase ?? initializeSupabaseClient();

if (import.meta.env.DEV) {
	supabaseGlobal.__facodiSupabase = supabaseClient;
}

export const supabase = supabaseClient;
