
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
        <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black tracking-tight leading-[0.95] mb-6">
          Meu Progresso
        </h1>
        <p className="text-base lg:text-lg text-gray-600 dark:text-gray-400 font-medium">
          Acompanhe seus cursos, continue de onde parou e visualize sua atividade recente em um único painel.
        </p>
      </div>

      {isLoading && (
        <div className="facodi-card facodi-badge inline-flex items-center gap-3 mb-8">
          <span className="material-symbols-outlined animate-pulse text-xl">hourglass_top</span>
          A carregar progresso...
        </div>
      )}

      {error && (
        <div className="facodi-alert facodi-alert-error mb-8">
          <p className="font-semibold mb-2">Erro ao carregar painel</p>
          <p className="text-xs">{error}</p>
        </div>
      )}

      {!isLoading && !error && (
        <>
          <section className="facodi-card mb-10">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-600 dark:text-gray-400 mb-2">
                  Progresso Geral
                </p>
                <p className="text-5xl lg:text-6xl font-black tracking-tight">{dashboard.totalProgress}%</p>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                {dashboard.enrolledCourses.length} {dashboard.enrolledCourses.length === 1 ? 'curso ativo' : 'cursos ativos'}
              </div>
            </div>
            <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-300"
                style={{ width: `${dashboard.totalProgress}%` }}
              />
            </div>
          </section>

          {!hasEnrollments ? (
            <div className="facodi-card text-center py-12">
              <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-700 mb-4 inline-block">school</span>
              <p className="text-sm font-semibold mb-3 mt-4">Você ainda não se inscreveu em nenhum curso.</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Explore a área de cursos para iniciar sua jornada.</p>
            </div>
          ) : (
            <>
              <section className="mb-12">
                <h2 className="text-2xl lg:text-3xl font-black tracking-tight mb-6">Meus Cursos</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {dashboard.enrolledCourses.map((enrollment) => (
                    <div
                      key={enrollment.id}
                      className="facodi-card facodi-card-interactive transition-all cursor-pointer"
                      onClick={() => onSelectCourse(enrollment.course_id)}
                    >
                      <div className="flex items-start justify-between mb-4 gap-3">
                        <h3 className="text-base lg:text-lg font-bold break-words">{enrollment.course_id}</h3>
                        <span className="facodi-badge-neon text-[9px] shrink-0">
                          {enrollment.status}
                        </span>
                      </div>
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2 text-xs font-bold">
                          <span>Progresso</span>
                          <span>{enrollment.progress_percentage}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-300"
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
                  <h2 className="text-2xl lg:text-3xl font-black tracking-tight mb-6">Continue Assistindo</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {dashboard.continueWatching.map((content) => (
                      <div
                        key={content.id}
                        className="facodi-card facodi-card-interactive transition-all cursor-pointer"
                        onClick={() => onSelectVideo(content.content_id)}
                      >
                        <h3 className="text-base lg:text-lg font-bold mb-4 break-words">{content.content_id}</h3>
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2 text-xs font-bold">
                            <span>Progresso</span>
                            <span>{content.progress_percentage}%</span>
                          </div>
                          <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-300"
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
                <h2 className="text-2xl lg:text-3xl font-black tracking-tight mb-6">Atividades Recentes</h2>
                {dashboard.recentActivity.length === 0 ? (
                  <div className="facodi-card text-sm text-gray-600 dark:text-gray-400 text-center py-12">
                    <span className="material-symbols-outlined text-4xl text-gray-300 dark:text-gray-700 mb-4 inline-block">history</span>
                    <p className="mt-4">Ainda sem atividades recentes registradas.</p>
                  </div>
                ) : (
                  <div className="facodi-card">
                    <div className="space-y-4">
                      {dashboard.recentActivity.map((activity) => {
                        const label = EVENT_LABELS[activity.event_type] || activity.event_type;
                        return (
                          <div key={activity.id} className="flex items-start gap-4 pb-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0 last:pb-0">
                            <span className="material-symbols-outlined text-sm text-primary mt-0.5">history</span>
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
