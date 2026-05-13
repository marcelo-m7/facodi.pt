-- Add covering indexes for student_activity_events foreign keys
-- This addresses performance-advisor warnings for unindexed FK columns used in joins/filters.

create index if not exists idx_student_activity_events_course_id
  on public.student_activity_events (course_id);

create index if not exists idx_student_activity_events_curricular_unit_id
  on public.student_activity_events (curricular_unit_id);

create index if not exists idx_student_activity_events_content_id
  on public.student_activity_events (content_id);
