import React, { useEffect, useState } from 'react';
import { editSubmissionMetadata, getSubmissionDetail, updateSubmissionStatus } from '../../services/contentSubmissionSource';
import type { ContentSubmission } from '../../types';

interface AdminContentDetailPageProps {
  submissionId: string;
  onBack: () => void;
}

const AdminContentDetailPage: React.FC<AdminContentDetailPageProps> = ({ submissionId, onBack }) => {
  const [submission, setSubmission] = useState<ContentSubmission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [topic, setTopic] = useState('');
  const [pedagogicalReason, setPedagogicalReason] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const row = await getSubmissionDetail(submissionId);
        if (!row) {
          setError('Conteudo nao encontrado.');
          return;
        }
        setSubmission(row);
        setTitle(row.suggested_title || '');
        setSummary(row.summary || '');
        setTopic(row.topic || '');
        setPedagogicalReason(row.pedagogical_reason || '');
      } catch (err) {
        console.error('[admin-content-detail] load error', err);
        setError('Erro ao carregar conteudo.');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [submissionId]);

  const refresh = async () => {
    const row = await getSubmissionDetail(submissionId);
    if (row) setSubmission(row);
  };

  const saveMetadata = async () => {
    if (!submission) return;
    try {
      setSaving(true);
      await editSubmissionMetadata(submission.id, {
        suggested_title: title,
        summary,
        topic,
        pedagogical_reason: pedagogicalReason,
      });
      await refresh();
    } catch (err) {
      console.error('[admin-content-detail] saveMetadata error', err);
      setError('Erro ao salvar metadados.');
    } finally {
      setSaving(false);
    }
  };

  const approve = async () => {
    if (!submission) return;
    try {
      setSaving(true);
      await updateSubmissionStatus(submission.id, 'approved');
      setNote('Conteudo aprovado com sucesso.');
      await refresh();
    } catch (err) {
      console.error('[admin-content-detail] approve error', err);
      setError('Erro ao aprovar.');
    } finally {
      setSaving(false);
    }
  };

  const reject = async () => {
    if (!submission) return;
    const reason = window.prompt('Motivo da rejeicao (obrigatorio):');
    if (!reason || !reason.trim()) return;
    try {
      setSaving(true);
      await updateSubmissionStatus(submission.id, 'rejected', { rejectionReason: reason.trim() });
      setNote('Conteudo rejeitado.');
      await refresh();
    } catch (err) {
      console.error('[admin-content-detail] reject error', err);
      setError('Erro ao rejeitar.');
    } finally {
      setSaving(false);
    }
  };

  const requestChanges = async () => {
    if (!submission) return;
    const comment = window.prompt('Comentario de ajuste (obrigatorio):');
    if (!comment || !comment.trim()) return;
    try {
      setSaving(true);
      await updateSubmissionStatus(submission.id, 'needs_changes', { reviewNotes: comment.trim() });
      setNote('Solicitacao de ajustes enviada.');
      await refresh();
    } catch (err) {
      console.error('[admin-content-detail] requestChanges error', err);
      setError('Erro ao solicitar ajustes.');
    } finally {
      setSaving(false);
    }
  };

  const embedId = (() => {
    const url = submission?.url || '';
    const watch = url.match(/[?&]v=([A-Za-z0-9_-]{6,})/);
    const short = url.match(/youtu\.be\/([A-Za-z0-9_-]{6,})/);
    return watch?.[1] || short?.[1] || submission?.youtube_video_id || null;
  })();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-black border-t-primary animate-spin" />
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12 py-24 text-center">
        <p className="text-red-700 text-sm">{error || 'Conteudo nao encontrado.'}</p>
        <button onClick={onBack} className="mt-6 text-[10px] font-black uppercase tracking-widest hover:text-primary">
          Voltar
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto px-6 lg:px-12 py-16 lg:py-24">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] mb-10 hover:text-primary"
      >
        <span className="material-symbols-outlined text-sm">arrow_back</span>
        Revisao de Conteudos
      </button>

      {note && <div className="stark-border p-4 bg-green-50 text-green-700 mb-6">{note}</div>}
      {error && <div className="stark-border p-4 bg-red-50 text-red-700 mb-6">{error}</div>}

      <div className="flex flex-col lg:flex-row gap-12">
        <main className="flex-1">
          <h1 className="text-4xl font-black uppercase tracking-tighter mb-4">{submission.suggested_title || 'Sem titulo'}</h1>
          <p className="text-xs uppercase tracking-widest text-gray-500 mb-8">Estado atual: {submission.status}</p>

          {embedId && (
            <div className="aspect-video bg-black stark-border mb-10 overflow-hidden">
              <iframe
                title={submission.suggested_title || 'Preview'}
                src={`https://www.youtube.com/embed/${embedId}`}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}

          <div className="stark-border p-8 bg-white mb-8">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-6">Metadados</h3>
            <div className="space-y-4">
              <input className="w-full stark-border px-3 py-2" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titulo" />
              <textarea className="w-full stark-border px-3 py-2" rows={3} value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Resumo" />
              <input className="w-full stark-border px-3 py-2" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Topico" />
              <textarea className="w-full stark-border px-3 py-2" rows={3} value={pedagogicalReason} onChange={(e) => setPedagogicalReason(e.target.value)} placeholder="Justificativa pedagogica" />
              <button disabled={saving} onClick={saveMetadata} className="bg-black text-white px-6 py-3 text-[10px] font-black uppercase tracking-widest disabled:opacity-40 hover:shadow-[4px_4px_0px_0px_rgba(239,255,0,1)] transition-all">
                Salvar Metadados
              </button>
            </div>
          </div>
        </main>

        <aside className="w-full lg:w-80 shrink-0">
          <div className="stark-border p-8 bg-black text-white space-y-3">
            <button disabled={saving} onClick={approve} className="w-full bg-primary stark-border text-black py-3 text-[10px] font-black uppercase tracking-widest disabled:opacity-40 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">Aprovar</button>
            <button disabled={saving} onClick={requestChanges} className="w-full bg-orange-500 text-white py-3 text-[10px] font-black uppercase tracking-widest disabled:opacity-40">Solicitar Ajustes</button>
            <button disabled={saving} onClick={reject} className="w-full bg-red-600 text-white py-3 text-[10px] font-black uppercase tracking-widest disabled:opacity-40">Rejeitar</button>
          </div>

          <div className="stark-border p-8 bg-brand-muted mt-6">
            <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-2">Autor</p>
            <p className="text-sm font-bold">{submission.author_name || 'N/A'}</p>
            <p className="text-xs text-gray-500">{submission.author_email}</p>
            <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mt-5 mb-2">Enviado</p>
            <p className="text-sm font-bold">{new Date(submission.created_at).toLocaleDateString('pt-PT')}</p>
            {submission.url && (
              <>
                <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mt-5 mb-2">URL</p>
                <a href={submission.url} target="_blank" rel="noreferrer" className="text-xs text-blue-700 break-all hover:underline">{submission.url}</a>
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default AdminContentDetailPage;
