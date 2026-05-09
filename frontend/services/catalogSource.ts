import { supabase } from './supabase';
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

export type CatalogSource = 'mock' | 'odoo' | 'supabase';

export type CatalogPayload = {
  source: CatalogSource;
  courses: Course[];
  units: CurricularUnit[];
  playlists: Playlist[];
};

const DATA_SOURCE = (import.meta.env.VITE_DATA_SOURCE || 'mock').toLowerCase();


const CATEGORY_MAP: Record<string, Category> = {
  communication: Category.COMMUNICATION,
  computer_science: Category.COMPUTER_SCIENCE,
  design: Category.DESIGN,
  engineering: Category.ENGINEERING,
  humanities: Category.HUMANITIES,
  management: Category.MANAGEMENT,
  mathematics: Category.MATHEMATICS,
  arts_ui: Category.ARTS_UI,
  ethics: Category.ETHICS,
};

const DIFFICULTY_MAP: Record<string, Difficulty> = {
  foundational: Difficulty.FOUNDATIONAL,
  intermediate: Difficulty.INTERMEDIATE,
  advanced: Difficulty.ADVANCED,
  expert: Difficulty.EXPERT,
};

async function loadSupabaseData(): Promise<CatalogPayload> {
  const sb = supabase;

  // 1. Load courses from public schema
  const { data: coursesRaw, error: coursesErr } = await sb
    .from('courses')
    .select('code, title, description, ects_total, duration_semesters, institution, school, degree_type, language_code, long_description, website_url, curriculum_version, content_license, metadata, is_active')
    .eq('is_active', true)
    .order('code');

  if (coursesErr) throw new Error(`[catalogSource:supabase] courses: ${coursesErr.message}`);
  if (!coursesRaw?.length) throw new Error('[catalogSource:supabase] No courses returned');

  const courses: Course[] = coursesRaw.map((row) => {
    const meta = (row.metadata as Record<string, unknown>) ?? {};
    return {
      id: row.code,
      title: row.title,
      description: row.description || (meta.description as string) || row.title,
      ects: Number(row.ects_total) || 0,
      semesters: Number(row.duration_semesters) || 6,
      institution: row.institution ?? 'UALG',
      school: row.school ?? 'FACODI',
      degreeType: row.degree_type === 'bachelor' || row.degree_type === 'master' ? row.degree_type : 'other',
      language: row.language_code ?? 'pt',
      longDescription: row.long_description || (meta.long_description as string) || row.title,
      websiteUrl: row.website_url ?? undefined,
      curriculumVersion: row.curriculum_version ?? undefined,
      contentLicense: row.content_license ?? (meta.content_license as string) ?? undefined,
    };
  });

  const validCourseIds = new Set(courses.map((course) => course.id));

  // 2. Load units from public schema
  const { data: unitsRaw, error: unitsErr } = await sb
    .from('units')
    .select('code, name, summary, content, content_url, syllabus_url, ects, semester, year, category, difficulty, duration, contributor, tags, prerequisites, unit_code, section_name, website_url, video_url, source_url, metadata, course_id, courses(code)')
    .order('position');

  if (unitsErr) throw new Error(`[catalogSource:supabase] units: ${unitsErr.message}`);

  const units: CurricularUnit[] = (unitsRaw ?? []).map((row) => {
    const meta = (row.metadata as Record<string, unknown>) ?? {};
    const courseRel = Array.isArray(row.courses) ? row.courses[0] : row.courses;
    const categoryRaw = String(row.category || meta.category || '').toLowerCase();
    const difficultyRaw = String(row.difficulty || meta.difficulty || '').toLowerCase();
    const relationCode = typeof courseRel?.code === 'string' ? courseRel.code : null;
    const rawCourseId = typeof row.course_id === 'string' ? row.course_id : null;
    const metaCourseId = typeof meta.courseId === 'string' ? meta.courseId : null;
    const candidateCourseId = relationCode ?? rawCourseId ?? metaCourseId;
    const courseId: string = candidateCourseId && validCourseIds.has(candidateCourseId)
      ? candidateCourseId
      : (relationCode ?? rawCourseId ?? metaCourseId ?? 'UNKNOWN');
    const category = CATEGORY_MAP[categoryRaw] ?? Category.COMPUTER_SCIENCE;
    const difficulty = DIFFICULTY_MAP[difficultyRaw] ?? Difficulty.FOUNDATIONAL;
    const semester = Number(row.semester) || Number(meta.semester) || 1;
    const year = Number(row.year) || Number(meta.year) || 1;
    const durationLabel = row.duration || 'N/A';

    return {
      id: row.code,
      name: row.name,
      description: row.summary || row.content || '',
      content: row.content ?? undefined,
      contentUrl: row.content_url ?? undefined,
      syllabusUrl: row.syllabus_url ?? undefined,
      ects: Number(row.ects) || 0,
      semester,
      year,
      category,
      difficulty,
      duration: durationLabel,
      contributor: row.contributor || 'FACODI',
      tags: (row.tags as string[]) ?? [],
      courseId,
      prerequisites: (row.prerequisites as string[]) ?? undefined,
      unitCode: row.unit_code ?? row.code,
      sectionName: row.section_name ?? undefined,
      websiteUrl: row.website_url ?? row.source_url ?? undefined,
      videoUrl: row.video_url ?? undefined,
    };
  });

  // 3. Load playlists from public.playlists (learning path collections on tube.open2.tech)
  // These are curated video collections mapped per unit via course_code + unit_code
  const { data: playlistsRaw, error: playlistsErr } = await sb
    .from('playlists')
    .select('id, name, slug, description, course_code, unit_code, video_count, total_duration_seconds, is_public')
    .eq('is_public', true)
    .not('course_code', 'is', null)
    .order('course_code')
    .order('unit_code');

  if (playlistsErr) throw new Error(`[catalogSource:supabase] playlists: ${playlistsErr.message}`);

  // Build a set of valid unit codes for filtering
  const unitCodeSet = new Set(units.map((u) => u.id));

  const playlists: Playlist[] = (playlistsRaw ?? [])
    .filter((row) => row.unit_code && unitCodeSet.has(row.unit_code))
    .map((row) => {
      const estimatedHours = row.total_duration_seconds
        ? Math.round(row.total_duration_seconds / 3600 * 10) / 10
        : 0;

      return {
        id: row.id,
        title: row.name,
        description: row.description || `Caminho de aprendizado da unidade ${row.unit_code}.`,
        units: [row.unit_code!],
        estimatedHours,
        creator: 'FACODI Community',
        course_code: row.course_code ?? undefined,
        unit_code: row.unit_code ?? undefined,
      };
    });

  return { source: 'supabase', courses, units, playlists };
}

// In dev the Vite proxy rewrites /odoo → https://edu-facodi.odoo.com (avoids CORS).
// In production, VITE_BACKEND_URL should be a real backend proxy URL.
const ODOO_BASE =
  import.meta.env.DEV
    ? '/odoo'
    : (import.meta.env.VITE_BACKEND_URL || '').replace(/\/$/, '');

let _sessionCookie: string | null = null;

/**
 * Authenticate once and cache the session.
 * Uses credentials from environment variables (VITE_ODOO_DB, VITE_ODOO_USERNAME, VITE_ODOO_PASSWORD).
 * This allows credentials to rotate without code changes.
 *
 * For Odoo public data (enroll=public), we authenticate with real credentials
 * to ensure session persistence across multiple API calls.
 */
async function ensureSession(): Promise<void> {
  if (_sessionCookie) return;
  
  const db = import.meta.env.VITE_ODOO_DB || 'edu-facodi';
  const login = import.meta.env.VITE_ODOO_USERNAME || '';
  const password = import.meta.env.VITE_ODOO_PASSWORD || '';
  
  try {
    const response = await fetch(`${ODOO_BASE}/web/session/authenticate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'call',
        params: { db, login, password },
      }),
    });
    
    // Set session cookie if available (even on error, some session state may be set)
    const cookie = response.headers.get('set-cookie');
    if (cookie) _sessionCookie = cookie;
  } catch (error) {
    console.warn('[catalogSource] ensureSession failed:', error);
    // Don't throw; allow continuation for public data access
  }
}

async function callKw(
  model: string,
  method: string,
  args: unknown[],
  kwargs: Record<string, unknown>,
): Promise<OdooRecord[]> {
  await ensureSession();
  
  try {
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
  } catch (error) {
    console.error(`[catalogSource] callKw(${model}.${method}) failed:`, error);
    throw error;
  }
}

async function searchReadAll(
  model: string,
  domain: unknown[],
  fields: string[],
  options?: { order?: string; pageSize?: number },
): Promise<OdooRecord[]> {
  const pageSize = options?.pageSize ?? 500;
  const all: OdooRecord[] = [];
  let offset = 0;

  while (true) {
    const page = await callKw(
      model,
      'search_read',
      [domain],
      {
        fields,
        limit: pageSize,
        offset,
        ...(options?.order ? { order: options.order } : {}),
      },
    );

    if (!page.length) break;

    all.push(...page);
    offset += page.length;

    if (page.length < pageSize) break;
  }

  return all;
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
    // Odoo sync metadata (used by syncOdooToSupabase, not rendered in UI)
    _odooId: id,
    _enroll: String(record.enroll || 'public'),
    _membersCount: Number(record.members_count || 0),
  } as Course & { _odooId: number; _enroll: string; _membersCount: number };
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
  try {
    // Supabase path
    if (DATA_SOURCE === 'supabase') {
      try {
        return await loadSupabaseData();
      } catch (supabaseError) {
        console.error('[catalogSource:supabase] Failed, falling back to mock:', supabaseError);
        return { source: 'mock', courses: DEGREES, units: COURSE_UNITS, playlists: PLAYLISTS };
      }
    }

    // Mock path
    if (DATA_SOURCE !== 'odoo') {
      return {
        source: 'mock',
        courses: DEGREES,
        units: COURSE_UNITS,
        playlists: PLAYLISTS,
      };
    }


    // Fetch ALL courses regardless of enrollment mode (public, invite, payment).
    const channelRecords = await searchReadAll(
      'slide.channel',
      [],
      [
        'id', 'name', 'description', 'description_short', 'enroll',
        'members_count', 'website_absolute_url', 'total_time',
        'x_facodi_source_institution', 'x_facodi_curriculum_version',
        'x_facodi_workload_hours', 'x_facodi_primary_language',
        'x_facodi_content_license', 'x_facodi_project_name',
      ],
      { pageSize: 500 },
    );

    if (!channelRecords || channelRecords.length === 0) {
      console.warn('[catalogSource] No courses found in Odoo, falling back to mock');
      return {
        source: 'mock',
        courses: DEGREES,
        units: COURSE_UNITS,
        playlists: PLAYLISTS,
      };
    }


    // Map courses
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

    if (channelIds.length === 0) {
      console.warn('[catalogSource] No valid courses after mapping, falling back to mock');
      return {
        source: 'mock',
        courses: DEGREES,
        units: COURSE_UNITS,
        playlists: PLAYLISTS,
      };
    }

    // Fetch lessons with pagination to avoid truncation when catalog grows.
    const slideRecords = await searchReadAll(
      'slide.slide',
      [['channel_id', 'in', channelIds]],
      [
        'id', 'name', 'description', 'html_content', 'channel_id', 'category_id',
        'sequence', 'completion_time', 'is_preview', 'slide_category',
        'is_category', 'website_absolute_url', 'video_url',
        'x_facodi_unit_code', 'x_facodi_duration_minutes',
        'x_facodi_source_institution', 'x_facodi_editorial_state',
      ],
      { pageSize: 1000, order: 'channel_id asc, sequence asc, id asc' },
    );

    if (!slideRecords || slideRecords.length === 0) {
      console.warn('[catalogSource] No lessons found, falling back to mock');
      return {
        source: 'mock',
        courses: DEGREES,
        units: COURSE_UNITS,
        playlists: PLAYLISTS,
      };
    }


    // Map lessons
    const units = slideRecords
      .map((record) => mapSlideToUnit(record, channelMap))
      .filter((unit): unit is CurricularUnit => Boolean(unit));

    const playlists = buildPlaylistsFromUnits(slideRecords, units);

    // Best-effort visibility into enrollment volume for downstream Odoo->Supabase sync.
    try {
      const enrollmentRecords = await searchReadAll(
        'slide.channel.partner',
        [],
        ['id', 'channel_id', 'partner_id', 'completion', 'completed_slides_count'],
        { pageSize: 1000 },
      );
      console.info('[catalogSource:odoo] enrollment records loaded:', enrollmentRecords.length);
    } catch (enrollmentError) {
      console.warn('[catalogSource:odoo] enrollment snapshot skipped:', enrollmentError);
    }


    return {
      source: 'odoo',
      courses,
      units,
      playlists,
    };
  } catch (error) {
    console.error('[catalogSource] Odoo fetch failed, falling back to mock data:', error);
    // Graceful fallback: return mock data instead of failing completely
    return {
      source: 'mock',
      courses: DEGREES,
      units: COURSE_UNITS,
      playlists: PLAYLISTS,
    };
  }
}

/**
 * Find playlist for a given curricular unit by matching courseId + unitId
 * to playlist course_code + unit_code fields
 */
export function findPlaylistForUnit(unit: CurricularUnit, playlists: Playlist[]): Playlist | null {
  return playlists.find(
    playlist => playlist.course_code === unit.courseId && playlist.unit_code === unit.id
  ) || null;
}
