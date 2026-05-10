import React from 'react';
import { getStudentPageState } from './studentPageState';

interface StudentPageScaffoldProps {
  onBack: () => void;
  isAuthenticated: boolean;
  authMessage: string;
  isLoading: boolean;
  loadingMessage: string;
  error: string | null;
  errorTitle: string;
  children: React.ReactNode;
}

const StudentPageScaffold: React.FC<StudentPageScaffoldProps> = ({
  onBack,
  isAuthenticated,
  authMessage,
  isLoading,
  loadingMessage,
  error,
  errorTitle,
  children,
}) => {
  const state = getStudentPageState(isAuthenticated, isLoading, error);

  const backButton = (
    <button
      type="button"
      onClick={onBack}
      className="mb-8 flex items-center gap-2 text-xs uppercase tracking-widest font-bold hover:opacity-70 transition-opacity"
    >
      <span className="material-symbols-outlined text-lg">arrow_back</span>
      Voltar
    </button>
  );

  if (state === 'unauthenticated') {
    return (
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12 py-16 lg:py-24">
        {backButton}
        <div className="stark-border bg-brand-muted p-8">
          <p className="text-sm font-semibold">{authMessage}</p>
        </div>
      </div>
    );
  }

  if (state === 'loading') {
    return (
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12 py-16 lg:py-24">
        {backButton}
        <div className="stark-border bg-brand-muted p-6 text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-3">
          <span className="material-symbols-outlined animate-pulse">hourglass_top</span>
          {loadingMessage}
        </div>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12 py-16 lg:py-24">
        {backButton}
        <div className="stark-border bg-red-50 dark:bg-red-900 p-6 text-sm text-red-700 dark:text-red-200">
          <p className="font-semibold mb-2">{errorTitle}</p>
          <p className="text-xs">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto px-6 lg:px-12 py-16 lg:py-24">
      {backButton}
      {children}
    </div>
  );
};

export default StudentPageScaffold;
