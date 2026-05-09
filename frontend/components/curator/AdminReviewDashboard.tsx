import React, { useState, useEffect } from 'react';
import { getAdminQueue, getSubmissionCountByStatus } from '../../services/contentSubmissionSource';
import { listApplications } from '../../services/curatorApplicationSource';
import { createTranslator, type Locale } from '../../data/i18n';
import type { ContentSubmission, EditorApplication } from '../../types';

interface AdminReviewDashboardProps {
  locale?: Locale;
}

export const AdminReviewDashboard: React.FC<AdminReviewDashboardProps> = ({ locale = 'pt' }) => {
  const t = createTranslator(locale as Locale);

  const [activeTab, setActiveTab] = useState<'submissions' | 'applications'>('submissions');
  const [submissions, setSubmissions] = useState<ContentSubmission[]>([]);
  const [applications, setApplications] = useState<EditorApplication[]>([]);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const [submissionFilter, setSubmissionFilter] = useState<ContentSubmission['status'] | ''>('');
  const [appFilter, setAppFilter] = useState<EditorApplication['status'] | ''>('');

  // Load dashboard data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Load submissions
        const { submissions } = await getAdminQueue({
          status: submissionFilter || undefined,
          limit: 20,
          offset: 0,
        });
        setSubmissions(submissions);

        // Load submission counts
        const counts = await getSubmissionCountByStatus();
        setStatusCounts(counts);

        // Load applications
        const { applications } = await listApplications(
          appFilter || undefined,
          20,
          0
        );
        setApplications(applications);
      } catch (err) {
        console.error('Error loading dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [submissionFilter, appFilter]);

  const submissionStatuses: ContentSubmission['status'][] = [
    'pending',
    'submitted',
    'in_review',
    'approved',
    'rejected',
    'needs_changes',
    'published',
  ];

  const appStatuses: EditorApplication['status'][] = ['pending', 'approved', 'rejected'];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">{t('curator.reviewDashboard.title')}</h1>
          <p className="text-slate-600">{locale === 'pt' ? 'Painel administrativo de revisão' : 'Admin review panel'}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {submissionStatuses.map((status) => (
            <div key={status} className="bg-white stark-border p-4 rounded-lg">
              <p className="text-xs text-slate-600 uppercase font-semibold">
                {t(`curator.mySubmissions.status.${status}`)}
              </p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {statusCounts[status] || 0}
              </p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="bg-white stark-border rounded-lg mb-8">
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveTab('submissions')}
              className={`flex-1 px-6 py-4 font-semibold text-center transition-colors ${
                activeTab === 'submissions'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t('curator.reviewDashboard.submissions')}
            </button>
            <button
              onClick={() => setActiveTab('applications')}
              className={`flex-1 px-6 py-4 font-semibold text-center transition-colors ${
                activeTab === 'applications'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t('curator.reviewDashboard.applications')}
            </button>
          </div>

          {/* Submissions Tab */}
          {activeTab === 'submissions' && (
            <div className="p-6">
              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  {t('curator.reviewDashboard.filter')}
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSubmissionFilter('')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      submissionFilter === ''
                        ? 'bg-primary text-black stark-border'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {locale === 'pt' ? 'Todas' : 'All'}
                  </button>
                  {submissionStatuses.map((status) => (
                    <button
                      key={status}
                      onClick={() => setSubmissionFilter(status)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        submissionFilter === status
                          ? 'bg-primary text-black stark-border'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {t(`curator.mySubmissions.status.${status}`)}
                    </button>
                  ))}
                </div>
              </div>

              {loading ? (
                <p className="text-slate-600">{locale === 'pt' ? 'Carregando...' : 'Loading...'}</p>
              ) : submissions.length === 0 ? (
                <p className="text-slate-600">{t('curator.reviewDashboard.noItems')}</p>
              ) : (
                <div className="space-y-4">
                  {submissions.map((sub) => (
                    <div
                      key={sub.id}
                      className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-bold text-slate-900">{sub.suggested_title}</h3>
                          <p className="text-sm text-slate-600 mt-1">{sub.author_name} ({sub.author_email})</p>
                          <div className="flex gap-2 mt-2 flex-wrap">
                            <span className="text-xs bg-slate-100 px-2 py-1 rounded">
                              {sub.content_type}
                            </span>
                            {sub.course_id && (
                              <span className="text-xs bg-slate-100 px-2 py-1 rounded">
                                {sub.course_id}
                              </span>
                            )}
                            {sub.unit_id && (
                              <span className="text-xs bg-slate-100 px-2 py-1 rounded">
                                {sub.unit_id}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-900">
                            {t(`curator.mySubmissions.status.${sub.status}`)}
                          </span>
                          <p className="text-xs text-slate-500 mt-2">
                            {new Date(sub.created_at).toLocaleDateString(locale === 'pt' ? 'pt-PT' : 'en-US')}
                          </p>
                          <a
                            href={`#submission-${sub.id}`}
                            className="text-xs text-primary font-semibold mt-2 block hover:underline"
                          >
                            {locale === 'pt' ? 'Ver detalhe' : 'View details'}
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Applications Tab */}
          {activeTab === 'applications' && (
            <div className="p-6">
              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  {t('curator.reviewDashboard.filter')}
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setAppFilter('')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      appFilter === ''
                        ? 'bg-primary text-black stark-border'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {locale === 'pt' ? 'Todas' : 'All'}
                  </button>
                  {appStatuses.map((status) => (
                    <button
                      key={status}
                      onClick={() => setAppFilter(status)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        appFilter === status
                          ? 'bg-primary text-black stark-border'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {t(`curator.apply.status.${status}`)}
                    </button>
                  ))}
                </div>
              </div>

              {loading ? (
                <p className="text-slate-600">{locale === 'pt' ? 'Carregando...' : 'Loading...'}</p>
              ) : applications.length === 0 ? (
                <p className="text-slate-600">{t('curator.reviewDashboard.noItems')}</p>
              ) : (
                <div className="space-y-4">
                  {applications.map((app) => (
                    <div
                      key={app.id}
                      className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-bold text-slate-900">{app.full_name}</h3>
                          <p className="text-sm text-slate-600 mt-1">{app.email}</p>
                          {app.specialty_area && (
                            <p className="text-sm text-slate-600 mt-1">
                              {locale === 'pt' ? 'Área' : 'Area'}: {app.specialty_area}
                            </p>
                          )}
                          <p className="text-xs text-slate-500 mt-2">
                            {locale === 'pt' ? 'Enviada em' : 'Submitted'}: {' '}
                            {new Date(app.created_at).toLocaleDateString(locale === 'pt' ? 'pt-PT' : 'en-US')}
                          </p>
                        </div>

                        <div className="text-right">
                          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-900">
                            {t(`curator.apply.status.${app.status}`)}
                          </span>
                          <a
                            href={`#application-${app.id}`}
                            className="text-xs text-primary font-semibold mt-2 block hover:underline"
                          >
                            {locale === 'pt' ? 'Ver detalhe' : 'View details'}
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
