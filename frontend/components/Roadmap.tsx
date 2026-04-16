
import React, { useState } from 'react';
import { COURSE_UNITS } from '../data/courses';
import { DEGREES } from '../data/degrees';

interface RoadmapProps {
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const Roadmap: React.FC<RoadmapProps> = ({ t }) => {
  const [selectedCourseId, setSelectedCourseId] = useState(DEGREES[0].id);
  const selectedCourse = DEGREES.find(d => d.id === selectedCourseId) || DEGREES[0];
  const years = [1, 2, 3];

  return (
    <div className="max-w-[1600px] mx-auto px-6 lg:px-12 py-16 lg:py-24">
      {/* Course Switcher */}
      <div className="flex gap-4 mb-16 overflow-x-auto pb-4 scrollbar-hide">
        {DEGREES.map(course => (
          <button 
            key={course.id}
            onClick={() => setSelectedCourseId(course.id)}
            className={`px-6 py-3 text-[10px] font-black uppercase tracking-widest stark-border transition-all whitespace-nowrap ${
              selectedCourseId === course.id ? 'bg-primary text-black' : 'bg-white text-gray-400 hover:text-black'
            }`}
          >
            {course.id} - {course.title}
          </button>
        ))}
      </div>

      <div className="mb-20 flex flex-col lg:flex-row justify-between items-end gap-12">
        <div className="max-w-3xl">
          <h1 className="text-6xl lg:text-8xl font-black tracking-tighter uppercase leading-none mb-8">
            {selectedCourse.id}<br/>{t('roadmap.title')}
          </h1>
          <p className="text-xl lg:text-2xl text-gray-400 font-medium tracking-tight">
            {t('roadmap.subtitle', { semesters: selectedCourse.semesters, course: selectedCourse.title })}
          </p>
        </div>
        <div className="flex gap-4">
          <div className="stark-border px-6 py-4 text-center">
            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">{t('roadmap.duration')}</p>
            <p className="text-xl font-bold uppercase">{selectedCourse.semesters / 2} {t('roadmap.year')}</p>
          </div>
          <div className="stark-border px-6 py-4 bg-primary text-center">
            <p className="text-[9px] font-black uppercase tracking-widest text-black/40 mb-1">{t('roadmap.total')}</p>
            <p className="text-xl font-bold uppercase">{selectedCourse.ects} ECTS</p>
          </div>
        </div>
      </div>

      <div className="space-y-32">
        {years.map(year => (
          <div key={year} className="relative">
            <div className="flex items-center gap-8 mb-16">
              <h2 className="text-8xl lg:text-[12rem] font-black tracking-tighter leading-none text-black/5 select-none absolute -left-12 -top-12">
                0{year}
              </h2>
              <div className="relative z-10">
                <h3 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter italic">{t('roadmap.year')} 0{year}</h3>
                <div className="h-1 w-24 bg-primary mt-4"></div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 relative z-10">
              {[1, 2].map(semOffset => {
                const semester = (year - 1) * 2 + semOffset;
                const units = COURSE_UNITS.filter(u => u.semester === semester && u.courseId === selectedCourseId);
                
                return (
                  <div key={semester} className="stark-border p-10 bg-white hover:shadow-[10px_10px_0px_0px_#EFFF00] transition-all">
                    <div className="flex justify-between items-center mb-8 pb-4 border-b border-black/10">
                      <h4 className="text-xl font-black uppercase tracking-widest">{t('roadmap.semester')} 0{semester}</h4>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">{units.reduce((acc, u) => acc + u.ects, 0)} ECTS</span>
                    </div>
                    
                    <div className="space-y-6">
                      {units.length > 0 ? units.map(unit => (
                        <div key={unit.id} className="group cursor-pointer">
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <p className="text-[9px] font-black text-primary bg-black inline-block px-2 py-0.5 uppercase mb-1">
                                {unit.id}
                              </p>
                              <p className="text-sm font-bold uppercase group-hover:text-primary transition-colors">{unit.name}</p>
                            </div>
                            <span className="text-[10px] font-black opacity-20">{unit.ects} ECTS</span>
                          </div>
                        </div>
                      )) : (
                        <p className="text-xs italic text-gray-400 uppercase tracking-widest">Curriculum data pending for this semester...</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Roadmap;
