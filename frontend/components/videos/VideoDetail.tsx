import React, { useEffect, useState } from 'react';
import { VideoItem } from '../../types';
import { getPublicVideoById, listPlaylistVideos, listRelatedVideos } from '../../services/videoSource';
import VideoCard from './VideoCard';
import VideoState from './VideoState';
import YouTubePlayer from './YouTubePlayer';

type Props = {
  videoId: string;
  onBack: () => void;
  onSelectVideo: (id: string) => void;
  t: (key: string) => string;
};

const VideoDetail: React.FC<Props> = ({ videoId, onBack, onSelectVideo, t }) => {
  const [video, setVideo] = useState<VideoItem | null>(null);
  const [related, setRelated] = useState<VideoItem[]>([]);
  const [playlistVideos, setPlaylistVideos] = useState<VideoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setIsLoading(true);

    getPublicVideoById(videoId)
      .then(async (detail) => {
        if (!active) return;
        if (!detail) {
          setVideo(null);
          setRelated([]);
          setPlaylistVideos([]);
          setError(t('videos.empty'));
          return;
        }

        setVideo(detail);

        const [relatedVideos, nextPlaylist] = await Promise.all([
          listRelatedVideos(detail, 4),
          detail.playlistId ? listPlaylistVideos(detail.playlistId) : Promise.resolve([]),
        ]);

        if (!active) return;
        setRelated(relatedVideos.filter((item) => item.id !== detail.id));
        setPlaylistVideos(nextPlaylist.filter((item) => item.id !== detail.id).slice(0, 4));
        setError(null);
      })
      .catch((fetchError) => {
        if (!active) return;
        setVideo(null);
        setRelated([]);
        setPlaylistVideos([]);
        setError(fetchError instanceof Error ? fetchError.message : t('videos.error'));
      })
      .finally(() => {
        if (!active) return;
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [videoId, t]);

  if (isLoading) {
    return (
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12 py-16 lg:py-24">
        <VideoState type="loading" title={t('videos.loading')} />
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12 py-16 lg:py-24">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] mb-12 hover:text-primary transition-colors group"
        >
          <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform">arrow_back</span>
          {t('videos.back')}
        </button>
        <VideoState type="error" title={t('videos.error')} message={error || t('videos.empty')} />
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto px-6 lg:px-12 py-16 lg:py-24">
      <button
        onClick={onBack}
        className="facodi-nav-link mb-12 flex items-center gap-2"
      >
        <span className="material-symbols-outlined text-sm">arrow_back</span>
        {t('videos.back')}
      </button>

      <div className="flex flex-col lg:flex-row gap-16 lg:gap-24">
        <main className="flex-1">
          <YouTubePlayer youtubeId={video.youtubeId} title={video.title} />

          <div className="mb-10">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight mb-6">
              {video.title}
            </h1>

            <div className="flex flex-wrap gap-3 mb-6">
              <span className="facodi-badge facodi-badge-neon">
                YouTube
              </span>
              {video.category?.name && (
                <span className="facodi-badge facodi-badge-secondary">
                  {video.category.name}
                </span>
              )}
              {video.playlistName && (
                <span className="facodi-badge facodi-badge-secondary">
                  {t('videos.upNext')}: {video.playlistName}
                </span>
              )}
            </div>

            <p className="text-sm lg:text-base text-gray-600 mb-4">{video.channelName}</p>
            <p className="text-base leading-relaxed text-gray-700 whitespace-pre-wrap">{video.description || 'Sem descrição disponível.'}</p>

            <a
              href={`https://www.youtube.com/watch?v=${video.youtubeId}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 mt-6 facodi-btn facodi-btn-primary"
            >
              <span className="material-symbols-outlined text-base">open_in_new</span>
              {t('videos.open')}
            </a>
          </div>
        </main>

        <aside className="w-full lg:w-[420px] shrink-0 space-y-10">
          {related.length > 0 && (
            <section>
              <h2 className="text-xl lg:text-2xl font-black tracking-tight mb-6">{t('videos.related')}</h2>
              <div className="space-y-4">
                {related.map((item) => (
                  <VideoCard key={item.id} video={item} onSelect={onSelectVideo} />
                ))}
              </div>
            </section>
          )}

          {playlistVideos.length > 0 && (
            <section>
              <h2 className="text-xl lg:text-2xl font-black tracking-tight mb-6">{t('videos.upNext')}</h2>
              <div className="space-y-4">
                {playlistVideos.map((item) => (
                  <VideoCard key={item.id} video={item} onSelect={onSelectVideo} />
                ))}
              </div>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
};

export default VideoDetail;
