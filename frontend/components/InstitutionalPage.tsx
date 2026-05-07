import React, { useEffect, useState } from 'react';
import { ContentPage } from '../types';
import { loadContentPage } from '../services/contentSource';
import MarkdownView from './MarkdownView';

interface Props {
  slug: string;
  locale?: string;
  onBack?: () => void;
}

const InstitutionalPage: React.FC<Props> = ({ slug, locale = 'pt', onBack }) => {
  const [page, setPage] = useState<ContentPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setPage(null);

    loadContentPage(slug).then((result) => {
      if (cancelled) return;
      if (!result) {
        setError('Página não encontrada.');
      } else {
        setPage(result);
      }
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [slug]);

  const title = page ? (locale === 'en' && page.titleEn ? page.titleEn : page.titlePt) : '';
  const body = page ? (locale === 'en' && page.bodyEn ? page.bodyEn : page.bodyPt) : '';

  return (
    <section className="min-h-screen bg-white">
      {/* Header stripe */}
      <div className="border-b-4 border-black bg-brand-muted py-16">
        <div className="max-w-4xl mx-auto px-8 lg:px-16">
          {onBack && (
            <button
              onClick={onBack}
              className="text-[10px] uppercase font-black tracking-widest mb-6 flex items-center gap-2 hover:underline"
            >
              ← Início
            </button>
          )}
          {loading && (
            <div className="h-10 bg-gray-200 animate-pulse rounded w-64" />
          )}
          {!loading && title && (
            <h1 className="text-5xl lg:text-7xl font-black uppercase tracking-tighter">{title}</h1>
          )}
        </div>
      </div>

      {/* Content area */}
      <div className="max-w-4xl mx-auto px-8 lg:px-16 py-16">
        {loading && (
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-100 animate-pulse rounded" style={{ width: `${80 - i * 5}%` }} />
            ))}
          </div>
        )}
        {!loading && error && (
          <div className="stark-border p-8 bg-red-50">
            <p className="font-bold text-red-700">{error}</p>
          </div>
        )}
        {!loading && body && (
          <MarkdownView content={body} />
        )}
      </div>
    </section>
  );
};

export default InstitutionalPage;
