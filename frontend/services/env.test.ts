import { describe, expect, it } from 'vitest';
import { EnvValidationError, getSupabaseEnv } from './env';

function makeEnv(overrides: Record<string, string | boolean | undefined> = {}) {
	return {
		DEV: false,
		VITE_SUPABASE_URL: 'https://example.supabase.co',
		VITE_SUPABASE_PUBLISHABLE_KEY: 'abcdefghijklmnopqrstuvwxyz123456',
		...overrides,
	} as unknown as Parameters<typeof getSupabaseEnv>[0];
}

describe('getSupabaseEnv', () => {
	it('throws for missing VITE_SUPABASE_URL', () => {
		expect(() => getSupabaseEnv(makeEnv({ VITE_SUPABASE_URL: '' }))).toThrowError(EnvValidationError);
	});

	it('throws for invalid VITE_SUPABASE_URL', () => {
		expect(() => getSupabaseEnv(makeEnv({ VITE_SUPABASE_URL: 'notaurl' }))).toThrow(
			'expected an absolute URL',
		);
	});

	it('throws for missing VITE_SUPABASE_PUBLISHABLE_KEY', () => {
		expect(() => getSupabaseEnv(makeEnv({ VITE_SUPABASE_PUBLISHABLE_KEY: '' }))).toThrowError(
			EnvValidationError,
		);
	});

	it('throws for incomplete VITE_SUPABASE_PUBLISHABLE_KEY', () => {
		expect(() => getSupabaseEnv(makeEnv({ VITE_SUPABASE_PUBLISHABLE_KEY: 'short' }))).toThrow(
			'publishable key looks incomplete',
		);
	});

	it('parses fallback flag and returns validated values', () => {
		const env = getSupabaseEnv(makeEnv({ VITE_SUPABASE_LEGACY_INIT_FALLBACK: 'true' }));
		expect(env.url).toBe('https://example.supabase.co');
		expect(env.publishableKey).toBe('abcdefghijklmnopqrstuvwxyz123456');
		expect(env.legacyFallbackEnabled).toBe(true);
	});
});
