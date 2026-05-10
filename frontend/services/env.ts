const SUPABASE_URL_KEY = 'VITE_SUPABASE_URL';
const SUPABASE_PUBLISHABLE_KEY = 'VITE_SUPABASE_PUBLISHABLE_KEY';
const LEGACY_SUPABASE_FALLBACK_KEY = 'VITE_SUPABASE_LEGACY_INIT_FALLBACK';

export class EnvValidationError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'EnvValidationError';
	}
}

export type RuntimeEnv = Pick<ImportMetaEnv, 'DEV'> & Partial<Record<string, string | undefined>>;

export type SupabaseEnv = {
	url: string;
	publishableKey: string;
	legacyFallbackEnabled: boolean;
};

function getEnvString(env: RuntimeEnv, key: string): string {
	const value = env[key];
	return typeof value === 'string' ? value.trim() : '';
}

function parseBooleanFlag(value: string): boolean {
	return value.toLowerCase() === 'true';
}

function validateSupabaseUrl(value: string): void {
	let parsed: URL;
	try {
		parsed = new URL(value);
	} catch {
		throw new EnvValidationError(
			`Invalid ${SUPABASE_URL_KEY}: expected an absolute URL (e.g. https://project.supabase.co).`,
		);
	}

	if (!['http:', 'https:'].includes(parsed.protocol)) {
		throw new EnvValidationError(`Invalid ${SUPABASE_URL_KEY}: URL must use http or https.`);
	}
}

function validateSupabasePublishableKey(value: string): void {
	if (value.length < 20) {
		throw new EnvValidationError(
			`Invalid ${SUPABASE_PUBLISHABLE_KEY}: publishable key looks incomplete. Confirm your Supabase anon/publishable key is set in .env.local.`,
		);
	}
}

export function getSupabaseEnv(env: RuntimeEnv = import.meta.env): SupabaseEnv {
	const url = getEnvString(env, SUPABASE_URL_KEY);
	const publishableKey = getEnvString(env, SUPABASE_PUBLISHABLE_KEY);
	const legacyFallbackEnabled = parseBooleanFlag(getEnvString(env, LEGACY_SUPABASE_FALLBACK_KEY));

	if (!url) {
		throw new EnvValidationError(
			`Missing ${SUPABASE_URL_KEY}: set it in frontend/.env.local before starting Vite.`,
		);
	}

	if (!publishableKey) {
		throw new EnvValidationError(
			`Missing ${SUPABASE_PUBLISHABLE_KEY}: set your public Supabase publishable key in frontend/.env.local.`,
		);
	}

	validateSupabaseUrl(url);
	validateSupabasePublishableKey(publishableKey);

	return { url, publishableKey, legacyFallbackEnabled };
}

export const supabaseEnvKeys = {
	SUPABASE_URL_KEY,
	SUPABASE_PUBLISHABLE_KEY,
	LEGACY_SUPABASE_FALLBACK_KEY,
};
