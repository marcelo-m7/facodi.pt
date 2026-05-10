import React, { useState } from 'react';
import { listApplications, updateApplicationStatus } from '../../services/curatorApplicationSource';
import type { EditorApplication } from '../../types';
import { useListWithFilters } from '../../hooks/useListWithFilters';
import AdminPageScaffold from './AdminPageScaffold';

interface AdminCuratorListPageProps {
  onBack: () => void;
}

const AdminCuratorListPage: React.FC<AdminCuratorListPageProps> = ({ onBack }) => {
  const [actionError, setActionError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const {
    items: rows,
    filters,
    updateFilters,
    isLoading,
    error,
    reload,
  } = useListWithFilters<EditorApplication, { statusFilter: EditorApplication['status'] | '' }>({
    pageSize: 50,
    initialFilters: { statusFilter: '' },
    fetchPage: async ({ filters: currentFilters, limit, offset }) => {
      const { applications, total } = await listApplications(
        currentFilters.statusFilter || undefined,
        limit,
        offset,
      );
      return { items: applications, total };
    },
  });

  const approve = async (id: string) => {
    try {
      setActionError(null);
      await updateApplicationStatus(id, 'approved');
      setNote('Candidatura aprovada.');
      await reload();
    } catch (err) {
      console.error('[admin-curator-list] approve error', err);
      setActionError('Erro ao aprovar candidatura.');
    }
  };

  const reject = async (id: string) => {
    const reason = window.prompt('Motivo da rejeicao (obrigatorio):');
    if (!reason || !reason.trim()) return;
    try {
      setActionError(null);
      await updateApplicationStatus(id, 'rejected', reason.trim());
      setNote('Candidatura rejeitada.');
      await reload();
    } catch (err) {
      console.error('[admin-curator-list] reject error', err);
      setActionError('Erro ao rejeitar candidatura.');
    }
  };

  return (
    <AdminPageScaffold
      onBack={onBack}
      backLabel="Painel Admin"
      isLoading={isLoading}
      loadingLabel="A carregar candidaturas..."
      error={error}
      notice={
        <>
          {note && <div className="stark-border p-4 bg-green-50 text-green-700 mb-6">{note}</div>}
          {actionError && <div className="stark-border p-4 bg-red-50 text-red-700 mb-6">{actionError}</div>}
        </>
      }
    >
      <h1 className="text-5xl font-black uppercase tracking-tighter mb-8">Candidaturas de Curadores</h1>

      <div className="stark-border p-6 bg-white mb-8 max-w-xs">
        <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Estado</label>
        <select
          className="w-full stark-border px-3 py-2 text-xs uppercase"
          value={filters.statusFilter}
          onChange={(e) => {
            updateFilters({ statusFilter: e.target.value as EditorApplication['status'] | '' });
          }}
        >
          <option value="">Todos</option>
          <option value="pending">Pendente</option>
          <option value="approved">Aprovado</option>
          <option value="rejected">Rejeitado</option>
        </select>
      </div>

      {rows.length === 0 ? (
        <div className="stark-border p-10 bg-brand-muted text-center">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Nenhuma candidatura encontrada</p>
        </div>
      ) : (
        <div className="space-y-4">
          {rows.map((row) => (
            <div key={row.id} className={`stark-border p-6 bg-white ${row.status === 'pending' ? 'border-l-4 border-l-yellow-400' : ''}`}>
              <div className="flex flex-wrap gap-4 items-start justify-between">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">{row.status}</p>
                  <p className="text-lg font-black uppercase tracking-tight">{row.full_name}</p>
                  <p className="text-sm text-gray-500">{row.email}</p>
                  {row.specialty_area && <p className="text-xs text-gray-500 mt-2">Especialidade: {row.specialty_area}</p>}
                  {row.motivation && <p className="text-sm text-gray-600 mt-3 max-w-3xl">{row.motivation}</p>}
                </div>
                {row.status === 'pending' && (
                  <div className="flex gap-2">
                    <button onClick={() => approve(row.id)} className="bg-primary stark-border px-4 py-2 text-[9px] font-black uppercase tracking-widest hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">Aprovar</button>
                    <button onClick={() => reject(row.id)} className="stark-border px-4 py-2 text-[9px] font-black uppercase tracking-widest text-red-700">Rejeitar</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminPageScaffold>
  );
};

export default AdminCuratorListPage;
