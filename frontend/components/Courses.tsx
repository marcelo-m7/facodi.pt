import React from 'react';
import { DEGREES } from '../data/degrees';
import { COURSE_UNITS } from '../data/courses';

interface CoursesProps {
  onSelectCourse: (courseId: string) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const Courses: React.FC<CoursesProps> = ({ onSelectCourse, t }) => {
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
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-2 gap-12">
          {DEGREES.map(course => {
            const unitCount = COURSE_UNITS.filter(unit => unit.courseId === course.id).length;
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
        </div>
      </section>
    </div>
  );
};

export default Courses;
