import React from 'react';

interface PermissionDeniedProps {
  onBack?: () => void;
  requiredRole?: string;
}

const PermissionDenied: React.FC<PermissionDeniedProps> = ({ onBack, requiredRole }) => {
  return (
    <div className="max-w-[1600px] mx-auto px-6 lg:px-12 py-24 text-center">
      <span className="material-symbols-outlined text-6xl text-gray-200 mb-6 block">block</span>
      <h2 className="text-3xl font-black uppercase tracking-tighter mb-4">Acesso Negado</h2>
      <p className="text-gray-500 text-sm uppercase tracking-widest max-w-md mx-auto mb-4">
        Voce nao tem permissao para acessar esta area.
      </p>
      {requiredRole && (
        <p className="text-gray-400 text-xs uppercase tracking-widest max-w-md mx-auto mb-10">
          Esta pagina requer o perfil: <strong className="text-black">{requiredRole}</strong>
        </p>
      )}
      {onBack && (
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] mx-auto hover:text-primary transition-colors group"
        >
          <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform">arrow_back</span>
          Voltar ao Inicio
        </button>
      )}
    </div>
  );
};

export default PermissionDenied;
