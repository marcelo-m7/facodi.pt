import React, { useState, useEffect } from 'react';
import { getMySubmissions } from '../../services/contentSubmissionSource';
import { createTranslator, type Locale } from '../../data/i18n';
import type { ContentSubmission } from '../../types';

interface SubmissionListPageProps {
  locale?: Locale;
}

export const SubmissionListPage: React.FC<SubmissionListPageProps> = ({ locale = 'pt' }) => {
  const t = createTranslator(locale as Locale);

  const [submissions, setSubmissions] = useState<ContentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ContentSubmission['status'] | 'all'>('all');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);

  const pageSize = 10;

  // Load submissions on mount and when filter/page changes
  useEffect(() => {
    const loadSubmissions = async () => {
      try {
        setLoading(true);
        const status = filter === 'all' ? undefined : filter;
        const { submissions, total } = await getMySubmissions(status, pageSize, page * pageSize);
        setSubmissions(submissions);
        setTotal(total);
      } catch (err) {
        console.error('Error loading submissions:', err);
      } finally {
        setLoading(false);
      }
    };

    loadSubmissions();
  }, [filter, page]);

  const statusColors: Record<ContentSubmission['status'], string> = {
    pending: 'bg-yellow-50 border-yellow-200',
    submitted: 'bg-blue-50 border-blue-200',
    in_review: 'bg-indigo-50 border-indigo-200',
    approved: 'bg-green-50 border-green-200',
    rejected: 'bg-red-50 border-red-200',
    needs_changes: 'bg-orange-50 border-orange-200',
    published: 'bg-emerald-50 border-emerald-200',
  };

  const statusTextColors: Record<ContentSubmission['status'], string> = {
    pending: 'text-yellow-900',
    submitted: 'text-blue-900',
    in_review: 'text-indigo-900',
    approved: 'text-green-900',
    rejected: 'text-red-900',
    needs_changes: 'text-orange-900',
    published: 'text-emerald-900',
  };

  const statuses: Array<ContentSubmission['status'] | 'all'> = [
    'all',
    'pending',
    'submitted',
    'in_review',
    'approved',
    'rejected',
    'needs_changes',
    'published',
  ];

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="facodi-page">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[0.95] mb-4">{t('curator.mySubmissions.title')}</h1>
          <p className="text-base text-gray-600 dark:text-gray-400 font-medium">
            {locale === 'pt' 
              ? `${total} ${total === 1 ? 'submissão' : 'submissões'}`
              : `${total} ${total === 1 ? 'submission' : 'submissions'}`}
          </p>
        </div>

        {/* Filter */}
        <div className="facodi-card mb-8 p-6">
          <label className="facodi-label mb-4 block">
            {t('curator.mySubmissions.filter')}
          </label>
          <div className="flex flex-wrap gap-2">
            {statuses.map((status) => (
              <button
                key={status}
                onClick={() => {
                  setFilter(status);
                  setPage(0);
                }}
                className={`facodi-badge transition-all ${
                  filter === status
                    ? 'facodi-badge-neon'
                    : 'facodi-badge-secondary hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {status === 'all' 
                  ? (locale === 'pt' ? 'Todas' : 'All')
                  : t(`curator.mySubmissions.status.${status}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Submissions List */}
        {loading ? (
          <div className="text-center py-24">
            <div className="facodi-spinner mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">{locale === 'pt' ? 'Carregando...' : 'Loading...'}</p>
          </div>
        ) : submissions.length === 0 ? (
          <div className="facodi-card text-center py-12">
            <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-700 mb-4 inline-block">inbox</span>
            <p className="text-base font-semibold mt-4">{t('curator.mySubmissions.empty')}</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {submissions.map((submission) => (
                <div
                  key={submission.id}
                  className="facodi-card facodi-card-interactive p-6 border-l-4 border-primary"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold mb-2">
                        {submission.suggested_title}
                      </h3>

                      {submission.summary && (
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">{submission.summary}</p>
                      )}

                      <div className="flex flex-wrap gap-2 text-xs mb-3">
                        {submission.content_type && (
                          <span className="facodi-badge facodi-badge-secondary">
                            {submission.content_type}
                          </span>
                        )}
                        {submission.course_id && (
                          <span className="facodi-badge facodi-badge-secondary">
                            {locale === 'pt' ? 'Curso' : 'Course'}: {submission.course_id}
                          </span>
                        )}
                        {submission.unit_id && (
                          <span className="facodi-badge facodi-badge-secondary">
                            {locale === 'pt' ? 'Unidade' : 'Unit'}: {submission.unit_id}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        {locale === 'pt' ? 'Enviada em' : 'Submitted'}: {' '}
                        {new Date(submission.created_at).toLocaleDateString(locale === 'pt' ? 'pt-PT' : 'en-US')}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="facodi-badge facodi-badge-neon inline-block">
                        {t(`curator.mySubmissions.status.${submission.status}`)}
                      </span>

                      {submission.review_notes && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-3 max-w-xs">
                          <strong>{locale === 'pt' ? 'Notas' : 'Notes'}:</strong> {submission.review_notes}
                        </p>
                      )}

                      {submission.rejection_reason && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-3 max-w-xs">
                          <strong>{locale === 'pt' ? 'Motivo' : 'Reason'}:</strong> {submission.rejection_reason}
                        </p>
                      )}

                      {submission.reviewed_at && (
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-3">
                          {locale === 'pt' ? 'Revisada em' : 'Reviewed'}: {' '}
                          {new Date(submission.reviewed_at).toLocaleDateString(locale === 'pt' ? 'pt-PT' : 'en-US')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="facodi-btn facodi-btn-secondary"
                >
                  {locale === 'pt' ? 'Anterior' : 'Previous'}
                </button>

                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i)}
                    className={`px-4 py-2 text-sm font-bold transition-all ${
                      page === i
                        ? 'facodi-badge facodi-badge-neon'
                        : 'facodi-badge facodi-badge-secondary'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}

                <button
                  onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                  disabled={page >= totalPages - 1}
                  className="facodi-btn facodi-btn-secondary"
                >
                  {locale === 'pt' ? 'Próxima' : 'Next'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
