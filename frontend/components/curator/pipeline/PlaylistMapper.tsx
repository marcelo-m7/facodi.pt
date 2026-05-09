import React from 'react';
import { PlaylistSuggestion } from '../../../services/channelCurationSource';

interface PlaylistMapperProps {
  suggestions: PlaylistSuggestion[];
}

const PlaylistMapper: React.FC<PlaylistMapperProps> = ({ suggestions }) => {
  return (
    <div className="facodi-card space-y-4">
      <h2 className="text-[10px] font-black uppercase tracking-[0.3em]">5. Mapeamento pedagógico sugerido</h2>
      {!suggestions.length ? (
        <div className="facodi-alert facodi-alert-info">Nenhuma sugestão de mapeamento gerada ainda.</div>
      ) : (
        <div className="space-y-3 max-h-[280px] overflow-y-auto pr-2">
          {suggestions.map((item) => (
            <div key={item.videoId} className="stark-border p-4 bg-white space-y-1">
              <div className="flex items-center gap-2">
                <p className="text-[11px] font-black uppercase tracking-widest">Vídeo: {item.videoId}</p>
                {item.isFallback && (
                  <span className="text-[9px] font-black uppercase tracking-widest bg-amber-100 text-amber-700 px-2 py-0.5 border border-amber-300">
                    fallback
                  </span>
                )}
              </div>
              <p className="text-sm">Curso: {item.courseId || 'N/A'}</p>
              <p className="text-sm">Unidade: {item.unitId || 'N/A'}</p>
              <p className="text-sm">Playlist: {item.playlistId || 'N/A'}</p>
              <p className="text-[11px] text-gray-500">Confiança: {(item.confidence * 100).toFixed(1)}%</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PlaylistMapper;
