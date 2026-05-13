import { useCallback, useMemo, useState } from 'react';
import {
  CookieConsentRecord,
  CookieConsentPreferences,
  getDefaultConsentRecord,
  hasConsentFor,
  loadCookieConsent,
  persistCookieConsent,
} from '../services/consentService';
import { LEGAL_VERSION } from '../services/legalConfig';

export const useCookieConsent = () => {
  const [consent, setConsent] = useState<CookieConsentRecord | null>(() => loadCookieConsent());
  const [isBannerVisible, setIsBannerVisible] = useState(() => !loadCookieConsent());
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);

  const effectiveConsent = useMemo(() => consent ?? getDefaultConsentRecord(), [consent]);

  const saveConsent = useCallback((preferences: CookieConsentPreferences, source: CookieConsentRecord['source']) => {
    const next: CookieConsentRecord = {
      version: LEGAL_VERSION.cookieConsent,
      timestamp: new Date().toISOString(),
      source,
      preferences: {
        necessary: true,
        analytics: preferences.analytics,
        marketing: preferences.marketing,
        preferences: preferences.preferences,
      },
    };

    persistCookieConsent(next);
    setConsent(next);
    setIsBannerVisible(false);
    setIsPreferencesOpen(false);

    return next;
  }, []);

  const acceptAll = useCallback(() => saveConsent({ necessary: true, analytics: true, marketing: true, preferences: true }, 'banner-accept-all'), [saveConsent]);

  const rejectNonEssential = useCallback(() => saveConsent({ necessary: true, analytics: false, marketing: false, preferences: false }, 'banner-reject'), [saveConsent]);

  const canUseCategory = useCallback((category: 'necessary' | 'analytics' | 'marketing' | 'preferences') => {
    return hasConsentFor(category, consent);
  }, [consent]);

  return {
    consent,
    effectiveConsent,
    isBannerVisible,
    isPreferencesOpen,
    setIsPreferencesOpen,
    setIsBannerVisible,
    acceptAll,
    rejectNonEssential,
    saveConsent,
    canUseCategory,
  };
};
