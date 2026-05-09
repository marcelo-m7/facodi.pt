import React from 'react';

interface EditorialReviewPanelProps {
  selectedCount: number;
  publishing: boolean;
  error: string | null;
  successMessage: string | null;
  onPublish: () => void;
}

const EditorialReviewPanel: React.FC<EditorialReviewPanelProps> = ({
  selectedCount,
  publishing,
  error,
  successMessage,
  onPublish,
}) => {
  return (
    <div className="facodi-card space-y-4">
      <h2 className="text-[10px] font-black uppercase tracking-[0.3em]">6. Revisão editorial e publicação</h2>
      <p className="text-sm text-gray-700">
        {selectedCount} vídeo(s) selecionado(s) para publicação no fluxo atual de submissão.
      </p>
      {error && <div className="facodi-alert facodi-alert-error">{error}</div>}
      {successMessage && <div className="facodi-alert facodi-alert-success">{successMessage}</div>}
      <button
        type="button"
        onClick={onPublish}
        disabled={publishing || selectedCount === 0}
        className="bg-primary text-black px-5 py-3 text-[10px] font-black uppercase tracking-widest stark-border disabled:opacity-50"
      >
        {publishing ? 'Publicando...' : 'Publicar no pipeline atual'}
      </button>
    </div>
  );
};

export default EditorialReviewPanel;
