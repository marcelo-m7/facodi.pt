import React, { useMemo, useState } from 'react';
import { submitContent } from '../../services/contentSubmissionSource';
import {
  analyzeVideoBatch,
  ChannelIdentity,
  ChannelVideo,
  CurationBrief,
  fetchYouTubeChannel,
  getPipelineFallbackState,
  generatePlaylistSuggestions,
  listChannelVideos,
  PlaylistSuggestion,
  publishCuratedVideos,
  resetPipelineFallbackState,
  VideoAnalysis,
} from '../../services/channelCurationSource';
import ChannelImportPanel from './pipeline/ChannelImportPanel';
import CurationBriefPanel from './pipeline/CurationBriefPanel';
import VideoDiscoveryPanel from './pipeline/VideoDiscoveryPanel';
import AIAnalysisPanel from './pipeline/AIAnalysisPanel';
import PlaylistMapper from './pipeline/PlaylistMapper';
import EditorialReviewPanel, { type PublishItemResult } from './pipeline/EditorialReviewPanel';
import type { Locale } from '../../data/i18n';

interface ChannelCurationPageProps {
  locale?: Locale;
}

export const ChannelCurationPage: React.FC<ChannelCurationPageProps> = () => {
  const [channelInput, setChannelInput] = useState('');
  const [channel, setChannel] = useState<ChannelIdentity | null>(null);
  const [brief, setBrief] = useState<CurationBrief>({ maxVideos: 30, includeShorts: false });
  const [videos, setVideos] = useState<ChannelVideo[]>([]);
  const [selectedVideoIds, setSelectedVideoIds] = useState<string[]>([]);
  const [analyses, setAnalyses] = useState<VideoAnalysis[]>([]);
  const [suggestions, setSuggestions] = useState<PlaylistSuggestion[]>([]);

  const [validatingChannel, setValidatingChannel] = useState(false);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const [channelError, setChannelError] = useState<string | null>(null);
  const [videosError, setVideosError] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishSuccess, setPublishSuccess] = useState<string | null>(null);
  const [publishResults, setPublishResults] = useState<PublishItemResult[]>([]);
  const [confirmPublish, setConfirmPublish] = useState(false);
  const [degradedModeMessage, setDegradedModeMessage] = useState<string | null>(null);

  const selectedVideos = useMemo(
    () => videos.filter((item) => selectedVideoIds.includes(item.id)),
    [selectedVideoIds, videos],
  );

  const syncFallbackMode = () => {
    const state = getPipelineFallbackState();
    if (!state.used) {
      setDegradedModeMessage(null);
      return;
    }
    setDegradedModeMessage(
      `Modo degradado ativo: algumas etapas usaram fallback local (${state.stages.join(', ')}).`,
    );
  };

  const handleValidateChannel = async () => {
    resetPipelineFallbackState();
    setDegradedModeMessage(null);
    setChannelError(null);
    setChannel(null);
    setVideos([]);
    setSelectedVideoIds([]);
    setAnalyses([]);
    setSuggestions([]);

    try {
      setValidatingChannel(true);
      const data = await fetchYouTubeChannel(channelInput.trim());
      setChannel(data);
      syncFallbackMode();
    } catch (error) {
      setChannelError(error instanceof Error ? error.message : 'Falha ao validar o canal.');
    } finally {
      setValidatingChannel(false);
    }
  };

  const handleLoadVideos = async () => {
    if (!channelInput.trim()) {
      setVideosError('Informe um canal antes de buscar vídeos.');
      return;
    }

    setVideosError(null);
    try {
      setLoadingVideos(true);
      const items = await listChannelVideos(channelInput.trim(), brief);
      setVideos(items);
      setSelectedVideoIds(items.map((item) => item.id));
      syncFallbackMode();
    } catch (error) {
      setVideosError(error instanceof Error ? error.message : 'Falha ao buscar vídeos.');
    } finally {
      setLoadingVideos(false);
    }
  };

  const handleAnalyze = async () => {
    if (!channel || selectedVideos.length === 0) {
      setAnalysisError('Selecione ao menos um vídeo para analisar.');
      return;
    }

    setAnalysisError(null);
    try {
      setAnalyzing(true);
      const result = await analyzeVideoBatch(channel, selectedVideos, brief);
      setAnalyses(result);
      if (result.length > 0) {
        const mapped = await generatePlaylistSuggestions(channel, selectedVideos, result);
        setSuggestions(mapped);
      }
      syncFallbackMode();
    } catch (error) {
      setAnalysisError(error instanceof Error ? error.message : 'Falha na análise IA.');
      // fallback: mantém revisão manual disponível
      setAnalyses([]);
      setSuggestions([]);
    } finally {
      setAnalyzing(false);
    }
  };

  const handlePublish = async () => {
    if (!selectedVideos.length) return;

    setPublishError(null);
    setPublishSuccess(null);
    setPublishResults([]);

    try {
      setPublishing(true);

      const items = selectedVideos.map((video) => ({
        video,
        analysis: analyses.find((entry) => entry.videoId === video.id),
        suggestion: suggestions.find((entry) => entry.videoId === video.id),
      }));

      const normalized = await publishCuratedVideos(items);
      syncFallbackMode();

      // Compatibilidade: publicação final no fluxo existente de submissão — per-item results
      const results: PublishItemResult[] = [];
      let duplicateCount = 0;
      for (const item of normalized) {
        try {
          await submitContent({
            content_type: 'video',
            url: item.video.id ? `https://www.youtube.com/watch?v=${item.video.id}` : undefined,
            youtube_video_id: item.video.id,
            suggested_title: item.video.title,
            summary: item.analysis?.summary || item.video.description || undefined,
            course_id: item.suggestion?.courseId,
            unit_id: item.suggestion?.unitId,
            topic: item.analysis?.topic,
            pedagogical_reason: item.analysis?.pedagogicalReason,
            tags: item.analysis?.tags || item.video.tags || [],
            additional_notes: 'Origem: pipeline de curadoria por canal (MVP).',
          });
          results.push({ title: item.video.title, success: true });
        } catch (err) {
          const message = err instanceof Error ? err.message : 'erro desconhecido';
          if (message === 'submission_duplicate') {
            duplicateCount += 1;
            results.push({ title: item.video.title, success: true });
            continue;
          }
          results.push({ title: item.video.title, success: false, error: message });
        }
      }

      setPublishResults(results);
      const succeeded = results.filter((r) => r.success).length;
      const failed = results.filter((r) => !r.success).length;
      if (succeeded > 0) {
        const duplicateSuffix =
          duplicateCount > 0 ? ` (${duplicateCount} já existente(s), sem duplicar envio).` : '';
        setPublishSuccess(
          failed > 0
            ? `${succeeded} de ${normalized.length} processado(s); ${failed} falhou.${duplicateSuffix}`
            : `${succeeded} vídeo(s) processado(s) para revisão no fluxo atual.${duplicateSuffix}`,
        );
      } else {
        setPublishError(`Todos os ${normalized.length} envios falharam.`);
      }
    } catch (error) {
      setPublishError(error instanceof Error ? error.message : 'Falha ao publicar conteúdo curado.');
    } finally {
      setPublishing(false);
    }
  };

  const toggleVideoSelection = (id: string) => {
    setSelectedVideoIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  return (
    <div className="facodi-page">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <span className="text-[10px] font-black bg-black text-primary px-3 py-1.5 uppercase tracking-[0.2em] mb-4 inline-block">Curadoria</span>
          <h1 className="text-5xl lg:text-6xl font-black uppercase tracking-tighter">Pipeline por canal do YouTube</h1>
          <p className="text-sm text-gray-500 mt-3 max-w-3xl">
            MVP incremental e não destrutivo para importar canal, analisar vídeos com IA, revisar manualmente e publicar no fluxo atual do FACODI.
          </p>
        </div>

        {degradedModeMessage && (
          <div className="facodi-alert facodi-alert-warning">{degradedModeMessage}</div>
        )}

        <ChannelImportPanel
          channelInput={channelInput}
          loading={validatingChannel}
          error={channelError}
          onChange={setChannelInput}
          onValidate={handleValidateChannel}
        />

        {channel && (
          <div className="facodi-alert facodi-alert-success">
            Canal validado: <strong>{channel.title}</strong> ({channel.channelId})
          </div>
        )}

        <CurationBriefPanel brief={brief} onChange={setBrief} />

        <VideoDiscoveryPanel
          videos={videos}
          selectedIds={selectedVideoIds}
          loading={loadingVideos}
          error={videosError}
          onLoad={handleLoadVideos}
          onToggle={toggleVideoSelection}
        />

        <AIAnalysisPanel
          analyses={analyses}
          loading={analyzing}
          error={analysisError}
          onAnalyze={handleAnalyze}
        />

        <PlaylistMapper suggestions={suggestions} />

        <EditorialReviewPanel
          selectedCount={selectedVideos.length}
          publishing={publishing}
          error={publishError}
          successMessage={publishSuccess}
          publishResults={publishResults}
          onPublish={() => setConfirmPublish(true)}
        />
      </div>

      {confirmPublish && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-publish-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
        >
          <div className="facodi-card max-w-sm w-full mx-4 space-y-4">
            <h3 id="confirm-publish-title" className="facodi-label m-0">
              Confirmar publicação
            </h3>
            <p className="text-sm text-gray-700">
              {selectedVideos.length} vídeo(s) serão enviados para revisão no fluxo atual.
              {degradedModeMessage && (
                <span className="block mt-1 text-amber-700 text-[11px]">
                  ⚠ Modo degradado ativo — dados gerados por fallback local.
                </span>
              )}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setConfirmPublish(false)}
                className="facodi-btn facodi-btn-secondary"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmPublish(false);
                  handlePublish();
                }}
                className="facodi-btn facodi-btn-primary"
              >
                Publicar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
