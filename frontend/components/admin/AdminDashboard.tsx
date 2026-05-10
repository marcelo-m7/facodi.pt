import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getSubmissionCountByStatus } from '../../services/contentSubmissionSource';
import { listApplications } from '../../services/curatorApplicationSource';
import PermissionDenied from '../auth/PermissionDenied';

interface AdminDashboardProps {
  onBack: () => void;
  onNavigate: (view: 'admin-contents' | 'admin-curators' | 'curator-admin-review') => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack, onNavigate }) => {
  const { profile } = useAuth();
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [pendingApplications, setPendingApplications] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const [statusCounts, { total }] = await Promise.all([
          getSubmissionCountByStatus(),
          listApplications('pending', 1, 0),
        ]);
        setCounts(statusCounts);
        setPendingApplications(total);
      } catch (err) {
        console.error('[admin-dashboard] load error', err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  if (profile?.role !== 'admin') {
    return <PermissionDenied onBack={onBack} requiredRole="Administrador" />;
  }

  const pending = counts.pending || 0;
  const inReview = counts.in_review || 0;
  const needsChanges = counts.needs_changes || 0;
  const approved = counts.approved || 0;
  const alertCount = pending + inReview + needsChanges + pendingApplications;

  return (
    <div className="max-w-[1600px] mx-auto px-6 lg:px-12 py-16 lg:py-24">
      <button
        onClick={onBack}
        className="facodi-nav-link mb-12 flex items-center gap-2"
      >
        <span className="material-symbols-outlined text-sm">arrow_back</span>
        Voltar
      </button>

      <div className="mb-16">
        <span className="facodi-badge facodi-badge-neon mb-6 inline-block">
          Administracao
        </span>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black tracking-tight leading-[0.95] mb-8">Painel Administrativo</h1>
        {alertCount > 0 && (
          <div className="facodi-alert facodi-alert-warning inline-flex items-center gap-3">
            <span className="material-symbols-outlined">warning</span>
            <p className="font-semibold">
              {alertCount} {alertCount === 1 ? 'item aguardando' : 'itens aguardando'} acao
            </p>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="py-24 flex items-center justify-center">
          <div className="facodi-spinner"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            <div className="facodi-card">
              <p className="text-[9px] uppercase font-bold tracking-[0.3em] mb-4 text-gray-600 dark:text-gray-400">Pendentes</p>
              <p className="text-5xl font-black">{pending}</p>
            </div>
            <div className="facodi-card">
              <p className="text-[9px] uppercase font-bold tracking-[0.3em] mb-4 text-gray-600 dark:text-gray-400">Em Revisao</p>
              <p className="text-5xl font-black">{inReview}</p>
            </div>
            <div className="facodi-card">
              <p className="text-[9px] uppercase font-bold tracking-[0.3em] mb-4 text-gray-600 dark:text-gray-400">Aprovados</p>
              <p className="text-5xl font-black">{approved}</p>
            </div>
            <div className="facodi-card-elevated">
              <p className="text-[9px] uppercase font-bold tracking-[0.3em] mb-4 text-gray-600 dark:text-gray-400">Curadores</p>
              <p className="text-5xl font-black text-primary">{pendingApplications}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <button
              onClick={() => onNavigate('admin-contents')}
              className="facodi-card facodi-card-interactive transition-all text-left group"
            >
              <span className="material-symbols-outlined text-3xl mb-4 block text-primary group-hover:translate-y-[-4px] transition-transform">article</span>
              <p className="text-[9px] uppercase font-bold tracking-[0.3em] mb-2 text-gray-600 dark:text-gray-400">Moderacao</p>
              <p className="text-lg font-bold">Revisao de Conteudos</p>
            </button>

            <button
              onClick={() => onNavigate('admin-curators')}
              className="facodi-card facodi-card-interactive transition-all text-left group"
            >
              <span className="material-symbols-outlined text-3xl mb-4 block text-primary group-hover:translate-y-[-4px] transition-transform">person_add</span>
              <p className="text-[9px] uppercase font-bold tracking-[0.3em] mb-2 text-gray-600 dark:text-gray-400">Curadoria</p>
              <p className="text-lg font-bold">Candidaturas de Curadores</p>
            </button>

            <button
              onClick={() => onNavigate('curator-admin-review')}
              className="facodi-card facodi-card-interactive transition-all text-left group"
            >
              <span className="material-symbols-outlined text-3xl mb-4 block text-primary group-hover:translate-y-[-4px] transition-transform">history</span>
              <p className="text-[9px] uppercase font-bold tracking-[0.3em] mb-2 text-gray-600 dark:text-gray-400">Compatibilidade</p>
              <p className="text-lg font-bold">Painel Classico</p>
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
