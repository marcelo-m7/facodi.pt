import React, { useEffect } from 'react';

interface DevelopmentDisclaimerProps {
  isOpen: boolean;
  title: string;
  body: string;
  signedMessage: string;
  signature: string;
  institutionalLine: string;
  closeLabel: string;
  onClose: () => void;
}

const DevelopmentDisclaimer: React.FC<DevelopmentDisclaimerProps> = ({
  isOpen,
  title,
  body,
  signedMessage,
  signature,
  institutionalLine,
  closeLabel,
  onClose,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[130] bg-black/55 flex items-end sm:items-center justify-center p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="development-disclaimer-title"
        className="w-full max-w-2xl bg-white stark-border border-2 border-black shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="px-6 py-5 sm:px-8 sm:py-7 border-b border-black/15 bg-brand-muted">
          <h2 id="development-disclaimer-title" className="text-xl sm:text-2xl font-black uppercase tracking-tighter">
            {title}
          </h2>
        </div>

        <div className="px-6 py-6 sm:px-8 sm:py-8 space-y-5">
          <p className="text-sm sm:text-base text-gray-700 leading-relaxed">{body}</p>

          <blockquote className="stark-border p-4 bg-brand-muted/40">
            <p className="text-sm text-gray-700 leading-relaxed">{signedMessage}</p>
            <footer className="mt-3 text-[11px] font-black uppercase tracking-wider text-gray-700">{signature}</footer>
          </blockquote>

          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500">{institutionalLine}</p>
        </div>

        <div className="px-6 py-5 sm:px-8 border-t border-black/15 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            autoFocus
            className="facodi-primary-surface px-5 py-2.5 text-[10px] font-black uppercase tracking-widest stark-border hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
          >
            {closeLabel}
          </button>
        </div>
      </div>
      <button
        type="button"
        aria-label={closeLabel}
        className="sr-only"
        onClick={onClose}
      >
        {closeLabel}
      </button>
    </div>
  );
};

export default DevelopmentDisclaimer;
