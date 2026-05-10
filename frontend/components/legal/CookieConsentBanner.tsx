import React from 'react';

type Props = {
  locale: 'pt' | 'en';
  onAcceptAll: () => void;
  onRejectNonEssential: () => void;
  onCustomize: () => void;
};

const copy = {
  pt: {
    title: 'Valorizamos a sua privacidade',
    body: 'Utilizamos cookies e tecnologias semelhantes para melhorar a sua experiencia, analisar o uso da plataforma, guardar preferencias e reforcar seguranca. Pode aceitar todos os cookies, rejeitar os nao essenciais, ou personalizar preferencias.',
    acceptAll: 'Aceitar todos',
    reject: 'Rejeitar nao essenciais',
    customize: 'Personalizar preferencias',
  },
  en: {
    title: 'We value your privacy',
    body: 'We use cookies and similar technologies to improve your experience, analyze platform usage, save your preferences, and enhance security. You can accept all cookies, reject non-essential cookies, or customize your preferences.',
    acceptAll: 'Accept all',
    reject: 'Reject non-essential',
    customize: 'Customize preferences',
  },
} as const;

const CookieConsentBanner: React.FC<Props> = ({ locale, onAcceptAll, onRejectNonEssential, onCustomize }) => {
  const text = copy[locale];

  return (
    <section
      className="fixed bottom-0 left-0 right-0 z-[180] border-t-2 border-black bg-white shadow-[0_-6px_0_0_rgba(0,0,0,0.08)]"
      role="region"
      aria-labelledby="cookie-banner-title"
      aria-describedby="cookie-banner-body"
    >
      <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-5 flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <h2 id="cookie-banner-title" className="text-sm md:text-base font-black uppercase tracking-wide">
            {text.title}
          </h2>
          <p id="cookie-banner-body" className="text-xs md:text-sm text-gray-700 leading-relaxed max-w-4xl">
            {text.body}
          </p>
        </div>
        <div className="flex flex-col md:flex-row gap-2 md:gap-3">
          <button
            type="button"
            onClick={onAcceptAll}
            className="bg-primary text-black px-4 py-3 text-[11px] font-black uppercase tracking-widest stark-border"
          >
            {text.acceptAll}
          </button>
          <button
            type="button"
            onClick={onRejectNonEssential}
            className="bg-white text-black px-4 py-3 text-[11px] font-black uppercase tracking-widest stark-border"
          >
            {text.reject}
          </button>
          <button
            type="button"
            onClick={onCustomize}
            className="bg-white text-black px-4 py-3 text-[11px] font-black uppercase tracking-widest stark-border"
          >
            {text.customize}
          </button>
        </div>
      </div>
    </section>
  );
};

export default CookieConsentBanner;
