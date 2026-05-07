import React from 'react';

type Props = {
  youtubeId?: string;
  title: string;
};

const YouTubePlayer: React.FC<Props> = ({ youtubeId, title }) => {
  if (!youtubeId) {
    return (
      <div className="aspect-video bg-gradient-to-b from-gray-100 to-white stark-border mb-8 flex items-center justify-center" data-testid="video-player-placeholder">
        <div className="text-center">
          <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">ondemand_video</span>
          <p className="text-sm text-gray-400 uppercase tracking-widest font-bold">Sem vídeo disponível</p>
        </div>
      </div>
    );
  }

  return (
    <div className="aspect-video bg-black stark-border mb-8 overflow-hidden" data-testid="video-player">
      <iframe
        title={title}
        src={`https://www.youtube.com/embed/${youtubeId}`}
        className="w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
};

export default YouTubePlayer;
