import React from 'react';
import { useMyCourses } from '../../hooks/useMyCourses';
import { useAuth } from '../../contexts/AuthContext';
import { Translator } from '../../data/i18n';
import StudentPageScaffold from './StudentPageScaffold';

interface StudentMyCoursesPageProps {
  onBack: () => void;
  onSelectCourse: (unitId: string) => void;
  t: Translator;
}

export default function StudentMyCoursesPage({
  onBack,
  onSelectCourse,
  t: _t,
}: StudentMyCoursesPageProps): React.ReactElement {
  const { user } = useAuth();
  const { courses, isLoading, error } = useMyCourses();

  return (
    <StudentPageScaffold
      onBack={onBack}
      isAuthenticated={Boolean(user)}
      authMessage="Autenticação necessária para acessar seus cursos."
      isLoading={isLoading}
      loadingMessage="A carregar cursos..."
      error={error}
      errorTitle="Erro ao carregar cursos"
    >
      <div className="mb-16">
        <h1 className="text-6xl lg:text-8xl font-black tracking-tighter uppercase leading-none mb-4">
          Meus Cursos
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Você está inscrito em <span className="font-bold">{courses.length}</span> {courses.length === 1 ? 'curso' : 'cursos'}
        </p>
      </div>

      {courses.length === 0 ? (
        <div className="stark-border bg-brand-muted p-8 text-center">
          <p className="text-sm font-semibold mb-4">Você ainda não se inscreveu em nenhum curso.</p>
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-black text-xs font-bold uppercase tracking-widest stark-border hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
          >
            <span className="material-symbols-outlined">explore</span>
            Explorar Cursos
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((enrollment) => (
            <div
              key={enrollment.id}
              className="stark-border p-6 hover:bg-brand-muted transition-colors cursor-pointer group"
              onClick={() => onSelectCourse(enrollment.course_id)}
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-bold flex-1 group-hover:text-brand-primary transition-colors">
                  {enrollment.course_id}
                </h3>
                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 stark-border ${
                  enrollment.status === 'active'
                    ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200'
                    : enrollment.status === 'completed'
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
                }`}>
                  {enrollment.status}
                </span>
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold">Progresso</span>
                  <span className="text-xs font-bold text-brand-primary">{enrollment.progress_percentage}%</span>
                </div>
                <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
                  <div
                    className="h-full bg-brand-primary transition-all duration-300"
                    style={{ width: `${enrollment.progress_percentage}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400 mb-4">
                {enrollment.enrolled_at && (
                  <p>Inscrito em: {new Date(enrollment.enrolled_at).toLocaleDateString('pt-PT')}</p>
                )}
                {enrollment.last_accessed_at && (
                  <p>Último acesso: {new Date(enrollment.last_accessed_at).toLocaleDateString('pt-PT')}</p>
                )}
              </div>

              <button
                className="w-full py-2 px-4 bg-primary text-black text-xs font-bold uppercase tracking-widest stark-border hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectCourse(enrollment.course_id);
                }}
              >
                Continuar
              </button>
            </div>
          ))}
        </div>
      )}
    </StudentPageScaffold>
  );
}
