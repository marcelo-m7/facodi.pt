import React from 'react';
import { VideoAnalysis } from '../../../services/channelCurationSource';

interface AIAnalysisPanelProps {
  analyses: VideoAnalysis[];
  loading: boolean;
  error: string | null;
  onAnalyze: () => void;
}

const AIAnalysisPanel: React.FC<AIAnalysisPanelProps> = ({ analyses, loading, error, onAnalyze }) => {
  return (
    <div className="facodi-card space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-[10px] font-black uppercase tracking-[0.3em]">4. Análise com IA</h2>
        <button
          type="button"
          onClick={onAnalyze}
          disabled={loading}
          className="bg-black text-white px-4 py-2 text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
        >
          {loading ? 'Analisando...' : 'Executar análise'}
        </button>
      </div>
      {error && <div className="facodi-alert facodi-alert-warning">{error}</div>}
      {!analyses.length && !loading && (
        <div className="facodi-alert facodi-alert-info">
          Sem análises ainda. Se a IA falhar, você pode continuar com revisão manual.
        </div>
      )}
      <div className="space-y-3 max-h-[320px] overflow-y-auto pr-2">
        {analyses.map((item) => (
          <article key={item.videoId} className="stark-border p-4 bg-white space-y-2">
            <p className="text-xs font-black uppercase tracking-widest">{item.topic}</p>
            <p className="text-sm text-gray-700">{item.summary}</p>
            <p className="text-[11px] text-gray-500">Dificuldade: {item.difficulty}</p>
            {!!item.tags.length && <p className="text-[11px] text-gray-500">Tags: {item.tags.join(', ')}</p>}
          </article>
        ))}
      </div>
    </div>
  );
};

export default AIAnalysisPanel;
