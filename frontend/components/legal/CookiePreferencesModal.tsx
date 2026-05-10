import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { CookieConsentPreferences } from '../../services/consentService';

type Props = {
  locale: 'pt' | 'en';
  initialPreferences: CookieConsentPreferences;
  onClose: () => void;
  onSave: (preferences: CookieConsentPreferences) => void;
};

const copy = {
  pt: {
    title: 'Preferencias de cookies',
    subtitle: 'Cookies necessarios sao obrigatorios para o funcionamento da plataforma e nao podem ser desativados. Cookies opcionais ajudam a melhorar a experiencia.',
    necessary: 'Cookies necessarios',
    preferences: 'Cookies de preferencias',
    analytics: 'Cookies de analitica',
    marketing: 'Cookies de marketing',
    close: 'Fechar',
    save: 'Guardar preferencias',
  },
  en: {
    title: 'Cookie preferences',
    subtitle: 'Necessary cookies are required for the platform to function properly and cannot be disabled. Optional cookies help us improve the platform and personalize your experience.',
    necessary: 'Necessary cookies',
    preferences: 'Preference cookies',
    analytics: 'Analytics cookies',
    marketing: 'Marketing cookies',
    close: 'Close',
    save: 'Save preferences',
  },
} as const;

const CookiePreferencesModal: React.FC<Props> = ({ locale, initialPreferences, onClose, onSave }) => {
  const text = copy[locale];
  const [preferences, setPreferences] = useState<CookieConsentPreferences>(initialPreferences);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPreferences(initialPreferences);
  }, [initialPreferences]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }

      if (event.key !== 'Tab' || !modalRef.current) return;

      const focusables = modalRef.current.querySelectorAll<HTMLElement>('button, input, [href], [tabindex]:not([tabindex="-1"])');
      if (!focusables.length) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const toggles = useMemo(
    () => [
      {
        key: 'preferences' as const,
        label: text.preferences,
      },
      {
        key: 'analytics' as const,
        label: text.analytics,
      },
      {
        key: 'marketing' as const,
        label: text.marketing,
      },
    ],
    [text.preferences, text.analytics, text.marketing],
  );

  return (
    <div className="fixed inset-0 z-[190] bg-black/60 backdrop-blur-sm p-4 flex items-center justify-center" role="dialog" aria-modal="true" aria-labelledby="cookie-preferences-title">
      <div ref={modalRef} className="w-full max-w-xl bg-white stark-border shadow-[8px_8px_0_0_rgba(0,0,0,1)] p-6 flex flex-col gap-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="cookie-preferences-title" className="text-lg font-black uppercase tracking-wide">{text.title}</h2>
            <p className="text-sm text-gray-700 mt-2">{text.subtitle}</p>
          </div>
          <button type="button" className="w-10 h-10 stark-border" onClick={onClose} aria-label={text.close}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="stark-border p-4 bg-brand-muted">
          <div className="flex items-center justify-between">
            <p className="text-sm font-black uppercase tracking-wide">{text.necessary}</p>
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-600">Sempre ativo</span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {toggles.map((item) => (
            <label key={item.key} className="stark-border p-4 flex items-center justify-between gap-4 cursor-pointer">
              <span className="text-sm font-bold">{item.label}</span>
              <input
                type="checkbox"
                checked={preferences[item.key]}
                onChange={(event) => setPreferences((prev) => ({ ...prev, [item.key]: event.target.checked }))}
                className="w-5 h-5"
              />
            </label>
          ))}
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          <button
            type="button"
            onClick={onClose}
            className="stark-border px-4 py-3 text-[10px] uppercase font-black tracking-widest"
          >
            {text.close}
          </button>
          <button
            type="button"
            onClick={() => onSave({ ...preferences, necessary: true })}
            className="stark-border bg-primary px-4 py-3 text-[10px] uppercase font-black tracking-widest"
          >
            {text.save}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookiePreferencesModal;
