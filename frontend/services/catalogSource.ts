import { supabase } from './supabase';
import { COURSE_UNITS } from '../data/courses';
import { DEGREES } from '../data/degrees';
import { PLAYLISTS } from '../data/playlists';
import { Category, Course, CurricularUnit, Difficulty, Playlist } from '../types';

export type CatalogSource = 'mock' | 'supabase';

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

    const mockUnit = COURSE_UNITS.find(u => u.id === row.code);

    return {
      id: row.code,
      name: row.name,
      description: row.summary || row.content || mockUnit?.description || '',
      content: row.content ?? mockUnit?.content ?? undefined,
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

export async function loadCatalogData(): Promise<CatalogPayload> {
  if (DATA_SOURCE === 'supabase') {
    try {
      return await loadSupabaseData();
    } catch (supabaseError) {
      console.error('[catalogSource:supabase] Failed, falling back to mock:', supabaseError);
      return { source: 'mock', courses: DEGREES, units: COURSE_UNITS, playlists: PLAYLISTS };
    }
  }

  // Default path: mock catalog.
  return {
    source: 'mock',
    courses: DEGREES,
    units: COURSE_UNITS,
    playlists: PLAYLISTS,
  };
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
