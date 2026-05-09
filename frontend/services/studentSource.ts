/**
 * studentSource.ts
 * Student-specific backend API layer for enrollment, progress tracking, and dashboard.
 * Uses supabase singleton client and follows RLS-per-user pattern.
 * All operations enforce auth.uid() = user_id at database level.
 */

import { supabase } from './supabase';
import { Database } from './supabase.types';

export type CourseEnrollment = Database['public']['Tables']['course_enrollments']['Row'];
export type ContentProgress = Database['public']['Tables']['content_progress']['Row'];
export type StudentActivityEvent = Database['public']['Tables']['student_activity_events']['Row'];

export interface StudentDashboardData {
  enrolledCourses: CourseEnrollment[];
  totalProgress: number;
  continueWatching: ContentProgress[];
  recentActivity: StudentActivityEvent[];
}

/**
 * Enroll user in a course. Checks for duplicate enrollment via UNIQUE constraint.
 * Creates course_enrollments record with status='active' and initial progress=0.
 */
export async function enrollInCourse(courseId: string): Promise<CourseEnrollment> {
  const { data: session } = await supabase.auth.getSession();
  if (!session?.session?.user?.id) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('course_enrollments')
    .insert({
      user_id: session.session.user.id,
      course_id: courseId,
      status: 'active',
      progress_percentage: 0,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      // Unique constraint violation - already enrolled
      throw new Error('Already enrolled in this course');
    }
    throw error;
  }

  return data;
}

/**
 * Get user's enrolled courses with current progress.
 * Returns courses ordered by last_accessed_at DESC (most recent first).
 */
export async function getMyCourses(): Promise<CourseEnrollment[]> {
  const { data: session } = await supabase.auth.getSession();
  if (!session?.session?.user?.id) {
    return [];
  }

  const { data, error } = await supabase
    .from('course_enrollments')
    .select('*')
    .eq('user_id', session.session.user.id)
    .eq('status', 'active')
    .order('last_accessed_at', { ascending: false, nullsFirst: false })
    .order('enrolled_at', { ascending: false });

  if (error) {
    console.error('Error fetching courses:', error);
    return [];
  }

  return data || [];
}

/**
 * Get progress for a specific course by aggregating content_progress records.
 * Returns completion percentage and list of progressed content.
 */
export async function getCourseProgress(courseId: string): Promise<{
  totalProgress: number;
  contents: ContentProgress[];
}> {
  const { data: session } = await supabase.auth.getSession();
  if (!session?.session?.user?.id) {
    return { totalProgress: 0, contents: [] };
  }

  const { data, error } = await supabase
    .from('content_progress')
    .select('*')
    .eq('user_id', session.session.user.id)
    .eq('course_id', courseId)
    .order('last_accessed_at', { ascending: false });

  if (error) {
    console.error('Error fetching course progress:', error);
    return { totalProgress: 0, contents: [] };
  }

  const contents = data || [];
  const completedCount = contents.filter(c => c.status === 'completed').length;
  const totalProgress = contents.length > 0 ? Math.round((completedCount / contents.length) * 100) : 0;

  return { totalProgress, contents };
}

/**
 * Get progress for a specific curricular unit.
 * Returns completion percentage and list of progressed content in that unit.
 */
export async function getUnitProgress(unitId: string): Promise<{
  totalProgress: number;
  contents: ContentProgress[];
}> {
  const { data: session } = await supabase.auth.getSession();
  if (!session?.session?.user?.id) {
    return { totalProgress: 0, contents: [] };
  }

  const { data, error } = await supabase
    .from('content_progress')
    .select('*')
    .eq('user_id', session.session.user.id)
    .eq('curricular_unit_id', unitId)
    .order('last_accessed_at', { ascending: false });

  if (error) {
    console.error('Error fetching unit progress:', error);
    return { totalProgress: 0, contents: [] };
  }

  const contents = data || [];
  const completedCount = contents.filter(c => c.status === 'completed').length;
  const totalProgress = contents.length > 0 ? Math.round((completedCount / contents.length) * 100) : 0;

  return { totalProgress, contents };
}

/**
 * Update or create content progress. Tracks video watch time and completion status.
 * Uses upsert pattern: ON CONFLICT DO UPDATE.
 */
export async function updateContentProgress(
  contentId: string,
  unitId?: string,
  courseId?: string,
  contentType: string = 'video',
  status: 'not_started' | 'started' | 'in_progress' | 'completed' = 'in_progress',
  watchSeconds?: number,
  durationSeconds?: number
): Promise<ContentProgress> {
  const { data: session } = await supabase.auth.getSession();
  if (!session?.session?.user?.id) {
    throw new Error('User not authenticated');
  }

  const progressPercentage = durationSeconds && watchSeconds
    ? Math.round((watchSeconds / durationSeconds) * 100)
    : 0;

  const { data, error } = await supabase
    .from('content_progress')
    .upsert({
      user_id: session.session.user.id,
      content_id: contentId,
      curricular_unit_id: unitId || null,
      course_id: courseId || null,
      content_type: contentType,
      status,
      progress_percentage: progressPercentage,
      watch_seconds: watchSeconds || 0,
      duration_seconds: durationSeconds || null,
      first_accessed_at: new Date().toISOString(),
      last_accessed_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id,course_id,curricular_unit_id,content_id,content_type',
    })
    .select()
    .single();

  if (error) {
    console.error('Error updating content progress:', error);
    throw error;
  }

  return data;
}

/**
 * Mark content as completed. Sets status='completed' and completed_at timestamp.
 */
export async function markContentAsCompleted(
  contentId: string,
  unitId?: string,
  courseId?: string,
  contentType: string = 'video'
): Promise<ContentProgress> {
  const { data: session } = await supabase.auth.getSession();
  if (!session?.session?.user?.id) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('content_progress')
    .update({
      status: 'completed',
      progress_percentage: 100,
      completed_at: new Date().toISOString(),
      last_accessed_at: new Date().toISOString(),
    })
    .eq('user_id', session.session.user.id)
    .eq('content_id', contentId)
    .eq('curricular_unit_id', unitId || null)
    .eq('course_id', courseId || null)
    .eq('content_type', contentType)
    .select()
    .single();

  if (error) {
    console.error('Error marking content as completed:', error);
    throw error;
  }

  return data;
}

/**
 * Get videos to continue watching. Returns content in progress with last_accessed_at
 * ordered by most recent, ready for resume functionality.
 */
export async function getContinueWatching(limit: number = 5): Promise<ContentProgress[]> {
  const { data: session } = await supabase.auth.getSession();
  if (!session?.session?.user?.id) {
    return [];
  }

  const { data, error } = await supabase
    .from('content_progress')
    .select('*')
    .eq('user_id', session.session.user.id)
    .eq('content_type', 'video')
    .in('status', ['started', 'in_progress'])
    .order('last_accessed_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching continue watching:', error);
    return [];
  }

  return data || [];
}

/**
 * Get student dashboard data: enrolled courses, progress summary, recent activity.
 * Aggregates data across multiple tables for dashboard view.
 */
export async function getStudentDashboard(): Promise<StudentDashboardData> {
  const { data: session } = await supabase.auth.getSession();
  if (!session?.session?.user?.id) {
    return {
      enrolledCourses: [],
      totalProgress: 0,
      continueWatching: [],
      recentActivity: [],
    };
  }

  try {
    // Fetch enrolled courses
    const { data: courses, error: coursesError } = await supabase
      .from('course_enrollments')
      .select('*')
      .eq('user_id', session.session.user.id)
      .eq('status', 'active')
      .order('last_accessed_at', { ascending: false, nullsFirst: false });

    if (coursesError) throw coursesError;

    // Fetch continue watching
    const { data: continueWatching, error: continueError } = await supabase
      .from('content_progress')
      .select('*')
      .eq('user_id', session.session.user.id)
      .eq('content_type', 'video')
      .in('status', ['started', 'in_progress'])
      .order('last_accessed_at', { ascending: false })
      .limit(5);

    if (continueError) throw continueError;

    // Fetch recent activity (last 10 events, last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: activities, error: activitiesError } = await supabase
      .from('student_activity_events')
      .select('*')
      .eq('user_id', session.session.user.id)
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(10);

    if (activitiesError) throw activitiesError;

    // Calculate aggregate progress
    const { data: allProgress, error: progressError } = await supabase
      .from('content_progress')
      .select('*')
      .eq('user_id', session.session.user.id);

    if (progressError) throw progressError;

    const completedCount = (allProgress || []).filter(p => p.status === 'completed').length;
    const totalProgress = (allProgress || []).length > 0
      ? Math.round((completedCount / (allProgress || []).length) * 100)
      : 0;

    return {
      enrolledCourses: courses || [],
      totalProgress,
      continueWatching: continueWatching || [],
      recentActivity: activities || [],
    };
  } catch (error) {
    console.error('Error fetching student dashboard:', error);
    return {
      enrolledCourses: [],
      totalProgress: 0,
      continueWatching: [],
      recentActivity: [],
    };
  }
}

/**
 * Get recommendations for student based on:
 * 1. Enrolled courses with low progress
 * 2. Incomplete units in active courses
 * 3. Suggested learning paths
 */
export async function getStudentRecommendations(): Promise<{
  courseRecommendations: CourseEnrollment[];
}> {
  const { data: session } = await supabase.auth.getSession();
  if (!session?.session?.user?.id) {
    return { courseRecommendations: [] };
  }

  // Get enrolled courses with progress < 100%
  const { data: courses, error } = await supabase
    .from('course_enrollments')
    .select('*')
    .eq('user_id', session.session.user.id)
    .eq('status', 'active')
    .lt('progress_percentage', 100)
    .order('progress_percentage', { ascending: true })
    .limit(5);

  if (error) {
    console.error('Error fetching recommendations:', error);
    return { courseRecommendations: [] };
  }

  return {
    courseRecommendations: courses || [],
  };
}
