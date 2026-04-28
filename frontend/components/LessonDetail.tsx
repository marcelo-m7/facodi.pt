import React, { useState, useEffect } from 'react';
import { CurricularUnit } from '../types';
import MarkdownView from './MarkdownView';

interface Props {
  unit: CurricularUnit;
  allUnits: CurricularUnit[];
  onBack: () => void;
  onNavigate?: (id: string) => void;
  t: (key: string) => string;
}

const LessonDetail: React.FC<Props> = ({ unit, allUnits, onBack, onNavigate, t }) => {
  const [isLoading, setIsLoading] = useState(false);

  // Helper to render video player
  const renderVideoPlayer = () => {
    // Try to extract YouTube video ID from websiteUrl or other sources
    // For now, render placeholder until video_url is populated in Odoo
    
    if (unit.tags.includes('video')) {
      return (
        <div className="aspect-video bg-black stark-border mb-16 flex items-center justify-center">
          <div className="text-center">
            <span className="material-symbols-outlined text-6xl text-gray-600 mb-4">play_circle</span>
            <p className="text-sm text-gray-400 uppercase tracking-widest font-bold">Vídeo em breve</p>
            <p className="text-xs text-gray-500 mt-2">Será adicionado à medida que o conteúdo for sincronizado</p>
          </div>
        </div>
      );
    }

    // Placeholder for non-video lessons
    return (
      <div className="aspect-video bg-gradient-to-b from-gray-100 to-white stark-border mb-16 flex items-center justify-center">
        <div className="text-center">
          <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">description</span>
          <p className="text-sm text-gray-400 uppercase tracking-widest font-bold">Conteúdo em texto</p>
        </div>
      </div>
    );
  };

  const relatedUnits = allUnits.filter(u => 
    u.courseId === unit.courseId && 
    u.semester === unit.semester && 
    u.id !== unit.id
  ).slice(0, 4);

  return (
    <div className="max-w-[1600px] mx-auto px-6 lg:px-12 py-16 lg:py-24">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] mb-12 hover:text-primary transition-colors group"
      >
        <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform">arrow_back</span>
        Voltar
      </button>

      <div className="flex flex-col lg:flex-row gap-16 lg:gap-32">
        {/* Main Content */}
        <main className="flex-1">
          {/* Video Player */}
          {renderVideoPlayer()}

          {/* Lesson Title & Metadata */}
          <div className="mb-16">
            <span className="text-[10px] font-black bg-primary text-black px-3 py-1.5 uppercase tracking-[0.2em] mb-6 inline-block">
              {unit.courseId}
            </span>
            <h1 className="text-5xl lg:text-6xl font-black uppercase tracking-tighter leading-tight mb-8">
              {unit.name}
            </h1>
            <div className="flex flex-wrap gap-4 mb-8">
              {unit.tags.map(tag => (
                <span key={tag} className="text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 bg-gray-100 stark-border">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Description */}
          {unit.description && (
            <div className="prose prose-sm max-w-none mb-16">
              <div className="stark-border p-8 bg-gray-50">
                <MarkdownView content={unit.description} />
              </div>
            </div>
          )}

          {/* Extended Content */}
          {unit.content && (
            <div className="stark-border p-8 bg-white mb-16">
              <h2 className="text-2xl font-black uppercase tracking-tighter mb-8">Conteúdo Detalhado</h2>
              <MarkdownView content={unit.content} />
            </div>
          )}
        </main>

        {/* Sidebar */}
        <aside className="w-full lg:w-96 shrink-0">
          <div className="sticky top-32 space-y-8">
            {/* Lesson Info Card */}
            <div className="stark-border p-8 bg-black text-white shadow-[8px_8px_0px_0px_rgba(239,255,0,0.5)]">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-6 text-gray-300">Informação</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-[9px] uppercase font-black tracking-widest text-gray-500 mb-1">{t('courseDetail.credits')}</p>
                  <p className="text-lg font-bold">{unit.ects} ECTS</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase font-black tracking-widest text-gray-500 mb-1">{t('courseDetail.location')}</p>
                  <p className="text-lg font-bold">Ano {unit.year} / Semestre {unit.semester}</p>
                </div>
                {unit.duration && (
                  <div>
                    <p className="text-[9px] uppercase font-black tracking-widest text-gray-500 mb-1">Duração</p>
                    <p className="text-lg font-bold">{unit.duration} horas</p>
                  </div>
                )}
                {unit.difficulty && (
                  <div>
                    <p className="text-[9px] uppercase font-black tracking-widest text-gray-500 mb-1">Dificuldade</p>
                    <p className="text-lg font-bold capitalize">{unit.difficulty}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Prerequisites */}
            {unit.prerequisites && unit.prerequisites.length > 0 && (
              <div className="stark-border p-8 bg-brand-muted">
                <p className="text-[9px] uppercase font-black tracking-[0.3em] mb-4 text-gray-400">{t('courseDetail.prerequisites')}</p>
                <div className="space-y-3">
                  {allUnits
                    .filter(u => unit.prerequisites?.includes(u.id))
                    .map(pre => (
                      <button 
                        key={pre.id}
                        onClick={() => onNavigate?.(pre.id)}
                        className="w-full text-left p-3 bg-white stark-border hover:bg-black hover:text-white transition-all group flex items-center justify-between"
                      >
                        <span className="text-[10px] font-bold uppercase truncate pr-4">{pre.name}</span>
                        <span className="material-symbols-outlined text-xs group-hover:translate-x-1 transition-transform">link</span>
                      </button>
                    ))}
                </div>
              </div>
            )}

            {/* Related Lessons */}
            {relatedUnits.length > 0 && (
              <div className="stark-border p-8 bg-brand-muted">
                <p className="text-[9px] uppercase font-black tracking-[0.3em] mb-4 text-gray-400">Outras unidades neste semestre</p>
                <div className="space-y-3">
                  {relatedUnits.map(related => (
                    <button 
                      key={related.id}
                      onClick={() => onNavigate?.(related.id)}
                      className="w-full text-left p-3 bg-white stark-border hover:bg-black hover:text-white transition-all group flex items-center justify-between text-xs"
                    >
                      <span className="font-bold uppercase truncate pr-4 group-hover:text-primary">{related.name}</span>
                      <span className="material-symbols-outlined text-xs group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Contributor Info */}
            {unit.contributor && (
              <div className="stark-border p-8 bg-brand-muted">
                <p className="text-[9px] uppercase font-black tracking-[0.3em] mb-4 text-gray-400">{t('courseDetail.curatorship')}</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center text-primary font-black text-xs stark-border">
                    {unit.contributor.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-black">{unit.contributor}</p>
                    <p className="text-[9px] text-gray-500 uppercase tracking-widest">Responsável</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default LessonDetail;
