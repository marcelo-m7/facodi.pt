import React from 'react';

interface DevelopmentBadgeProps {
  label: string;
  onClick: () => void;
}

const DevelopmentBadge: React.FC<DevelopmentBadgeProps> = ({ label, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed bottom-4 left-4 z-[120] bg-white stark-border px-3 py-2 text-[9px] font-black uppercase tracking-widest text-gray-700 hover:bg-primary hover:text-black transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
      aria-label={label}
      title={label}
    >
      <span className="inline-flex items-center gap-2">
        <span className="w-2 h-2 bg-primary stark-border rounded-full" aria-hidden="true" />
        {label}
      </span>
    </button>
  );
};

export default DevelopmentBadge;
