
import React from 'react';
import { useStudentDashboard } from '../hooks/useStudentDashboard';

interface DashboardProps {
  onSelectCourse: (unitId: string) => void;
  onSelectVideo: (videoId: string) => void;
}

const EVENT_LABELS: Record<string, string> = {
  course_enrolled: 'Inscreveu-se em um curso',
  course_started: 'Iniciou um curso',
  course_completed: 'Completou um curso',
  unit_started: 'Iniciou uma unidade',
  unit_completed: 'Completou uma unidade',
  content_started: 'Iniciou um conteúdo',
  content_completed: 'Completou um conteúdo',
  content_abandoned: 'Abandonou um conteúdo',
  video_watched: 'Assistiu a um vídeo',
  resource_accessed: 'Acessou um recurso',
  certificate_earned: 'Conquistou um certificado',
};

const Dashboard: React.FC<DashboardProps> = ({ onSelectCourse, onSelectVideo }) => {
  const { data: dashboard, isLoading, error } = useStudentDashboard();
  const hasEnrollments = dashboard.enrolledCourses.length > 0;

  return (
    <div className="max-w-[1600px] mx-auto px-6 lg:px-12 py-16 lg:py-24">
      <div className="mb-12">
        <h1 className="text-6xl lg:text-8xl font-black tracking-tighter uppercase leading-none mb-6">
          Meu Progresso
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Acompanhe seus cursos, continue de onde parou e visualize sua atividade recente em um único painel.
        </p>
      </div>

      {isLoading && (
        <div className="stark-border bg-brand-muted p-6 text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-3 mb-8">
          <span className="material-symbols-outlined animate-pulse">hourglass_top</span>
          A carregar progresso...
        </div>
      )}

      {error && (
        <div className="stark-border bg-red-50 dark:bg-red-900 p-6 text-sm text-red-700 dark:text-red-200 mb-8">
          <p className="font-semibold mb-2">Erro ao carregar painel</p>
          <p className="text-xs">{error}</p>
        </div>
      )}

      {!isLoading && !error && (
        <>
          <section className="stark-border p-8 mb-10 bg-brand-muted">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-600 dark:text-gray-400 mb-2">
                  Progresso Geral
                </p>
                <p className="text-6xl lg:text-8xl font-black tracking-tighter">{dashboard.totalProgress}%</p>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {dashboard.enrolledCourses.length} {dashboard.enrolledCourses.length === 1 ? 'curso ativo' : 'cursos ativos'}
              </div>
            </div>
            <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-primary to-brand-secondary transition-all duration-300"
                style={{ width: `${dashboard.totalProgress}%` }}
              />
            </div>
          </section>

          {!hasEnrollments ? (
            <div className="stark-border bg-white p-8 text-center">
              <p className="text-sm font-semibold mb-3">Você ainda não se inscreveu em nenhum curso.</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Explore a área de cursos para iniciar sua jornada.</p>
            </div>
          ) : (
            <>
              <section className="mb-12">
                <h2 className="text-3xl lg:text-4xl font-black tracking-tighter uppercase mb-6">Meus Cursos</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {dashboard.enrolledCourses.map((enrollment) => (
                    <div
                      key={enrollment.id}
                      className="stark-border p-6 hover:bg-brand-muted transition-colors cursor-pointer"
                      onClick={() => onSelectCourse(enrollment.course_id)}
                    >
                      <div className="flex items-start justify-between mb-3 gap-3">
                        <h3 className="text-lg font-bold break-words">{enrollment.course_id}</h3>
                        <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 stark-border bg-white">
                          {enrollment.status}
                        </span>
                      </div>
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2 text-xs font-semibold">
                          <span>Progresso</span>
                          <span>{enrollment.progress_percentage}%</span>
                        </div>
                        <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
                          <div
                            className="h-full bg-brand-primary transition-all duration-300"
                            style={{ width: `${enrollment.progress_percentage}%` }}
                          />
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Último acesso: {enrollment.last_accessed_at ? new Date(enrollment.last_accessed_at).toLocaleDateString('pt-PT') : 'Não iniciado'}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              {dashboard.continueWatching.length > 0 && (
                <section className="mb-12">
                  <h2 className="text-3xl lg:text-4xl font-black tracking-tighter uppercase mb-6">Continue Assistindo</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {dashboard.continueWatching.map((content) => (
                      <div
                        key={content.id}
                        className="stark-border p-6 hover:bg-brand-muted transition-colors cursor-pointer"
                        onClick={() => onSelectVideo(content.content_id)}
                      >
                        <h3 className="text-base font-bold mb-3 break-words">{content.content_id}</h3>
                        <div className="mb-3">
                          <div className="flex items-center justify-between mb-2 text-xs font-semibold">
                            <span>Progresso</span>
                            <span>{content.progress_percentage}%</span>
                          </div>
                          <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
                            <div
                              className="h-full bg-brand-primary transition-all duration-300"
                              style={{ width: `${content.progress_percentage}%` }}
                            />
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {content.watch_seconds > 0 ? `Assistido: ${Math.round(content.watch_seconds / 60)} min` : 'Sem progresso de reprodução'}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <section>
                <h2 className="text-3xl lg:text-4xl font-black tracking-tighter uppercase mb-6">Atividades Recentes</h2>
                {dashboard.recentActivity.length === 0 ? (
                  <div className="stark-border bg-white p-8 text-sm text-gray-600 dark:text-gray-400">
                    Ainda sem atividades recentes registradas.
                  </div>
                ) : (
                  <div className="stark-border p-6 bg-white">
                    <div className="space-y-4">
                      {dashboard.recentActivity.map((activity) => {
                        const label = EVENT_LABELS[activity.event_type] || activity.event_type;
                        return (
                          <div key={activity.id} className="flex items-start gap-4 pb-4 border-b last:border-b-0 last:pb-0">
                            <span className="material-symbols-outlined text-sm text-brand-primary mt-0.5">history</span>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold">{label}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(activity.created_at).toLocaleString('pt-PT')}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </section>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default Dashboard;
