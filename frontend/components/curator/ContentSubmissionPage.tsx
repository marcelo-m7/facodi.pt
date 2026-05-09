import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { submitContent, getMySubmissions } from '../../services/contentSubmissionSource';
import { parseYouTubeVideoId } from '../../services/videoSuggestionSource';
import { createTranslator } from '../../data/i18n';
import type { ContentSubmission } from '../../types';

interface FormData {
  contentType: 'video' | 'article' | 'interactive' | 'other';
  url: string;
  youtubeVideoId: string;
  suggestedTitle: string;
  summary: string;
  courseId: string;
  unitId: string;
  topic: string;
  pedagogicalReason: string;
  tags: string;
  additionalNotes: string;
}

interface ContentSubmissionPageProps {
  locale?: 'pt' | 'en';
}

export const ContentSubmissionPage: React.FC<ContentSubmissionPageProps> = ({ locale = 'pt' }) => {
  const t = createTranslator(locale);
  const { profile } = useAuth();

  const [formData, setFormData] = useState<FormData>({
    contentType: 'video',
    url: '',
    youtubeVideoId: '',
    suggestedTitle: '',
    summary: '',
    courseId: '',
    unitId: '',
    topic: '',
    pedagogicalReason: '',
    tags: '',
    additionalNotes: '',
  });

  const [submissions, setSubmissions] = useState<ContentSubmission[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingSubmissions, setLoadingSubmissions] = useState(true);

  // Load user's submissions on mount
  useEffect(() => {
    const loadSubmissions = async () => {
      try {
        const { submissions } = await getMySubmissions(undefined, 10, 0);
        setSubmissions(submissions);
      } catch (err) {
        console.warn('Could not load submissions:', err);
      } finally {
        setLoadingSubmissions(false);
      }
    };

    loadSubmissions();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    // Auto-detect YouTube video ID if URL changes
    if (name === 'url' && formData.contentType === 'video') {
      const videoId = parseYouTubeVideoId(value);
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        youtubeVideoId: videoId || '',
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const tags = formData.tags
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      await submitContent({
        content_type: formData.contentType,
        url: formData.url || undefined,
        youtube_video_id: formData.youtubeVideoId || undefined,
        suggested_title: formData.suggestedTitle,
        summary: formData.summary || undefined,
        course_id: formData.courseId || undefined,
        unit_id: formData.unitId || undefined,
        topic: formData.topic || undefined,
        pedagogical_reason: formData.pedagogicalReason || undefined,
        tags,
        additional_notes: formData.additionalNotes || undefined,
      });

      setSuccess(true);
      setFormData({
        contentType: 'video',
        url: '',
        youtubeVideoId: '',
        suggestedTitle: '',
        summary: '',
        courseId: '',
        unitId: '',
        topic: '',
        pedagogicalReason: '',
        tags: '',
        additionalNotes: '',
      });

      // Refresh submissions
      const { submissions } = await getMySubmissions(undefined, 10, 0);
      setSubmissions(submissions);

      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(false), 5000);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'unknown_error';
      if (errorMsg === 'submission_duplicate') {
        setError(t('curator.submit.error.duplicate'));
      } else if (errorMsg === 'invalid_url') {
        setError(t('curator.submit.error.invalidUrl'));
      } else {
        setError(t('curator.submit.error.generic'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">{t('curator.submit.title')}</h1>
          <p className="text-lg text-slate-600">{t('curator.submit.intro')}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <div className="bg-white stark-border p-6 md:p-8 rounded-lg">
              {success && (
                <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6 rounded text-green-900">
                  {t('curator.submit.success')}
                </div>
              )}

              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded text-red-900">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="contentType" className="block text-sm font-semibold text-slate-700 mb-2">
                    {t('curator.submit.contentType')} *
                  </label>
                  <select
                    id="contentType"
                    name="contentType"
                    value={formData.contentType}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="video">Vídeo / Video</option>
                    <option value="article">Artigo / Article</option>
                    <option value="interactive">Interativo / Interactive</option>
                    <option value="other">Outro / Other</option>
                  </select>
                </div>

                {formData.contentType === 'video' && (
                  <div>
                    <label htmlFor="url" className="block text-sm font-semibold text-slate-700 mb-2">
                      {t('curator.submit.youtubeUrl')} *
                    </label>
                    <input
                      id="url"
                      type="url"
                      name="url"
                      value={formData.url}
                      onChange={handleChange}
                      placeholder="https://youtu.be/... or https://youtube.com/watch?v=..."
                      required={formData.contentType === 'video'}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    {formData.youtubeVideoId && (
                      <p className="text-sm text-green-600 mt-2">
                        {t('videoSuggest.detectedVideoId')}: {formData.youtubeVideoId}
                      </p>
                    )}
                  </div>
                )}

                {formData.contentType !== 'video' && (
                  <div>
                    <label htmlFor="url" className="block text-sm font-semibold text-slate-700 mb-2">
                      {t('curator.submit.url')}
                    </label>
                    <input
                      id="url"
                      type="url"
                      name="url"
                      value={formData.url}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                )}

                <div>
                  <label htmlFor="suggestedTitle" className="block text-sm font-semibold text-slate-700 mb-2">
                    {t('curator.submit.suggestedTitle')} *
                  </label>
                  <input
                    id="suggestedTitle"
                    type="text"
                    name="suggestedTitle"
                    value={formData.suggestedTitle}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label htmlFor="summary" className="block text-sm font-semibold text-slate-700 mb-2">
                    {t('curator.submit.summary')}
                  </label>
                  <textarea
                    id="summary"
                    name="summary"
                    value={formData.summary}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="courseId" className="block text-sm font-semibold text-slate-700 mb-2">
                      {t('curator.submit.courseId')}
                    </label>
                    <input
                      id="courseId"
                      type="text"
                      name="courseId"
                      value={formData.courseId}
                      onChange={handleChange}
                      placeholder="ex: CC"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label htmlFor="unitId" className="block text-sm font-semibold text-slate-700 mb-2">
                      {t('curator.submit.unitId')}
                    </label>
                    <input
                      id="unitId"
                      type="text"
                      name="unitId"
                      value={formData.unitId}
                      onChange={handleChange}
                      placeholder="ex: 19411003"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label htmlFor="topic" className="block text-sm font-semibold text-slate-700 mb-2">
                      {t('curator.submit.topic')}
                    </label>
                    <input
                      id="topic"
                      type="text"
                      name="topic"
                      value={formData.topic}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="pedagogicalReason" className="block text-sm font-semibold text-slate-700 mb-2">
                    {t('curator.submit.pedagogicalReason')}
                  </label>
                  <textarea
                    id="pedagogicalReason"
                    name="pedagogicalReason"
                    value={formData.pedagogicalReason}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                </div>

                <div>
                  <label htmlFor="tags" className="block text-sm font-semibold text-slate-700 mb-2">
                    {t('curator.submit.tags')}
                  </label>
                  <input
                    id="tags"
                    type="text"
                    name="tags"
                    value={formData.tags}
                    onChange={handleChange}
                    placeholder={locale === 'pt' ? 'Separadas por vírgula' : 'Comma-separated'}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label htmlFor="additionalNotes" className="block text-sm font-semibold text-slate-700 mb-2">
                    {t('curator.submit.additionalNotes')}
                  </label>
                  <textarea
                    id="additionalNotes"
                    name="additionalNotes"
                    value={formData.additionalNotes}
                    onChange={handleChange}
                    rows={2}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-primary text-black py-3 font-bold uppercase tracking-widest stark-border hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? t('curator.submit.submitting') : t('curator.submit.submit')}
                </button>
              </form>
            </div>
          </div>

          {/* Recent Submissions Sidebar */}
          <div>
            <div className="bg-white stark-border p-6 rounded-lg sticky top-4">
              <h3 className="font-bold text-lg mb-4">{t('curator.mySubmissions.title')}</h3>

              {loadingSubmissions ? (
                <p className="text-slate-600 text-sm">{locale === 'pt' ? 'Carregando...' : 'Loading...'}</p>
              ) : submissions.length === 0 ? (
                <p className="text-slate-600 text-sm">{t('curator.mySubmissions.empty')}</p>
              ) : (
                <div className="space-y-3">
                  {submissions.slice(0, 5).map((sub) => (
                    <div key={sub.id} className="border-l-2 border-slate-200 pl-3 text-sm">
                      <p className="font-medium text-slate-900 truncate">{sub.suggested_title}</p>
                      <p className="text-xs text-slate-600 mt-1">
                        {t('curator.mySubmissions.status.' + sub.status)}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {new Date(sub.created_at).toLocaleDateString(locale === 'pt' ? 'pt-PT' : 'en-US')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
