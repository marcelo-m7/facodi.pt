import React from 'react';
import { ChannelVideo } from '../../../services/channelCurationSource';

interface VideoDiscoveryPanelProps {
  videos: ChannelVideo[];
  selectedIds: string[];
  loading: boolean;
  error: string | null;
  onLoad: () => void;
  onToggle: (id: string) => void;
}

const VideoDiscoveryPanel: React.FC<VideoDiscoveryPanelProps> = ({
  videos,
  selectedIds,
  loading,
  error,
  onLoad,
  onToggle,
}) => {
  return (
    <div className="facodi-card space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-[10px] font-black uppercase tracking-[0.3em]">3. Descobrir e selecionar vídeos</h2>
        <button
          type="button"
          onClick={onLoad}
          disabled={loading}
          className="stark-border px-4 py-2 text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
        >
          {loading ? 'Buscando...' : 'Buscar vídeos'}
        </button>
      </div>
      {error && <div className="facodi-alert facodi-alert-error">{error}</div>}
      {!videos.length && !loading && <div className="facodi-alert facodi-alert-info">Nenhum vídeo carregado ainda.</div>}
      <div className="space-y-3 max-h-[420px] overflow-y-auto pr-2">
        {videos.map((video) => {
          const isSelected = selectedIds.includes(video.id);
          return (
            <label key={video.id} className={`block stark-border p-4 cursor-pointer ${isSelected ? 'bg-brand-muted' : 'bg-white'}`}>
              <div className="flex gap-3 items-start">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggle(video.id)}
                  className="mt-1"
                />
                <div className="space-y-1">
                  <p className="text-sm font-black leading-tight">{video.title}</p>
                  <p className="text-[11px] text-gray-500">{video.channelTitle || 'Canal não informado'}</p>
                  {video.publishedAt && <p className="text-[10px] text-gray-400">Publicado em {new Date(video.publishedAt).toLocaleDateString('pt-BR')}</p>}
                </div>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
};

export default VideoDiscoveryPanel;
