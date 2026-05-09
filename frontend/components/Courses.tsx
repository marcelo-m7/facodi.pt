import React from 'react';
import { Course, CurricularUnit } from '../types';

interface CoursesProps {
  onSelectCourse: (courseId: string) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  courses: Course[];
  units: CurricularUnit[];
  isLoading: boolean;
}

const Courses: React.FC<CoursesProps> = ({ onSelectCourse, t, courses, units, isLoading }) => {
  return (
    <div className="bg-white">
      <section className="max-w-[1600px] mx-auto px-6 lg:px-12 py-16 lg:py-24">
        <div className="max-w-3xl">
          <h1 className="text-6xl lg:text-8xl font-black tracking-tighter uppercase leading-[0.9] mb-8">
            {t('courses.title')}
          </h1>
          <p className="text-xl lg:text-2xl text-gray-400 font-medium tracking-tight mb-6">
            {t('courses.lead')}
          </p>
          <p className="text-sm lg:text-base text-gray-500 font-medium leading-relaxed max-w-2xl">
            {t('courses.description')}
          </p>
        </div>
      </section>

      <section className="py-16 lg:py-24 border-t border-black/10">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12 mb-12 lg:mb-16">
          <div className="stark-border bg-brand-muted p-8 lg:p-10">
            <h3 className="text-[10px] font-black uppercase tracking-[0.35em] text-gray-500 mb-6">Como Explorar Esta Página</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest mb-2">1. Escolha um curso</p>
                <p className="text-xs text-gray-600 leading-relaxed">Cada cartão resume a estrutura curricular com ECTS, duração e unidades já mapeadas.</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest mb-2">2. Abra o currículo</p>
                <p className="text-xs text-gray-600 leading-relaxed">Use Ver Currículo para navegar pelas unidades e aplicar filtros por ano, semestre e área.</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest mb-2">3. Continue no seu ritmo</p>
                <p className="text-xs text-gray-600 leading-relaxed">Guarde unidades relevantes e acompanhe seu progresso no painel Meu Progresso.</p>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-[1600px] mx-auto px-6 md:px-8 lg:px-12 grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-12">
          {courses.map(course => {
            const unitCount = units.filter(unit => unit.courseId === course.id).length;
            return (
              <article
                key={course.id}
                data-testid="course-card"
                className="bg-white stark-border p-12 flex flex-col justify-between gap-12 hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all"
              >
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400 border border-black/10 px-2 py-1 mb-8 inline-block">
                    {course.id} · {course.institution}
                  </span>
                  <h2 className="text-3xl font-black uppercase tracking-tighter mb-6">{course.title}</h2>
                  <p className="text-sm font-medium text-gray-500 leading-relaxed mb-8">
                    {course.description}
                  </p>
                  <p className="text-xs font-medium text-gray-500 leading-relaxed">
                    {course.longDescription}
                  </p>
                </div>
                <div className="flex flex-col gap-6">
                  <div className="flex gap-10">
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase mb-1">ECTS</p>
                      <p className="text-xs font-bold">{course.ects}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Semestres</p>
                      <p className="text-xs font-bold">{course.semesters}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Unidades</p>
                      <p className="text-xs font-bold">
                        {unitCount} {t('courses.unitsMapped')}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => onSelectCourse(course.id)}
                    className="bg-primary text-black px-8 py-4 text-[10px] font-black uppercase tracking-widest stark-border hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all w-fit"
                  >
                    {t('courses.viewCurriculum')}
                  </button>
                </div>
              </article>
            );
          })}
          {isLoading && (
            <div className="stark-border p-12">
              <p className="text-sm font-bold uppercase tracking-widest text-gray-500">{t('courses.loading')}</p>
            </div>
          )}
          {!isLoading && !courses.length && (
            <div className="stark-border p-12">
              <p className="text-sm font-bold uppercase tracking-widest text-gray-500">Sem cursos sincronizados do Odoo neste momento.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Courses;
