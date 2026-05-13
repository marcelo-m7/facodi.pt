// deno-lint-ignore-file no-explicit-any
import {
  corsHeaders,
  enforceRateLimit,
  ensurePostMethod,
  HttpError,
  json,
  requireEditorOrAdmin,
  toErrorResponse,
} from '../_shared/pipelineSecurity.ts';

const inferDifficulty = (text: string): 'foundational' | 'intermediate' | 'advanced' | 'expert' => {
  const lower = text.toLowerCase();
  if (lower.includes('introducao') || lower.includes('básico') || lower.includes('basic')) return 'foundational';
  if (lower.includes('avancado') || lower.includes('advanced')) return 'advanced';
  if (lower.includes('especialista') || lower.includes('expert')) return 'expert';
  return 'intermediate';
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    ensurePostMethod(req);
    const auth = await requireEditorOrAdmin(req);
    enforceRateLimit(`analyze_video_batch:${auth.userId}`, 10, 60_000);

    const { videos } = await req.json();
    if (!Array.isArray(videos) || videos.length === 0) {
      throw new HttpError(400, 'videos_required', 'At least one video is required.');
    }
    if (videos.length > 50) {
      throw new HttpError(400, 'videos_limit_exceeded', 'Maximum of 50 videos per batch.');
    }

    const analyses = videos.map((video: any) => {
      const title = String(video.title || '');
      return {
        videoId: String(video.id || ''),
        summary: `Resumo pedagógico automático para ${title}.`,
        pedagogicalReason: 'Conteúdo com potencial de apoio em trilhas de aprendizagem aberta.',
        topic: title.split('-')[0]?.trim() || 'tópico geral',
        difficulty: inferDifficulty(title),
        tags: ['facodi', 'curadoria', 'youtube'],
      };
    });

    return json(analyses);
  } catch (error) {
    return toErrorResponse(error);
  }
});
