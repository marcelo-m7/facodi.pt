import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { getAdminQueue } from '../../services/contentSubmissionSource';
import type { ContentSubmission } from '../../types';

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
  const [rows, setRows] = useState<ContentSubmission[]>([]);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<ContentSubmission['status'] | ''>('');
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  const pageSize = 20;

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { submissions, total: totalCount } = await getAdminQueue({
        status: statusFilter || undefined,
        content_type: typeFilter || undefined,
        limit: pageSize,
        offset: page * pageSize,
      });
      setRows(submissions);
      setTotal(totalCount);
    } catch (err) {
      console.error('[admin-content-list] load error', err);
      setError('Erro ao carregar conteudos.');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, typeFilter, page]);

  useEffect(() => {
    load();
  }, [load]);

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

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="max-w-[1600px] mx-auto px-6 lg:px-12 py-16 lg:py-24">
      <button
        onClick={onBack}
        className="facodi-nav-link mb-12 flex items-center gap-2"
      >
        <span className="material-symbols-outlined text-sm">arrow_back</span>
        Painel Admin
      </button>

      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[0.95] mb-12">Revisao de Conteudos</h1>

      <div className="facodi-card mb-8 p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="facodi-label mb-2 block">Estado</label>
          <select
            className="facodi-input w-full"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as ContentSubmission['status'] | '');
              setPage(0);
            }}
          >
            <option value="">Todos</option>
            {(Object.keys(STATUS_LABELS) as ContentSubmission['status'][]).map((status) => (
              <option key={status} value={status}>{STATUS_LABELS[status]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="facodi-label mb-2 block">Tipo</label>
          <select
            className="facodi-input w-full"
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(0);
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
          <label className="facodi-label mb-2 block">Buscar</label>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="facodi-input w-full"
            placeholder="Titulo, URL, autor"
          />
        </div>
      </div>

      {error && (
        <div className="facodi-alert facodi-alert-error mb-6">
          <p className="font-semibold">{error}</p>
        </div>
      )}

      {isLoading ? (
        <div className="py-24 flex items-center justify-center">
          <div className="facodi-spinner"></div>
        </div>
      ) : filteredRows.length === 0 ? (
        <div className="facodi-card text-center py-12">
          <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-700 mb-4 inline-block">inbox</span>
          <p className="text-sm font-semibold mt-4">Nenhum conteudo encontrado</p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">Tente ajustar seus filtros de busca.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRows.map((row) => (
            <button
              key={row.id}
              onClick={() => onOpenSubmission(row.id)}
              className={`facodi-card facodi-card-interactive p-6 w-full text-left transition-all ${
                row.status === 'pending' ? 'border-l-4 border-l-primary' : ''
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[9px] uppercase font-bold tracking-widest text-gray-600 dark:text-gray-400 mb-2">
                    {STATUS_LABELS[row.status]} · {row.content_type}
                  </p>
                  <p className="text-base font-bold tracking-tight">{row.suggested_title || 'Sem titulo'}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">{row.author_name || row.author_email}</p>
                  {row.url && <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 truncate">{row.url}</p>}
                </div>
                <span className="material-symbols-outlined text-gray-400 dark:text-gray-600 mt-1">arrow_forward</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
          <button
            disabled={page === 0}
            onClick={() => setPage((value) => Math.max(0, value - 1))}
            className="text-[9px] font-bold uppercase tracking-widest text-gray-600 dark:text-gray-400 disabled:opacity-40 hover:text-primary transition-colors"
          >
            Anterior
          </button>
          <p className="text-[9px] font-bold uppercase tracking-widest text-gray-600 dark:text-gray-400">Pagina {page + 1} de {totalPages}</p>
          <button
            disabled={page >= totalPages - 1}
            onClick={() => setPage((value) => Math.min(totalPages - 1, value + 1))}
            className="text-[9px] font-bold uppercase tracking-widest text-gray-600 dark:text-gray-400 disabled:opacity-40 hover:text-primary transition-colors"
          >
            Proxima
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminContentListPage;
