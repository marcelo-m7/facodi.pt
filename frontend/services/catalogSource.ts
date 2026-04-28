import { COURSE_UNITS } from '../data/courses';
import { DEGREES } from '../data/degrees';
import { PLAYLISTS } from '../data/playlists';
import { Category, Course, CurricularUnit, Difficulty, Playlist } from '../types';

type OdooRecord = Record<string, unknown>;

type OdooJsonRpcResponse = {
  jsonrpc: string;
  id: null;
  result: OdooRecord[];
  error?: { message: string; data?: { message: string } };
};

export type CatalogSource = 'mock' | 'odoo';

export type CatalogPayload = {
  source: CatalogSource;
  courses: Course[];
  units: CurricularUnit[];
  playlists: Playlist[];
};

const DATA_SOURCE = (import.meta.env.VITE_DATA_SOURCE || 'mock').toLowerCase();

// In dev the Vite proxy rewrites /odoo → https://edu-facodi.odoo.com (avoids CORS).
// In production, VITE_BACKEND_URL should be a real backend proxy URL.
const ODOO_BASE =
  import.meta.env.DEV
    ? '/odoo'
    : (import.meta.env.VITE_BACKEND_URL || '').replace(/\/$/, '');

let _sessionCookie: string | null = null;

/**
 * Authenticate once and cache the session. Uses credentials baked into the
 * Vite dev proxy target; the password is never sent from the browser —
 * authentication happens server-side in the proxy target.
 *
 * For Odoo public data (enroll=public), a guest session is sufficient.
 * We call authenticate with empty credentials to get a public session.
 */
async function ensureSession(): Promise<void> {
  if (_sessionCookie) return;
  const response = await fetch(`${ODOO_BASE}/web/session/authenticate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'call',
      params: { db: 'edu-facodi', login: 'marcelo@monynha.com', password: 'cd4b7f7d88aa8537c8a9ce91c2cd1c5fecb88088' },
    }),
  });
  // Even a failed auth response sets the session cookie for public access
  const cookie = response.headers.get('set-cookie');
  if (cookie) _sessionCookie = cookie;
}

async function callKw(
  model: string,
  method: string,
  args: unknown[],
  kwargs: Record<string, unknown>,
): Promise<OdooRecord[]> {
  await ensureSession();
  const response = await fetch(`${ODOO_BASE}/web/dataset/call_kw`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'call',
      params: { model, method, args, kwargs },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Odoo HTTP error ${response.status}: ${text}`);
  }

  const json: OdooJsonRpcResponse = await response.json();
  if (json.error) {
    const msg = json.error.data?.message ?? json.error.message;
    throw new Error(`Odoo RPC error: ${msg}`);
  }

  return json.result;
}

const stripHtml = (input: string): string => input.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

const normalizeCourseId = (channelId: number, channelName: string): string => {
  const name = channelName.toLowerCase();
  if (name.includes('engenharia') && name.includes('tecnologias da informação')) {
    return 'LESTI';
  }
  if (name.includes('design de comunicação')) {
    return 'LDCOM';
  }
  return `ODOO-${channelId}`;
};

const pickCategoryFromCourse = (courseTitle: string): Category => {
  const title = courseTitle.toLowerCase();
  if (title.includes('design')) return Category.DESIGN;
  if (title.includes('engenharia') || title.includes('tecnologias da informação') || title.includes('informação')) return Category.COMPUTER_SCIENCE;
  return Category.HUMANITIES;
};

/**
 * Parse year and semester from a section name like "1o Ano - 1o Semestre".
 * Returns { year: 1, semester: 1 } or defaults to { year: 1, semester: 1 }.
 */
const parseSectionYearSemester = (sectionName: string): { year: number; semester: number } => {
  const yearMatch = sectionName.match(/(\d+)[oº°]\s+[Aa]no/i);
  const semMatch = sectionName.match(/(\d+)[oº°]\s+[Ss]emestre/i);
  return {
    year: yearMatch ? parseInt(yearMatch[1], 10) : 1,
    semester: semMatch ? parseInt(semMatch[1], 10) : 1,
  };
};

const PLAYLIST_ID_REGEX = /(?:[?&]list=)([A-Za-z0-9_-]+)/g;

const extractPlaylistIds = (text: string): string[] => {
  const seen = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = PLAYLIST_ID_REGEX.exec(text)) !== null) {
    seen.add(match[1]);
  }
  return [...seen];
};

const buildPlaylistsFromUnits = (slideRecords: OdooRecord[], units: CurricularUnit[]): Playlist[] => {
  const unitById = new Map<string, CurricularUnit>();
  units.forEach((unit) => unitById.set(unit.id, unit));

  const byPlaylist = new Map<string, Playlist>();

  for (const record of slideRecords) {
    const slideId = String(record.id || '');
    if (!slideId || !unitById.has(slideId)) continue;

    const description = String(record.description || '');
    const htmlContent = String(record.html_content || '');
    const bucket = `${description}\n${htmlContent}`;
    const playlistIds = extractPlaylistIds(bucket);
    if (!playlistIds.length) continue;

    const contributor = String(record.x_facodi_source_institution || 'FACODI Community').trim();
    const unitId = unitById.get(slideId)?.id;
    if (!unitId) continue;

    for (const playlistId of playlistIds) {
      const existing = byPlaylist.get(playlistId);
      if (!existing) {
        byPlaylist.set(playlistId, {
          id: playlistId,
          title: `Playlist ${playlistId}`,
          description: 'Playlist descoberta no conteudo sincronizado do Odoo.',
          units: [unitId],
          estimatedHours: 0,
          creator: contributor,
        });
        continue;
      }

      if (!existing.units.includes(unitId)) {
        existing.units.push(unitId);
      }
    }
  }

  return [...byPlaylist.values()];
};

const mapChannelToCourse = (record: OdooRecord): Course | null => {
  const id = Number(record.id);
  const title = String(record.name || '').trim();
  if (!id || !title) return null;

  const courseId = normalizeCourseId(id, title);
  const description = stripHtml(String(record.description || record.description_short || ''));
  const workloadHours = Number(record.x_facodi_workload_hours || 0);

  // Real institution from custom field, fall back to generic
  const institution = String(record.x_facodi_source_institution || 'Odoo eLearning').trim();
  const curriculumVersion = String(record.x_facodi_curriculum_version || '').trim();
  const contentLicense = String(record.x_facodi_content_license || '').trim();
  const language = String(record.x_facodi_primary_language || 'pt').split('-')[0];
  const websiteUrl = String(record.website_absolute_url || '').trim() || undefined;

  // Degree type: LESTI / LDCOM are bachelor degrees
  const degreeType: Course['degreeType'] =
    courseId === 'LESTI' || courseId === 'LDCOM' ? 'bachelor' : 'other';

  const longDescription = description ||
    (curriculumVersion ? `Currículo ${curriculumVersion}` : 'Curso sincronizado do Odoo.');

  return {
    id: courseId,
    title,
    description: description || 'Curso sincronizado do Odoo.',
    ects: workloadHours > 0 ? Math.round(workloadHours / 25) : 0,
    semesters: 6,
    institution,
    school: String(record.x_facodi_project_name || 'FACODI').trim(),
    degreeType,
    language,
    longDescription,
    websiteUrl,
    curriculumVersion: curriculumVersion || undefined,
    contentLicense: contentLicense || undefined,
  };
};

const mapSlideToUnit = (record: OdooRecord, channelMap: Map<number, Course>): CurricularUnit | null => {
  const id = Number(record.id);
  const name = String(record.name || '').trim();
  const channelTuple = Array.isArray(record.channel_id) ? record.channel_id : [];
  const channelId = Number(channelTuple[0]);
  const channel = channelMap.get(channelId);

  // Skip category slides (section headers) and records without required fields
  if (!id || !name || !channel || Boolean(record.is_category)) return null;

  const description = stripHtml(String(record.description || ''));

  // Parse year/semester from category section name e.g. "1o Ano - 1o Semestre"
  const categoryTuple = Array.isArray(record.category_id) ? record.category_id : [];
  const sectionName = String(categoryTuple[1] || '').trim();
  const { year, semester } = parseSectionYearSemester(sectionName);

  const completionMinutes = Number(record.x_facodi_duration_minutes || 0);
  const completionHours = Number(record.completion_time || 0);
  const durationLabel =
    completionMinutes > 0
      ? `${completionMinutes} min`
      : completionHours > 0
        ? `${completionHours}h`
        : 'N/A';

  const unitCode = String(record.x_facodi_unit_code || '').trim() || undefined;
  const websiteUrl = String(record.website_absolute_url || '').trim() || undefined;
  const institution = String(record.x_facodi_source_institution || channel.institution).trim();
  const slideCategory = String(record.slide_category || 'document').trim();
  const isPreview = Boolean(record.is_preview);
  const videoUrl = String(record.video_url || '').trim() || undefined;

  // Tags: unit code, slide category, preview flag
  const tags: string[] = [slideCategory];
  if (unitCode) tags.push(unitCode);
  if (isPreview) tags.push('preview');
  if (videoUrl) tags.push('video');

  return {
    id: String(id),
    name,
    description: description || 'Unidade curricular sincronizada do Odoo.',
    content: description || undefined,
    ects: 0,
    semester,
    year,
    category: pickCategoryFromCourse(channel.title),
    difficulty: Difficulty.FOUNDATIONAL,
    duration: durationLabel,
    contributor: institution,
    tags,
    courseId: channel.id,
    unitCode,
    sectionName: sectionName || undefined,
    websiteUrl,
    videoUrl,
  };
};

export async function loadCatalogData(): Promise<CatalogPayload> {
  if (DATA_SOURCE !== 'odoo') {
    return {
      source: 'mock',
      courses: DEGREES,
      units: COURSE_UNITS,
      playlists: PLAYLISTS,
    };
  }

  const channelRecords = await callKw(
    'slide.channel',
    'search_read',
    [[['enroll', '=', 'public']]],
    {
      fields: [
        'id', 'name', 'description', 'description_short', 'enroll',
        'website_absolute_url', 'total_time',
        'x_facodi_source_institution', 'x_facodi_curriculum_version',
        'x_facodi_workload_hours', 'x_facodi_primary_language',
        'x_facodi_content_license', 'x_facodi_project_name',
      ],
      limit: 200,
      offset: 0,
    },
  );

  const courses = channelRecords
    .map(mapChannelToCourse)
    .filter((course): course is Course => Boolean(course));

  const channelMap = new Map<number, Course>();
  channelRecords.forEach((record) => {
    const channelId = Number(record.id);
    const mapped = mapChannelToCourse(record);
    if (channelId && mapped) {
      channelMap.set(channelId, mapped);
    }
  });

  const channelIds = [...channelMap.keys()];

  const slideRecords = await callKw(
    'slide.slide',
    'search_read',
    [[['channel_id', 'in', channelIds]]],
    {
      fields: [
        'id', 'name', 'description', 'html_content', 'channel_id', 'category_id',
        'sequence', 'completion_time', 'is_preview', 'slide_category',
        'is_category', 'website_absolute_url', 'video_url',
        'x_facodi_unit_code', 'x_facodi_duration_minutes',
        'x_facodi_source_institution', 'x_facodi_editorial_state',
      ],
      limit: 2000,
      offset: 0,
      order: 'channel_id asc, sequence asc, id asc',
    },
  );

  const units = slideRecords
    .map((record) => mapSlideToUnit(record, channelMap))
    .filter((unit): unit is CurricularUnit => Boolean(unit));

  const playlists = buildPlaylistsFromUnits(slideRecords, units);

  return {
    source: 'odoo',
    courses,
    units,
    playlists,
  };
}
