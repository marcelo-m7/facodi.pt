import React, { useMemo, useState } from 'react';
import { getAdminQueue } from '../../services/contentSubmissionSource';
import type { ContentSubmission } from '../../types';
import { useListWithFilters } from '../../hooks/useListWithFilters';
import AdminPageScaffold from './AdminPageScaffold';

interface AdminContentListPageProps {
  onBack: () => void;
  onOpenSubmission: (id: string) => void;
}

const STATUS_LABELS: Record<ContentSubmission['status'], string> = {
  pending: 'Pendente',
  submitted: 'Enviado',
  in_review: 'Em Revisao',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
  needs_changes: 'Precisa Ajustes',
  published: 'Publicado',
};

const AdminContentListPage: React.FC<AdminContentListPageProps> = ({ onBack, onOpenSubmission }) => {
  const [search, setSearch] = useState('');

  const pageSize = 20;

  const {
    items: rows,
    totalPages,
    page,
    setPage,
    filters,
    updateFilters,
    isLoading,
    error,
  } = useListWithFilters<
    ContentSubmission,
    { statusFilter: ContentSubmission['status'] | ''; typeFilter: ContentSubmission['content_type'] | '' }
  >({
    pageSize,
    initialFilters: {
      statusFilter: '',
      typeFilter: '',
    },
    fetchPage: async ({ filters: currentFilters, limit, offset }) => {
      const { submissions, total: totalCount } = await getAdminQueue({
        status: currentFilters.statusFilter || undefined,
        content_type: currentFilters.typeFilter || undefined,
        limit,
        offset,
      });
      return { items: submissions, total: totalCount };
    },
  });

  const filteredRows = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) return rows;
    return rows.filter((row) =>
      (row.suggested_title || '').toLowerCase().includes(normalized) ||
      (row.url || '').toLowerCase().includes(normalized) ||
      (row.author_name || '').toLowerCase().includes(normalized) ||
      (row.author_email || '').toLowerCase().includes(normalized)
    );
  }, [rows, search]);

  return (
    <AdminPageScaffold
      onBack={onBack}
      backLabel="Painel Admin"
      isLoading={isLoading}
      loadingLabel="A carregar conteúdos..."
      error={error}
    >
      <h1 className="text-5xl font-black uppercase tracking-tighter mb-8">Revisao de Conteudos</h1>

      <div className="stark-border p-6 bg-white mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Estado</label>
          <select
            className="w-full stark-border px-3 py-2 text-xs uppercase"
            value={filters.statusFilter}
            onChange={(e) => {
              updateFilters((prev) => ({
                ...prev,
                statusFilter: e.target.value as ContentSubmission['status'] | '',
              }));
            }}
          >
            <option value="">Todos</option>
            {(Object.keys(STATUS_LABELS) as ContentSubmission['status'][]).map((status) => (
              <option key={status} value={status}>{STATUS_LABELS[status]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Tipo</label>
          <select
            className="w-full stark-border px-3 py-2 text-xs uppercase"
            value={filters.typeFilter}
            onChange={(e) => {
              updateFilters((prev) => ({ ...prev, typeFilter: e.target.value }));
            }}
          >
            <option value="">Todos</option>
            <option value="video">Video</option>
            <option value="article">Artigo</option>
            <option value="interactive">Interativo</option>
            <option value="other">Outro</option>
          </select>
        </div>
        <div>
          <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Buscar</label>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full stark-border px-3 py-2 text-sm"
            placeholder="Titulo, URL, autor"
          />
        </div>
      </div>

      {filteredRows.length === 0 ? (
        <div className="stark-border p-10 bg-brand-muted text-center">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Nenhum conteudo encontrado</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRows.map((row) => (
            <button
              key={row.id}
              onClick={() => onOpenSubmission(row.id)}
              className={`w-full stark-border text-left p-6 hover:bg-brand-muted transition-all ${row.status === 'pending' ? 'border-l-4 border-l-yellow-400' : 'bg-white'}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2">
                    {STATUS_LABELS[row.status]} · {row.content_type}
                  </p>
                  <p className="text-sm font-black uppercase tracking-tight">{row.suggested_title || 'Sem titulo'}</p>
                  <p className="text-xs text-gray-500 mt-1">{row.author_name || row.author_email}</p>
                  {row.url && <p className="text-xs text-gray-400 mt-1 truncate">{row.url}</p>}
                </div>
                <span className="material-symbols-outlined">arrow_forward</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-8">
          <button
            disabled={page === 0}
            onClick={() => setPage((value) => Math.max(0, value - 1))}
            className="text-[10px] font-black uppercase tracking-widest disabled:opacity-40"
          >
            Anterior
          </button>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Pagina {page + 1} de {totalPages}</p>
          <button
            disabled={page >= totalPages - 1}
            onClick={() => setPage((value) => Math.min(totalPages - 1, value + 1))}
            className="text-[10px] font-black uppercase tracking-widest disabled:opacity-40"
          >
            Proxima
          </button>
        </div>
      )}
    </AdminPageScaffold>
  );
};

export default AdminContentListPage;
