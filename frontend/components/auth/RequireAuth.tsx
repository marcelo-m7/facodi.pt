import React, { useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface RequireAuthProps {
  children: React.ReactNode;
  onOpenAuth?: () => void;
}

const RequireAuth: React.FC<RequireAuthProps> = ({ children, onOpenAuth }) => {
  const { user, isLoading } = useAuth();
  const didAutoOpenRef = useRef(false);

  useEffect(() => {
    if (!isLoading && !user && onOpenAuth && !didAutoOpenRef.current) {
      didAutoOpenRef.current = true;
      onOpenAuth();
    }
  }, [isLoading, user, onOpenAuth]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-black border-t-primary animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12 py-24 text-center">
        <span className="material-symbols-outlined text-6xl text-gray-200 mb-6 block">lock</span>
        <h2 className="text-3xl font-black uppercase tracking-tighter mb-4">Acesso Restrito</h2>
        <p className="text-gray-500 text-sm uppercase tracking-widest max-w-md mx-auto mb-10">
          Voce precisa estar autenticado para acessar esta pagina.
        </p>
        {onOpenAuth && (
          <button
            onClick={onOpenAuth}
            className="facodi-primary-surface px-8 py-4 text-[10px] font-black uppercase tracking-widest stark-border hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
          >
            Entrar / Criar Conta
          </button>
        )}
      </div>
    );
  }

  return <>{children}</>;
};

export default RequireAuth;
