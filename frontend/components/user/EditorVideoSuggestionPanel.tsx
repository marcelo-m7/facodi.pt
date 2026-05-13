import React, { useMemo, useState } from 'react';
import { parseYouTubeVideoId, suggestYouTubeVideo, type VideoSuggestionResult } from '../../services/videoSuggestionSource';

interface Props {
  t: (key: string) => string;
}

const STATUS_CLASS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-900 border-amber-300',
  approved: 'bg-green-100 text-green-900 border-green-300',
  rejected: 'bg-rose-100 text-rose-900 border-rose-300',
};

const EditorVideoSuggestionPanel: React.FC<Props> = ({ t }) => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VideoSuggestionResult | null>(null);

  const parsedVideoId = useMemo(() => parseYouTubeVideoId(url.trim()), [url]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!parsedVideoId) {
      setError(t('videoSuggest.invalidUrl'));
      return;
    }

    setIsLoading(true);
    try {
      const data = await suggestYouTubeVideo(url.trim());
      setResult(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : t('auth.errorGeneric');
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const status = result?.status ?? result?.suggestion?.status ?? null;
  const statusLabel = status ? t(`videoSuggest.status.${status}`) : null;

  return (
    <section>
      <h2 className="text-[10px] font-black uppercase tracking-[0.3em] mb-6 border-b border-black pb-3">
        {t('videoSuggest.title')}
      </h2>

      <form onSubmit={submit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="editor-youtube-url" className="text-[9px] font-black uppercase tracking-widest text-gray-500 block mb-1">
            {t('videoSuggest.urlLabel')}
          </label>
          <input
            id="editor-youtube-url"
            type="url"
            placeholder="https://www.youtube.com/watch?v=..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            className="w-full stark-border px-4 py-3 text-sm font-medium outline-none focus:shadow-[4px_4px_0px_0px_rgba(239,255,0,1)] transition-all"
          />
          <p className="text-[10px] font-bold text-gray-400 mt-2 uppercase">
            {parsedVideoId ? `${t('videoSuggest.detectedVideoId')}: ${parsedVideoId}` : t('videoSuggest.helper')}
          </p>
        </div>

        {error && (
          <p role="alert" className="text-[10px] font-bold uppercase text-red-700 bg-red-50 border border-red-300 px-3 py-2 stark-border">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="self-start facodi-primary-surface px-8 py-3 text-[10px] font-black uppercase tracking-widest stark-border hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50"
        >
          {isLoading ? t('videoSuggest.submitting') : t('videoSuggest.submit')}
        </button>
      </form>

      {result && (
        <div className="mt-8 stark-border p-5 bg-brand-muted flex flex-col gap-4" data-testid="video-suggestion-result">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-[10px] font-black uppercase tracking-widest">{t('videoSuggest.resultTitle')}</p>
            {statusLabel && (
              <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 border ${STATUS_CLASS[status ?? ''] ?? 'bg-gray-100 text-gray-800 border-gray-300'}`}>
                {statusLabel}
              </span>
            )}
            {result.duplicate && (
              <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 border bg-gray-100 text-gray-800 border-gray-300">
                {t('videoSuggest.duplicate')}
              </span>
            )}
          </div>

          {result.video?.title && (
            <div className="grid grid-cols-1 md:grid-cols-[96px_1fr] gap-4 items-start">
              {result.video.thumbnailUrl && (
                <img
                  src={result.video.thumbnailUrl}
                  alt={result.video.title}
                  className="w-24 h-24 object-cover stark-border"
                  referrerPolicy="no-referrer"
                />
              )}
              <div className="flex flex-col gap-1">
                <p className="text-sm font-black">{result.video.title}</p>
                <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">{result.video.channelTitle}</p>
                {result.video.tags?.length ? (
                  <p className="text-[10px] text-gray-600">{result.video.tags.slice(0, 6).join(' • ')}</p>
                ) : null}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="stark-border bg-white p-3">
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-2">{t('videoSuggest.course')}</p>
              <p className="text-[11px] font-bold">{result.match?.course?.title ?? t('videoSuggest.notFound')}</p>
            </div>
            <div className="stark-border bg-white p-3">
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-2">{t('videoSuggest.unit')}</p>
              <p className="text-[11px] font-bold">{result.match?.unit?.name ?? t('videoSuggest.notFound')}</p>
            </div>
            <div className="stark-border bg-white p-3">
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-2">{t('videoSuggest.playlist')}</p>
              <p className="text-[11px] font-bold">{result.match?.playlist?.name ?? t('videoSuggest.notFound')}</p>
            </div>
            <div className="stark-border bg-white p-3">
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-2">{t('videoSuggest.topic')}</p>
              <p className="text-[11px] font-bold">{result.match?.topic ?? t('videoSuggest.notFound')}</p>
            </div>
          </div>

          {typeof result.match?.confidence === 'number' && (
            <p className="text-[10px] uppercase tracking-widest font-bold text-gray-600">
              {t('videoSuggest.confidence')}: {(result.match.confidence * 100).toFixed(1)}%
            </p>
          )}

          {result.message && (
            <p className="text-[10px] uppercase tracking-widest font-bold text-gray-600">{result.message}</p>
          )}
        </div>
      )}
    </section>
  );
};

export default EditorVideoSuggestionPanel;
