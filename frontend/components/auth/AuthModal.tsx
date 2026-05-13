import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../../services/supabase';
import { LEGAL_VERSION } from '../../services/legalConfig';
import { syncLegalAcceptance } from '../../services/consentService';

type Tab = 'signin' | 'signup';

interface Props {
  onClose: () => void;
  t: (key: string) => string;
  locale: 'pt' | 'en';
  onNavigateLegal: (document: 'privacy-policy' | 'terms-of-service' | 'cookie-policy') => void;
  onAcceptedLegal: (marketingOptIn: boolean) => void;
}

const AuthModal: React.FC<Props> = ({ onClose, t, locale, onNavigateLegal, onAcceptedLegal }) => {
  const [tab, setTab] = useState<Tab>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [acceptLegal, setAcceptLegal] = useState(false);
  const [acceptMarketing, setAcceptMarketing] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Close on Escape and keep focus inside modal while open
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key !== 'Tab' || !modalRef.current) {
        return;
      }

      const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (!focusableElements.length) {
        return;
      }

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement as HTMLElement | null;

      if (!e.shiftKey && activeElement === last) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    };

    window.addEventListener('keydown', onKey);
    firstInputRef.current?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const reset = () => { setError(null); setSuccess(null); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    reset();
    setIsLoading(true);
    try {
      if (tab === 'signin') {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) {
          setError(err.message.includes('Invalid') ? t('auth.errorInvalidCredentials') : t('auth.errorGeneric'));
        } else {
          setSuccess(t('auth.successSignedIn'));
          setTimeout(onClose, 800);
        }
      } else {
        if (!acceptLegal) {
          setError(locale === 'pt' ? 'Precisa aceitar os Termos de Servico e a Politica de Privacidade para criar conta.' : 'You must accept the Terms of Service and Privacy Policy to create an account.');
          setIsLoading(false);
          return;
        }
        const { data, error: err } = await supabase.auth.signUp({ email, password });
        if (err) {
          setError(err.message.includes('already') ? t('auth.errorEmailInUse') : t('auth.errorGeneric'));
        } else {
          onAcceptedLegal(acceptMarketing);
          await syncLegalAcceptance(data.user?.id ?? null, {
            acceptedAt: new Date().toISOString(),
            termsVersion: LEGAL_VERSION.termsOfService,
            privacyVersion: LEGAL_VERSION.privacyPolicy,
            marketingOptIn: acceptMarketing,
          });
          setSuccess('Conta criada! Verifique o seu e-mail para confirmar.');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogle = async () => {
    reset();
    setIsOAuthLoading(true);
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      });
      if (oauthError) {
        setError(t('auth.errorGeneric'));
      }
    } catch {
      setError(t('auth.errorGeneric'));
    } finally {
      setIsOAuthLoading(false);
    }
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      role="dialog"
      aria-modal="true"
      aria-label={tab === 'signin' ? t('auth.signIn') : t('auth.signUp')}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div ref={modalRef} className="bg-white stark-border w-full max-w-sm relative shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 stark-border-b">
          <span className="text-[10px] font-black uppercase tracking-widest">FACODI</span>
          <button onClick={onClose} aria-label="Fechar" className="w-11 h-11 flex items-center justify-center hover:bg-brand-muted transition-all stark-border">
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex stark-border-b">
          <button
            onClick={() => { setTab('signin'); reset(); }}
            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${tab === 'signin' ? 'facodi-primary-surface stark-border-r' : 'text-gray-400 hover:bg-brand-muted'}`}
          >
            {t('nav.login')}
          </button>
          <button
            onClick={() => { setTab('signup'); reset(); }}
            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${tab === 'signup' ? 'facodi-primary-surface' : 'text-gray-400 hover:bg-brand-muted'}`}
          >
            {t('auth.signUp')}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6 flex flex-col gap-4" noValidate>
          <div>
            <label htmlFor="auth-email" className="text-[9px] font-black uppercase tracking-widest text-gray-500 block mb-1">{t('auth.email')}</label>
            <input
              id="auth-email"
              ref={firstInputRef}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full stark-border px-4 py-3 text-sm font-medium outline-none focus:shadow-[4px_4px_0px_0px_rgba(239,255,0,1)] transition-all"
            />
          </div>
          <div>
            <label htmlFor="auth-password" className="text-[9px] font-black uppercase tracking-widest text-gray-500 block mb-1">{t('auth.password')}</label>
            <input
              id="auth-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={tab === 'signin' ? 'current-password' : 'new-password'}
              className="w-full stark-border px-4 py-3 text-sm font-medium outline-none focus:shadow-[4px_4px_0px_0px_rgba(239,255,0,1)] transition-all"
            />
          </div>

          {tab === 'signup' && (
            <div className="flex flex-col gap-3">
              <label className="flex items-start gap-3 text-[11px] text-gray-700">
                <input
                  type="checkbox"
                  checked={acceptLegal}
                  onChange={(event) => setAcceptLegal(event.target.checked)}
                  className="mt-0.5 w-4 h-4"
                />
                <span>
                  {locale === 'pt' ? 'Li e concordo com os ' : 'I have read and agree to the '}
                  <button type="button" className="underline font-bold" onClick={() => onNavigateLegal('terms-of-service')}>
                    {locale === 'pt' ? 'Termos de Servico' : 'Terms of Service'}
                  </button>
                  {locale === 'pt' ? ' e com a ' : ' and the '}
                  <button type="button" className="underline font-bold" onClick={() => onNavigateLegal('privacy-policy')}>
                    {locale === 'pt' ? 'Politica de Privacidade' : 'Privacy Policy'}
                  </button>
                  .
                </span>
              </label>
              <label className="flex items-start gap-3 text-[11px] text-gray-700">
                <input
                  type="checkbox"
                  checked={acceptMarketing}
                  onChange={(event) => setAcceptMarketing(event.target.checked)}
                  className="mt-0.5 w-4 h-4"
                />
                <span>
                  {locale === 'pt'
                    ? 'Gostaria de receber atualizacoes, newsletters e anuncios de produto.'
                    : 'I would like to receive updates, newsletters, and product announcements.'}
                </span>
              </label>
            </div>
          )}

          {error && <p role="alert" className="text-[10px] font-bold uppercase text-red-600 stark-border border-red-300 px-3 py-2 bg-red-50">{error}</p>}
          {success && <p role="status" className="text-[10px] font-bold uppercase text-green-700 stark-border border-green-300 px-3 py-2 bg-green-50">{success}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="facodi-primary-surface py-3 text-[10px] font-black uppercase tracking-widest stark-border hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading && <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>}
            {tab === 'signin' ? t('nav.login') : t('auth.signUp')}
          </button>

          <div className="flex items-center gap-3 my-1">
            <div className="flex-1 h-px bg-black/10" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">{t('auth.orContinueWith')}</span>
            <div className="flex-1 h-px bg-black/10" />
          </div>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={isOAuthLoading}
            className="w-full stark-border py-3 text-[10px] font-black uppercase tracking-widest hover:bg-brand-muted transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {isOAuthLoading ? 'A ligar Google...' : t('auth.continueWithGoogle')}
          </button>

          {tab === 'signup' && (
            <button
              type="button"
              onClick={() => onNavigateLegal('cookie-policy')}
              className="text-left text-[10px] underline font-bold text-gray-600"
            >
              {locale === 'pt' ? 'Ver Politica de Cookies' : 'View Cookie Policy'}
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

export default AuthModal;
