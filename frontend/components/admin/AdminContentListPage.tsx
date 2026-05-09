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
        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] mb-12 hover:text-primary transition-colors group"
      >
        <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform">arrow_back</span>
        Painel Admin
      </button>

      <h1 className="text-5xl font-black uppercase tracking-tighter mb-8">Revisao de Conteudos</h1>

      <div className="stark-border p-6 bg-white mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Estado</label>
          <select
            className="w-full stark-border px-3 py-2 text-xs uppercase"
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
          <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Tipo</label>
          <select
            className="w-full stark-border px-3 py-2 text-xs uppercase"
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
          <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Buscar</label>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full stark-border px-3 py-2 text-sm"
            placeholder="Titulo, URL, autor"
          />
        </div>
      </div>

      {error && <div className="stark-border p-4 bg-red-50 text-red-700 mb-6">{error}</div>}

      {isLoading ? (
        <div className="py-24 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-black border-t-primary animate-spin" />
        </div>
      ) : filteredRows.length === 0 ? (
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
    </div>
  );
};

export default AdminContentListPage;
