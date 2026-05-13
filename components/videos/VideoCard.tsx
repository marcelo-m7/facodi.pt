import React from 'react';
import { VideoItem } from '../../types';

type Props = {
  video: VideoItem;
  onSelect: (id: string) => void;
};

const VideoCard: React.FC<Props> = ({ video, onSelect }) => {
  return (
    <button
      onClick={() => onSelect(video.id)}
      className="stark-border bg-white text-left group hover:bg-black transition-all duration-500 overflow-hidden"
      data-testid="video-card"
    >
      <div className="aspect-video bg-brand-muted overflow-hidden">
        <img
          src={video.thumbnailUrl}
          alt={video.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
      </div>
      <div className="p-6">
        <div className="flex justify-between items-start gap-4 mb-4">
          <span className="text-[9px] font-black uppercase tracking-[0.3em] bg-primary text-black px-3 py-1.5 stark-border">
            YouTube
          </span>
          {video.category?.name && (
            <span className="text-[9px] font-bold text-gray-400 group-hover:text-primary uppercase">
              {video.category.name}
            </span>
          )}
        </div>

        <h3 className="text-xl font-black uppercase tracking-tight mb-2 line-clamp-2 group-hover:text-white transition-colors">
          {video.title}
        </h3>

        <p className="text-xs text-gray-500 group-hover:text-gray-300 mb-6 line-clamp-2">
          {video.description || video.channelName}
        </p>

        <div className="flex items-center justify-between border-t border-black/10 group-hover:border-white/20 pt-4">
          <p className="text-[10px] uppercase tracking-widest font-bold text-gray-500 group-hover:text-gray-300">
            {video.channelName}
          </p>
          <span className="material-symbols-outlined group-hover:text-primary transition-colors">play_circle</span>
        </div>
      </div>
      <div className="h-2 w-0 group-hover:w-full bg-primary transition-all duration-700"></div>
    </button>
  );
};

export default VideoCard;
