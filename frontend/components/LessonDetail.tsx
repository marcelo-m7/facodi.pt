import React, { useState, useEffect } from 'react';
import { CurricularUnit, Playlist } from '../types';
import MarkdownView from './MarkdownView';
import { findPlaylistForUnit } from '../services/catalogSource';
import { usePlaylistVideos } from '../hooks/usePlaylistVideos';

interface Props {
  unit: CurricularUnit;
  allUnits: CurricularUnit[];
  playlists: Playlist[];
  courseTitle?: string;
  onBack: () => void;
  onNavigate?: (id: string) => void;
  t: (key: string) => string;
}

const LessonDetail: React.FC<Props> = ({ unit, allUnits, playlists, courseTitle, onBack, onNavigate, t }) => {
  const [fetchedContent, setFetchedContent] = useState<string | null>(null);
  const [contentLoading, setContentLoading] = useState(false);
  const [contentError, setContentError] = useState<string | null>(null);

  useEffect(() => {
    if (unit.contentUrl) {
      setContentLoading(true);
      setContentError(null);
      fetch(unit.contentUrl)
        .then(r => {
          if (!r.ok) throw new Error('Falha ao carregar conteúdo externo.');
          return r.text();
        })
        .then(text => setFetchedContent(text))
        .catch(err => setContentError(err instanceof Error ? err.message : 'Erro desconhecido'))
        .finally(() => setContentLoading(false));
    } else {
      setFetchedContent(null);
    }
  }, [unit.contentUrl, unit.id]);

  const displayContent = unit.content || fetchedContent;

  const getYouTubeEmbedUrl = (url: string): string | null => {
    const trimmed = url.trim();
    if (!trimmed) return null;

    if (trimmed.includes('youtube.com/embed/')) return trimmed;

    const watchMatch = trimmed.match(/[?&]v=([A-Za-z0-9_-]{6,})/);
    if (watchMatch?.[1]) return `https://www.youtube.com/embed/${watchMatch[1]}`;

    const shortMatch = trimmed.match(/youtu\.be\/([A-Za-z0-9_-]{6,})/);
    if (shortMatch?.[1]) return `https://www.youtube.com/embed/${shortMatch[1]}`;

    return null;
  };

  const renderVideoPlayer = () => {
    if (unit.videoUrl) {
      const embedUrl = getYouTubeEmbedUrl(unit.videoUrl);

      if (embedUrl) {
        return (
          <div className="aspect-video bg-gray-900 dark:bg-gray-950 rounded-lg overflow-hidden shadow-lg mb-12" data-testid="lesson-video-player">
            <iframe
              title={`Video: ${unit.name}`}
              src={embedUrl}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        );
      }

      return (
        <div className="aspect-video bg-gray-100 dark:bg-gray-900 rounded-lg mb-12 flex items-center justify-center border border-gray-200 dark:border-gray-800" data-testid="lesson-video-link-fallback">
          <div className="text-center">
            <span className="material-symbols-outlined text-5xl text-gray-400 dark:text-gray-600 mb-4">open_in_new</span>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Vídeo Externo</p>
            <a
              href={unit.videoUrl}
              target="_blank"
              rel="noreferrer"
              className="facodi-btn facodi-btn-primary"
            >
              Abrir vídeo
            </a>
          </div>
        </div>
      );
    }

    return (
      <div className="aspect-video bg-gradient-to-b from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-lg mb-12 flex items-center justify-center border border-gray-200 dark:border-gray-800" data-testid="lesson-video-placeholder">
        <div className="text-center">
          <span className="material-symbols-outlined text-5xl text-gray-300 dark:text-gray-700 mb-4">description</span>
          <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Conteúdo em texto</p>
        </div>
      </div>
    );
  };

    // Find playlist for this unit and load videos
    const playlist = findPlaylistForUnit(unit, playlists);
    const { videos, isLoading: videosLoading, error: videosError, selectedVideoIndex, setSelectedVideoIndex } = 
      usePlaylistVideos(playlist?.id || null);

    const renderPlaylistVideos = () => {
      if (!playlist || videos.length === 0) {
        if (videosError) {
          return (
            <div className="facodi-alert facodi-alert-error mb-12">
              <p className="font-bold">{t('videoState.error')}</p>
              <p className="text-sm mt-2">{videosError.message}</p>
            </div>
          );
        }
        if (videosLoading) {
          return (
            <div className="facodi-spinner mx-auto mb-12"></div>
          );
        }
        return null;
      }

      const selectedVideo = videos[selectedVideoIndex];
      if (!selectedVideo) return null;

      return (
        <div className="mb-16">
          <h3 className="facodi-label mb-6">{t('courseDetail.unitVideos')}</h3>
        
          {/* Player */}
          <div className="aspect-video bg-gray-900 dark:bg-gray-950 rounded-lg overflow-hidden shadow-lg mb-8">
            <iframe
              key={selectedVideo.youtubeId}
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${selectedVideo.youtubeId}`}
              title={selectedVideo.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>

          {/* Video Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
            {videos.map((video, idx) => (
              <button
                key={video.id}
                onClick={() => setSelectedVideoIndex(idx)}
                className={`aspect-video rounded overflow-hidden border-2 transition-all ${
                  idx === selectedVideoIndex 
                    ? 'border-primary bg-yellow-100' 
                    : 'border-gray-300 hover:border-primary'
                }`}
              >
                <img 
                  src={video.thumbnailUrl} 
                  alt={video.title}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>

          {/* Info */}
          <div className="text-xs text-gray-600">
            <p className="font-bold">{selectedVideo.title}</p>
            <p className="text-gray-500 mt-1">{selectedVideo.channelName}</p>
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

            {/* Playlist Videos */}
            {renderPlaylistVideos()}

          {/* Lesson Title & Metadata */}
          <div className="mb-16">
            <span className="text-[10px] font-black bg-primary text-black px-3 py-1.5 uppercase tracking-[0.2em] mb-6 inline-block">
              {unit.courseId}
            </span>
            {courseTitle && (
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4">{courseTitle}</p>
            )}
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
          {contentLoading && (
            <div className="stark-border p-8 bg-gray-50 mb-16 text-sm text-gray-500 uppercase tracking-widest font-bold">
              A carregar conteúdo...
            </div>
          )}
          {contentError && (
            <div className="stark-border p-8 bg-red-50 mb-16 text-sm text-red-700">
              {contentError}
            </div>
          )}
          {displayContent && !contentLoading && (
            <div className="stark-border p-8 bg-white mb-16">
              <h2 className="text-2xl font-black uppercase tracking-tighter mb-8">Conteúdo Detalhado</h2>
              <MarkdownView content={displayContent} />
            </div>
          )}
        </main>

        {/* Sidebar */}
        <aside className="w-full lg:w-96 shrink-0">
          <div className="sticky top-20 md:top-24 space-y-8">
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
                <div>
                  <p className="text-[9px] uppercase font-black tracking-widest text-gray-500 mb-1">{t('lessonDetail.category')}</p>
                  <p className="text-sm font-bold">{unit.category}</p>
                </div>
                {unit.sectionName && (
                  <div>
                    <p className="text-[9px] uppercase font-black tracking-widest text-gray-500 mb-1">{t('lessonDetail.section')}</p>
                    <p className="text-sm font-bold">{unit.sectionName}</p>
                  </div>
                )}
                {unit.unitCode && (
                  <div>
                    <p className="text-[9px] uppercase font-black tracking-widest text-gray-500 mb-1">{t('lessonDetail.unitCode')}</p>
                    <p className="text-sm font-mono">{unit.unitCode}</p>
                  </div>
                )}
              </div>
            </div>

            {/* External Links Card */}
            {(unit.websiteUrl || unit.syllabusUrl) && (
              <div className="stark-border p-8 bg-brand-muted">
                <p className="text-[9px] uppercase font-black tracking-[0.3em] mb-4 text-gray-400">{t('lessonDetail.links')}</p>
                <div className="space-y-3">
                  {unit.websiteUrl && (
                    <a
                      href={unit.websiteUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between w-full p-3 bg-white stark-border hover:bg-black hover:text-white transition-all group text-xs font-bold uppercase"
                    >
                      <span className="truncate pr-2">{t('lessonDetail.officialSite')}</span>
                      <span className="material-symbols-outlined text-xs group-hover:translate-x-1 transition-transform">open_in_new</span>
                    </a>
                  )}
                  {unit.syllabusUrl && (
                    <a
                      href={unit.syllabusUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between w-full p-3 bg-white stark-border hover:bg-black hover:text-white transition-all group text-xs font-bold uppercase"
                    >
                      <span className="truncate pr-2">{t('lessonDetail.syllabus')}</span>
                      <span className="material-symbols-outlined text-xs group-hover:translate-x-1 transition-transform">description</span>
                    </a>
                  )}
                </div>
              </div>
            )}

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
