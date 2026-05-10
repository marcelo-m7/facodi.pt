
import React, { useState, useEffect } from 'react';
import { CurricularUnit, Playlist, VideoItem } from '../types';
import MarkdownView from './MarkdownView';
import { findPlaylistForUnit } from '../services/catalogSource';
import { usePlaylistVideos } from '../hooks/usePlaylistVideos';
import VideoCard from './videos/VideoCard';
import YouTubePlayer from './videos/YouTubePlayer';
import VideoState from './videos/VideoState';

interface Props {
  unit: CurricularUnit;
  allUnits: CurricularUnit[];
  playlists: Playlist[];
  courseTitle?: string;
  onBack: () => void;
  onNavigate?: (id: string) => void;
  t: (key: string) => string;
}

const CourseDetail: React.FC<Props> = ({ unit, allUnits, playlists, courseTitle, onBack, onNavigate, t }) => {
  const [fetchedContent, setFetchedContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContent = async () => {
      if (unit.contentUrl) {
        setIsLoading(true);
        setError(null);
        try {
          const response = await fetch(unit.contentUrl);
          if (!response.ok) throw new Error('Falha ao carregar conteúdo externo.');
          const text = await response.text();
          setFetchedContent(text);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Erro desconhecido');
        } finally {
          setIsLoading(false);
        }
      } else {
        setFetchedContent(null);
      }
    };

    fetchContent();
  }, [unit.contentUrl, unit.id]);

  // Find playlist for this unit
  const playlist = findPlaylistForUnit(unit, playlists);
  
  // Load videos for playlist
  const { videos, isLoading: videosLoading, error: videosError, selectedVideoIndex, setSelectedVideoIndex } = 
    usePlaylistVideos(playlist?.id || null);

  const displayContent = unit.content || fetchedContent;
  const prerequisiteUnits = unit.prerequisites 
    ? allUnits.filter(u => unit.prerequisites?.includes(u.id))
    : [];

  return (
    <div className="max-w-[1600px] mx-auto px-6 lg:px-12 py-16 lg:py-24">
      <button 
        onClick={onBack}
        className="facodi-nav-link mb-12 hover:facodi-nav-link-active flex items-center gap-2"
      >
        <span className="material-symbols-outlined text-sm">arrow_back</span>
        {t('courseDetail.back')}
      </button>

      <div className="flex flex-col lg:flex-row gap-16 lg:gap-32">
        <aside className="w-full lg:w-80 shrink-0">
          <div className="sticky top-20 md:top-24">
            <div className="facodi-card-elevated p-8 mb-8 border-l-4 border-primary">
              <span className="facodi-badge facodi-badge-neon mb-6 inline-block">
                {unit.id}
              </span>
              {courseTitle && (
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 dark:text-gray-400 mb-4">{courseTitle}</p>
              )}
              <h1 className="text-3xl lg:text-4xl font-black tracking-tight leading-tight mb-8">
                {unit.name}
              </h1>
              <div className="space-y-4 pt-8 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] uppercase font-bold tracking-widest text-gray-600 dark:text-gray-400">{t('courseDetail.credits')}</span>
                  <span className="text-sm font-bold text-black dark:text-white">{unit.ects} ECTS</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[9px] uppercase font-bold tracking-widest text-gray-600 dark:text-gray-400">{t('courseDetail.location')}</span>
                  <span className="text-sm font-bold text-black dark:text-white">Y{unit.year} / S{unit.semester}</span>
                </div>
              </div>
            </div>

            {prerequisiteUnits.length > 0 && (
              <div className="facodi-card mb-8">
                <p className="text-[9px] uppercase font-bold tracking-[0.3em] mb-4 text-gray-600 dark:text-gray-400">{t('courseDetail.prerequisites')}</p>
                <div className="space-y-3">
                  {prerequisiteUnits.map(pre => (
                    <button 
                      key={pre.id}
                      onClick={() => onNavigate?.(pre.id)}
                      className="w-full text-left p-3 facodi-card-interactive border border-gray-200 dark:border-gray-700 transition-all group flex items-center justify-between"
                    >
                      <span className="text-[10px] font-bold uppercase truncate pr-4">{pre.name}</span>
                      <span className="material-symbols-outlined text-xs group-hover:translate-x-1 transition-transform">link</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="facodi-card">
              <p className="text-[9px] uppercase font-bold tracking-[0.3em] mb-4 text-gray-600 dark:text-gray-400">{t('courseDetail.curatorship')}</p>
              <div className="flex items-center gap-4 mb-8">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-black font-black text-xs border border-gray-200 dark:border-gray-700">
                  {unit.contributor.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-bold">{unit.contributor}</p>
                  <p className="text-[10px] text-gray-600 dark:text-gray-400 uppercase font-bold">FACODI Guild</p>
                </div>
              </div>
              <button className="w-full facodi-btn facodi-btn-primary">
                {t('courseDetail.download')}
              </button>
            </div>
          </div>
        </aside>

        <section className="flex-1 min-w-0">
          {isLoading ? (
            <div className="py-24 text-center">
              <div className="facodi-spinner mx-auto mb-8"></div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Descodificando Materiais...</p>
            </div>
          ) : error ? (
            <div className="stark-border bg-red-50 p-12 lg:p-24 text-center border-red-200">
              <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-700 mb-6">cloud_off</span>
              <h2 className="text-2xl font-black tracking-tight mb-4 text-gray-800 dark:text-gray-200">Falha na Rede</h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium uppercase tracking-widest max-w-md mx-auto leading-relaxed">
                {error}
              </p>
              <button onClick={() => window.location.reload()} className="mt-8 facodi-btn facodi-btn-primary">Sincronizar</button>
            </div>
          ) : displayContent ? (
            <MarkdownView content={displayContent} />
          ) : (
            <div className="facodi-card text-center">
              <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-700 mb-6 inline-block">edit_document</span>
              <h2 className="text-2xl font-black tracking-tight mb-4">Construção em Curso</h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium uppercase tracking-widest max-w-md mx-auto leading-relaxed">
                {unit.description}
                <br /><br />
                O programa detalhado para esta unidade está a ser curado pela comunidade. Contribua no GitHub para acelerar o processo.
              </p>
            </div>
          )}
          
          <div className="mt-24 pt-16 border-t border-gray-200 dark:border-gray-800">
            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] mb-8 text-gray-600 dark:text-gray-400">{t('courseDetail.related')}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="facodi-card-interactive h-48 flex flex-col justify-between">
                <div>
                  <p className="text-[9px] font-black mb-2 opacity-60 uppercase tracking-widest">Nó de Conhecimento</p>
                  <p className="text-xl font-black tracking-tight leading-none">{t('courseDetail.relatedExercises')}</p>
                </div>
                <span className="material-symbols-outlined text-2xl group-hover:translate-x-2 transition-transform self-end">arrow_right_alt</span>
              </div>

              {/* Videos Section - REPLACES Recurso Externo Card */}
              <div>
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] mb-6 text-gray-400">{t('courseDetail.unitVideos')}</h2>
                
                {videosLoading && (
                  <VideoState 
                    type="loading" 
                    title={t('videoState.loading')}
                  />
                )}
                {videosError && (
                  <VideoState 
                    type="error" 
                    title={t('videoState.error')}
                    message={videosError.message}
                  />
                )}
                
                {!videosLoading && !videosError && videos.length === 0 && (
                  <VideoState 
                    type="empty" 
                    title={t('videoState.empty')}
                    message={t('courseDetail.noVideos')}
                  />
                )}
                
                {!videosLoading && videos.length > 0 && (
                  <div className="space-y-6">
                    {/* Player for selected video */}
                    <div className="stark-border bg-black p-4">
                      <YouTubePlayer 
                        youtubeId={videos[selectedVideoIndex]?.youtubeId} 
                        title={videos[selectedVideoIndex]?.title || 'Video'} 
                      />
                    </div>
                    
                    {/* Video list */}
                    {videos.length > 1 && (
                      <div className="grid grid-cols-2 gap-4">
                        {videos.map((video, idx) => (
                          <button
                            key={video.id}
                            onClick={() => setSelectedVideoIndex(idx)}
                            className={`transition-all ${
                              idx === selectedVideoIndex
                                ? 'ring-2 ring-primary'
                                : 'hover:opacity-80'
                            }`}
                          >
                            <VideoCard
                              video={video}
                              onSelect={() => setSelectedVideoIndex(idx)}
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default CourseDetail;
