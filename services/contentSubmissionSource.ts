import { supabase } from './supabase';
import { ContentSubmission } from '../types';
import { Database } from './supabase.types';

type ContentSubmissionRow = Database['public']['Tables']['content_submissions']['Row'];
type ContentSubmissionInsert = Database['public']['Tables']['content_submissions']['Insert'];
type ContentSubmissionUpdate = Database['public']['Tables']['content_submissions']['Update'];

/**
 * Service for managing content submissions in the curator workflow.
 * Handles creation, listing, filtering, and status updates of submissions.
 */

export interface SubmitContentData {
  content_type: 'video' | 'article' | 'interactive' | 'other';
  url?: string;
  youtube_video_id?: string;
  suggested_title: string;
  summary?: string;
  course_id?: string;
  unit_id?: string;
  topic?: string;
  pedagogical_reason?: string;
  tags?: string[];
  additional_notes?: string;
}

export interface SubmissionFilters {
  status?: ContentSubmission['status'];
  content_type?: ContentSubmission['content_type'];
  course_id?: string;
  unit_id?: string;
  assigned_to?: string;
  limit?: number;
  offset?: number;
}

/**
 * Submit new content for review.
 * Stores submission with initial 'pending' status.
 * Prevents duplicate submissions (same author + URL with active status).
 */
export async function submitContent(data: SubmitContentData): Promise<ContentSubmission | null> {
  try {
    // Prefer locally restored session user to avoid unnecessary remote auth roundtrip.
    // Fallback to getUser when session is not available.
    const { data: { session } } = await supabase.auth.getSession();
    let user = session?.user ?? null;

    if (!user) {
      const { data: { user: fetchedUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !fetchedUser) {
        throw new Error('auth_required');
      }
      user = fetchedUser;
    }

    // Get user profile for author_name and author_email
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('display_name, username')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.warn('Could not fetch user profile:', profileError);
    }

    // Check for existing active submission with same URL
    if (data.url) {
      const { data: existing } = await supabase
        .from('content_submissions')
        .select('id')
        .eq('author_id', user.id)
        .eq('url', data.url)
        .in('status', ['pending', 'submitted', 'in_review'])
        .limit(1);

      if (existing && existing.length > 0) {
        throw new Error('submission_duplicate');
      }
    }

    // Create submission
    const { data: newSubmission, error: insertError } = await supabase
      .from('content_submissions')
      .insert({
        content_type: data.content_type,
        url: data.url,
        youtube_video_id: data.youtube_video_id,
        suggested_title: data.suggested_title,
        summary: data.summary,
        course_id: data.course_id,
        unit_id: data.unit_id,
        topic: data.topic,
        pedagogical_reason: data.pedagogical_reason,
        tags: data.tags || [],
        additional_notes: data.additional_notes,
        author_id: user.id,
        author_email: user.email || null,
        author_name: profile?.display_name || profile?.username || null,
        status: 'pending',
      } as ContentSubmissionInsert)
      .select()
      .single();

    if (insertError || !newSubmission) {
      throw insertError || new Error('insert_failed');
    }

    return mapContentSubmissionRow(newSubmission);
  } catch (error) {
    if (error instanceof Error && error.message === 'submission_duplicate') {
      console.warn('submitContent duplicate ignored for existing active submission');
      throw error;
    }
    console.error('submitContent error:', error);
    throw error;
  }
}

/**
 * Get user's own submissions with optional status filter.
 */
export async function getMySubmissions(
  status?: ContentSubmission['status'],
  limit = 50,
  offset = 0
): Promise<{ submissions: ContentSubmission[]; total: number }> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('auth_required');
    }

    let query = supabase
      .from('content_submissions')
      .select('*', { count: 'exact' })
      .eq('author_id', user.id);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    return {
      submissions: (data || []).map(mapContentSubmissionRow),
      total: count || 0,
    };
  } catch (error) {
    console.error('getMySubmissions error:', error);
    throw error;
  }
}

/**
 * Get a single submission detail by ID (user can see own, admin can see all).
 */
export async function getSubmissionDetail(submissionId: string): Promise<ContentSubmission | null> {
  try {
    const { data, error } = await supabase
      .from('content_submissions')
      .select()
      .eq('id', submissionId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found
        return null;
      }
      throw error;
    }

    return data ? mapContentSubmissionRow(data) : null;
  } catch (error) {
    console.error('getSubmissionDetail error:', error);
    throw error;
  }
}

/**
 * List submissions for admin review dashboard.
 * Supports filtering by status, content_type, course_id, unit_id, assigned_to.
 */
export async function getAdminQueue(filters: SubmissionFilters): Promise<{ submissions: ContentSubmission[]; total: number }> {
  try {
    const {
      status,
      content_type,
      course_id,
      unit_id,
      assigned_to,
      limit = 50,
      offset = 0,
    } = filters;

    let query = supabase
      .from('content_submissions')
      .select('*', { count: 'exact' });

    if (status) {
      query = query.eq('status', status);
    }
    if (content_type) {
      query = query.eq('content_type', content_type);
    }
    if (course_id) {
      query = query.eq('course_id', course_id);
    }
    if (unit_id) {
      query = query.eq('unit_id', unit_id);
    }
    if (assigned_to) {
      query = query.eq('assigned_to', assigned_to);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    return {
      submissions: (data || []).map(mapContentSubmissionRow),
      total: count || 0,
    };
  } catch (error) {
    console.error('getAdminQueue error:', error);
    throw error;
  }
}

/**
 * Update submission status in the review workflow.
 * Admin operation: can transition to any valid status.
 */
export async function updateSubmissionStatus(
  submissionId: string,
  status: ContentSubmission['status'],
  options?: {
    reviewNotes?: string;
    rejectionReason?: string;
    assignedTo?: string;
  }
): Promise<ContentSubmission | null> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('auth_required');
    }

    const updateData: ContentSubmissionUpdate = {
      status,
      review_notes: options?.reviewNotes || null,
      rejection_reason: options?.rejectionReason || null,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    };

    if (options?.assignedTo) {
      updateData.assigned_to = options.assignedTo;
    }

    const { data, error } = await supabase
      .from('content_submissions')
      .update(updateData)
      .eq('id', submissionId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data ? mapContentSubmissionRow(data) : null;
  } catch (error) {
    console.error('updateSubmissionStatus error:', error);
    throw error;
  }
}

/**
 * Update submission metadata before approval (admin operation).
 * Allows editing fields like suggested_title, summary, tags, pedagogical_reason.
 */
export async function editSubmissionMetadata(
  submissionId: string,
  updates: {
    suggested_title?: string;
    summary?: string;
    tags?: string[];
    pedagogical_reason?: string;
    topic?: string;
  }
): Promise<ContentSubmission | null> {
  try {
    const { data, error } = await supabase
      .from('content_submissions')
      .update(updates)
      .eq('id', submissionId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data ? mapContentSubmissionRow(data) : null;
  } catch (error) {
    console.error('editSubmissionMetadata error:', error);
    throw error;
  }
}

/**
 * Get submission count by status (for admin dashboard summary).
 */
export async function getSubmissionCountByStatus(): Promise<Record<string, number>> {
  try {
    const { data, error } = await supabase
      .from('content_submissions')
      .select('status');

    if (error) {
      throw error;
    }

    const counts: Record<string, number> = {};
    (data || []).forEach((row) => {
      counts[row.status] = (counts[row.status] || 0) + 1;
    });

    return counts;
  } catch (error) {
    console.error('getSubmissionCountByStatus error:', error);
    throw error;
  }
}

/**
 * Map Supabase row to frontend ContentSubmission type.
 */
function mapContentSubmissionRow(row: ContentSubmissionRow): ContentSubmission {
  return {
    id: row.id,
    content_type: row.content_type as ContentSubmission['content_type'],
    url: row.url,
    youtube_video_id: row.youtube_video_id,
    suggested_title: row.suggested_title,
    summary: row.summary,
    course_id: row.course_id,
    unit_id: row.unit_id,
    topic: row.topic,
    pedagogical_reason: row.pedagogical_reason,
    tags: row.tags || [],
    additional_notes: row.additional_notes,
    author_id: row.author_id,
    author_email: row.author_email,
    author_name: row.author_name,
    status: row.status as ContentSubmission['status'],
    review_notes: row.review_notes,
    reviewed_by: row.reviewed_by,
    reviewed_at: row.reviewed_at,
    assigned_to: row.assigned_to,
    rejection_reason: row.rejection_reason,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/**
 * Error codes for UI error handling:
 * - auth_required: User not authenticated
 * - submission_duplicate: User has an active submission with same URL
 * - insert_failed: Database insert failed
 * - PGRST116: No rows found (from Supabase)
 */
