import React from 'react';
import { CurationBrief } from '../../../services/channelCurationSource';

interface CurationBriefPanelProps {
  brief: CurationBrief;
  onChange: (next: CurationBrief) => void;
}

const CurationBriefPanel: React.FC<CurationBriefPanelProps> = ({ brief, onChange }) => {
  return (
    <div className="facodi-card space-y-4">
      <h2 className="text-[10px] font-black uppercase tracking-[0.3em]">2. Definir critérios de curadoria</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="facodi-label" htmlFor="min-duration">Duração mínima (min)</label>
          <input
            id="min-duration"
            type="number"
            min={0}
            className="facodi-input"
            value={brief.minDurationMinutes ?? ''}
            onChange={(event) => onChange({ ...brief, minDurationMinutes: Number(event.target.value) || undefined })}
          />
        </div>
        <div>
          <label className="facodi-label" htmlFor="max-duration">Duração máxima (min)</label>
          <input
            id="max-duration"
            type="number"
            min={0}
            className="facodi-input"
            value={brief.maxDurationMinutes ?? ''}
            onChange={(event) => onChange({ ...brief, maxDurationMinutes: Number(event.target.value) || undefined })}
          />
        </div>
        <div>
          <label className="facodi-label" htmlFor="language-filter">Idioma</label>
          <input
            id="language-filter"
            className="facodi-input"
            placeholder="pt, en, es..."
            value={brief.language ?? ''}
            onChange={(event) => onChange({ ...brief, language: event.target.value || undefined })}
          />
        </div>
        <div>
          <label className="facodi-label" htmlFor="max-videos">Máximo de vídeos</label>
          <input
            id="max-videos"
            type="number"
            min={1}
            className="facodi-input"
            value={brief.maxVideos ?? 30}
            onChange={(event) => onChange({ ...brief, maxVideos: Number(event.target.value) || 30 })}
          />
        </div>
      </div>
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={brief.includeShorts ?? false}
          onChange={(event) => onChange({ ...brief, includeShorts: event.target.checked })}
          className="w-5 h-5 border border-black cursor-pointer accent-yellow-400"
        />
        <span className="facodi-label m-0">Incluir Shorts</span>
      </label>
    </div>
  );
};

export default CurationBriefPanel;
