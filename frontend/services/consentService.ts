import { supabase } from './supabase';
import { LEGAL_VERSION } from './legalConfig';

export type ConsentCategory = 'necessary' | 'analytics' | 'marketing' | 'preferences';

export interface CookieConsentPreferences {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}

export interface CookieConsentRecord {
  version: string;
  timestamp: string;
  source: 'banner-accept-all' | 'banner-reject' | 'preferences-save';
  preferences: CookieConsentPreferences;
}

export interface LegalAcceptancePayload {
  acceptedAt: string;
  termsVersion: string;
  privacyVersion: string;
  marketingOptIn: boolean;
}

const CONSENT_STORAGE_KEY = 'facodi_cookie_consent_v1';
const LEGAL_ACCEPTANCE_STORAGE_KEY = 'facodi_legal_acceptance_v1';

const defaultPreferences: CookieConsentPreferences = {
  necessary: true,
  analytics: false,
  marketing: false,
  preferences: false,
};

export function getDefaultConsentRecord(): CookieConsentRecord {
  return {
    version: LEGAL_VERSION.cookieConsent,
    timestamp: new Date().toISOString(),
    source: 'banner-reject',
    preferences: defaultPreferences,
  };
}

export function loadCookieConsent(): CookieConsentRecord | null {
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CookieConsentRecord;
    if (!parsed?.version || !parsed?.preferences) return null;
    return {
      ...parsed,
      preferences: {
        necessary: true,
        analytics: Boolean(parsed.preferences.analytics),
        marketing: Boolean(parsed.preferences.marketing),
        preferences: Boolean(parsed.preferences.preferences),
      },
    };
  } catch {
    return null;
  }
}

export function persistCookieConsent(record: CookieConsentRecord): void {
  localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(record));
}

export function hasConsentFor(category: ConsentCategory, consent: CookieConsentRecord | null): boolean {
  if (category === 'necessary') return true;
  if (!consent) return false;
  return Boolean(consent.preferences[category]);
}

export function loadLegalAcceptance(): LegalAcceptancePayload | null {
  try {
    const raw = localStorage.getItem(LEGAL_ACCEPTANCE_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LegalAcceptancePayload;
  } catch {
    return null;
  }
}

export function persistLegalAcceptance(payload: LegalAcceptancePayload): void {
  localStorage.setItem(LEGAL_ACCEPTANCE_STORAGE_KEY, JSON.stringify(payload));
}

export async function syncCookieConsent(userId: string | null, record: CookieConsentRecord): Promise<void> {
  if (!userId) return;

  const client = supabase as unknown as {
    from: (table: string) => {
      insert: (payload: unknown) => Promise<{ error: { message: string } | null }>;
    };
  };

  const { error } = await client.from('consent_records').insert({
    user_id: userId,
    consent_version: record.version,
    consent_type: 'cookie',
    consent_source: record.source,
    preferences: record.preferences,
    accepted_at: record.timestamp,
  });

  if (error) {
    console.warn('[consentService] consent sync failed:', error.message);
  }
}

export async function syncLegalAcceptance(userId: string | null, payload: LegalAcceptancePayload): Promise<void> {
  if (!userId) return;

  const client = supabase as unknown as {
    from: (table: string) => {
      insert: (payload: unknown) => Promise<{ error: { message: string } | null }>;
    };
  };

  const { error } = await client.from('consent_records').insert({
    user_id: userId,
    consent_version: `${payload.privacyVersion}|${payload.termsVersion}`,
    consent_type: 'legal',
    consent_source: 'signup',
    preferences: {
      marketing: payload.marketingOptIn,
      privacy_policy: payload.privacyVersion,
      terms_of_service: payload.termsVersion,
    },
    accepted_at: payload.acceptedAt,
  });

  if (error) {
    console.warn('[consentService] legal sync failed:', error.message);
  }
}
