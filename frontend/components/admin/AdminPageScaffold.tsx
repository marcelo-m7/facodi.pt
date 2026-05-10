import React from 'react';

interface AdminPageScaffoldProps {
  onBack: () => void;
  backLabel: string;
  isLoading: boolean;
  loadingLabel?: string;
  error?: string | null;
  notice?: React.ReactNode;
  children: React.ReactNode;
}

const AdminPageScaffold: React.FC<AdminPageScaffoldProps> = ({
  onBack,
  backLabel,
  isLoading,
  loadingLabel = 'A carregar...',
  error,
  notice,
  children,
}) => {
  return (
    <div className="max-w-[1600px] mx-auto px-6 lg:px-12 py-16 lg:py-24">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] mb-12 hover:text-primary transition-colors group"
      >
        <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform">arrow_back</span>
        {backLabel}
      </button>

      {notice}
      {error && <div className="stark-border p-4 bg-red-50 text-red-700 mb-6">{error}</div>}

      {isLoading ? (
        <div className="py-24 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-black border-t-primary animate-spin" aria-label={loadingLabel} />
        </div>
      ) : (
        children
      )}
    </div>
  );
};

export default AdminPageScaffold;
