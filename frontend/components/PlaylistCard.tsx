
import React from 'react';
import { Playlist } from '../types';

interface Props {
  playlist: Playlist;
  onSelect: (id: string) => void;
}

const PlaylistCard: React.FC<Props> = ({ playlist, onSelect }) => {
  return (
    <div className="stark-border facodi-card-interactive bg-white group transition-all duration-300 overflow-hidden shadow-[0_2px_0_rgba(0,0,0,0.08)] hover:shadow-[0_12px_28px_rgba(0,0,0,0.14)]">
      <div className="p-8">
        <div className="flex justify-between items-center mb-10">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] facodi-primary-surface px-3 py-1.5 stark-border">
            Playlist
          </span>
          <span className="text-[10px] font-bold text-gray-500 group-hover:text-black transition-colors uppercase">
            {playlist.units.length} Modules
          </span>
        </div>
        
        <h3 className="text-3xl font-black tracking-tighter mb-4 group-hover:text-black transition-colors">
          {playlist.title}
        </h3>
        <p className="text-sm font-medium text-gray-500 group-hover:text-gray-600 transition-colors mb-12 line-clamp-2">
          {playlist.description}
        </p>
        
        <div className="flex items-center gap-6 pt-8 border-t border-black/10 group-hover:border-black/20">
          <div>
            <p className="text-[9px] font-black uppercase text-gray-400 mb-1">Estimated</p>
            <p className="text-xs font-bold uppercase group-hover:text-black transition-colors">{playlist.estimatedHours}h</p>
          </div>
          <div className="ml-auto">
            <button
              onClick={() => onSelect(playlist.id)}
              className="bg-black text-white group-hover:bg-primary group-hover:text-black px-6 py-3 text-[10px] font-black uppercase tracking-widest transition-all"
            >
              View Track
            </button>
          </div>
        </div>
      </div>
      <div className="h-2 w-0 group-hover:w-full bg-primary transition-all duration-700"></div>
    </div>
  );
};

export default PlaylistCard;
