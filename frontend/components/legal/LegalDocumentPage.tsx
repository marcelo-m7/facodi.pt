import React from 'react';
import { Locale } from '../../data/i18n';
import { getLegalDocument, LegalDocumentType, LEGAL_CONTACT } from '../../services/legalConfig';

type Props = {
  locale: Locale;
  type: LegalDocumentType;
  onBack: () => void;
};

const LegalDocumentPage: React.FC<Props> = ({ locale, type, onBack }) => {
  const document = getLegalDocument(type, locale);

  return (
    <section className="min-h-screen bg-white">
      <div className="border-b-4 border-black bg-brand-muted py-14">
        <div className="max-w-4xl mx-auto px-6 lg:px-10">
          <button
            onClick={onBack}
            className="text-[10px] uppercase font-black tracking-widest mb-5 flex items-center gap-2 hover:underline"
          >
            <span aria-hidden="true">&larr;</span>
            {locale === 'pt' ? 'Voltar' : 'Back'}
          </button>
          <h1 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter">{document.title}</h1>
          <p className="mt-3 text-sm text-gray-700 max-w-3xl">{document.intro}</p>
          <p className="mt-3 text-[11px] font-bold uppercase tracking-widest text-gray-500">
            {locale === 'pt' ? 'Vigente desde' : 'Effective from'}: {document.effectiveDate}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 lg:px-10 py-10 flex flex-col gap-8">
        {document.sections.map((section) => (
          <article key={section.heading} className="stark-border p-6 bg-white">
            <h2 className="text-lg font-black uppercase tracking-wide mb-3">{section.heading}</h2>
            <div className="space-y-2 text-sm text-gray-700 leading-relaxed">
              {section.body.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          </article>
        ))}

        <aside className="stark-border p-6 bg-brand-muted">
          <h3 className="text-sm font-black uppercase tracking-widest mb-3">
            {locale === 'pt' ? 'Contacto para privacidade e direitos' : 'Privacy and rights contact'}
          </h3>
          <p className="text-sm text-gray-700">{LEGAL_CONTACT.controllerName}</p>
          <p className="text-sm text-gray-700">{LEGAL_CONTACT.contactEmail}</p>
          <a className="text-sm font-bold underline" href={LEGAL_CONTACT.contactUrl} target="_blank" rel="noreferrer noopener">
            {LEGAL_CONTACT.contactUrl}
          </a>
        </aside>
      </div>
    </section>
  );
};

export default LegalDocumentPage;
