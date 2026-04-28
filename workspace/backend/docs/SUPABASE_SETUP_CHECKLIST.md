# FACODI Supabase Setup Checklist

**Date Started:** ________________  
**Target Completion:** Week 1  
**Status:** Not Started

---

## Phase 1: Project & Credentials (1 day)

- [ ] Create Supabase project at supabase.com
- [ ] Copy Project URL: ___________________________________
- [ ] Copy Service Role Key: ___________________________________
- [ ] Copy Anon Key: ___________________________________
- [ ] Add credentials to `.env.local`
- [ ] Run `supabase_setup.py` validation script ✓
  - Result: ✓ Connection OK / ✗ Failed (fix and retry)

---

## Phase 2: Schema & Tables (2 days)

### 2a. Schema Creation
- [ ] In Supabase Dashboard → SQL Editor, execute:
  ```sql
  CREATE SCHEMA IF NOT EXISTS facodi;
  GRANT USAGE ON SCHEMA facodi TO authenticated, anon;
  ```
- [ ] Verify schema exists in Supabase Dashboard

### 2b. Create Tables
Follow the SQL statements output by `supabase_setup.py`:

- [ ] Create `facodi.courses` table
- [ ] Create `facodi.modules` table
- [ ] Create `facodi.lessons` table
- [ ] Create `facodi.users` table
- [ ] Create `facodi.user_progress` table
- [ ] Create `facodi.playlists` table
- [ ] Create `facodi.playlist_items` table
- [ ] Create all indexes
- [ ] Verify all tables exist

### 2c. Test Connection
```bash
python scripts/supabase_setup.py
# Should show:
# ✓ 7 tables found in facodi schema
# ✓ All required tables exist
```

---

## Phase 3: Security (1 day)

### 3a. Enable Row Level Security
- [ ] In SQL Editor, enable RLS:
  ```sql
  ALTER TABLE facodi.courses ENABLE ROW LEVEL SECURITY;
  ALTER TABLE facodi.modules ENABLE ROW LEVEL SECURITY;
  ALTER TABLE facodi.lessons ENABLE ROW LEVEL SECURITY;
  ALTER TABLE facodi.users ENABLE ROW LEVEL SECURITY;
  ALTER TABLE facodi.user_progress ENABLE ROW LEVEL SECURITY;
  ALTER TABLE facodi.playlists ENABLE ROW LEVEL SECURITY;
  ALTER TABLE facodi.playlist_items ENABLE ROW LEVEL SECURITY;
  ```
- [ ] Create RLS policies (see guide section 5)
- [ ] Test policies with sample queries

### 3b. Verify Access Control
- [ ] Try SELECT from courses (should work for all)
- [ ] Try SELECT user_progress without auth (should return 0 rows)
- [ ] Try SELECT user_progress with auth (should only show your data)

---

## Phase 4: Authentication (2 days)

### 4a. Configure Auth Providers
- [ ] Email/Password: Enabled ✓
- [ ] Google OAuth: ☐ (if enabled)
- [ ] GitHub OAuth: ☐ (if enabled)
- [ ] Email confirmation: Required (Yes)

### 4b. Setup Email
- [ ] Go to Supabase → Authentication → Email Templates
- [ ] Use default (Supabase SMTP) OR configure custom SMTP
- [ ] Test email delivery

### 4c. Configure Redirect URLs
- [ ] Development: `http://localhost:3000/auth/callback`
- [ ] Production: `https://facodi.pt/auth/callback`

### 4d. Test Auth in Code
```python
from supabase import create_client

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# Test signup
response = supabase.auth.sign_up({
    "email": "test@example.com",
    "password": "TestPassword123!"
})
assert response.user is not None

# Test signin
response = supabase.auth.sign_in_with_password({
    "email": "test@example.com",
    "password": "TestPassword123!"
})
assert response.session is not None

print("✓ Auth working")
```

---

## Phase 5: Sample Data (1 day)

### 5a. Insert Test Course
```sql
INSERT INTO facodi.courses (title, description, category, level)
VALUES (
    'Calculus 101',
    'Introduction to differential and integral calculus',
    'Mathematics',
    'beginner'
);
```

### 5b. Insert Test Module
```sql
INSERT INTO facodi.modules (course_id, title, order_index)
SELECT id, 'Limits and Continuity', 1
FROM facodi.courses
WHERE title = 'Calculus 101';
```

### 5c. Insert Test Lesson
```sql
INSERT INTO facodi.lessons (module_id, title, description, video_url, duration_seconds, order_index, is_preview)
SELECT id, 'What is a Limit?', 'Understanding limits concept', 
    'https://www.youtube.com/watch?v=...', 1245, 1, true
FROM facodi.modules
WHERE title = 'Limits and Continuity';
```

### 5d. Verify Data
- [ ] Query courses: returns 1 row
- [ ] Query modules: returns 1 row
- [ ] Query lessons: returns 1 row
- [ ] Query nested (courses + modules + lessons): works ✓

---

## Phase 6: Frontend Integration (2 days)

### 6a. Install Client Library
```bash
cd frontend
npm install @supabase/supabase-js
```

### 6b. Setup Environment
Create `frontend/.env.local`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

### 6c. Create Supabase Service
Create `frontend/src/services/supabaseClient.ts`:
```typescript
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

### 6d. Build Course Listing Page
- [ ] Fetch courses from `facodi.courses` table
- [ ] Display courses with description, category, level
- [ ] Add link to course detail page

### 6e. Build Course Detail Page
- [ ] Fetch course with nested modules and lessons
- [ ] Display modules with lessons in order
- [ ] Add lesson video player
- [ ] Add "Mark Complete" button for authenticated users

### 6f. Build Lesson Progress Tracker
- [ ] On lesson play: update user_progress (progress_percentage)
- [ ] On lesson complete: set completed = true
- [ ] Show progress bar/badge across course
- [ ] Allow resume from last watched position

---

## Phase 7: Backend Integration (3 days)

### 7a. Setup Backend Client
Create backend service:
```python
from supabase import create_client

supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_ROLE_KEY')
)
```

### 7b. API Endpoints

**GET /api/courses**
- [ ] Fetch all courses with pagination
- [ ] Add filtering by category/level
- [ ] Add search support

**GET /api/courses/{id}**
- [ ] Fetch single course with modules and lessons
- [ ] Include enrollment status if user authenticated

**GET /api/learner/progress**
- [ ] Authenticated endpoint: fetch user's course progress
- [ ] Calculate completion percentage per course

**POST /api/learner/progress**
- [ ] Authenticated endpoint: update lesson progress
- [ ] Log progress change (user_id, lesson_id, timestamp)

### 7c. Admin Endpoints (Service Role)

**POST /api/admin/courses**
- [ ] Create new course

**PUT /api/admin/courses/{id}**
- [ ] Update course

**POST /api/admin/modules**
- [ ] Create module

**POST /api/admin/lessons**
- [ ] Create lesson

---

## Phase 8: Testing (1 day)

### 8a. Unit Tests
- [ ] Test course queries
- [ ] Test user progress updates
- [ ] Test authentication flows
- [ ] Test RLS policies (unauthorized access blocked)

### 8b. Integration Tests
- [ ] Test signup → create user_profile → show in dashboard
- [ ] Test course browse → enroll → watch lesson → see progress
- [ ] Test admin create course → appear in public listing

### 8c. Performance Tests
- [ ] Time to load courses (target < 200ms)
- [ ] Time to load course with 100 lessons (target < 500ms)
- [ ] Time to update progress (target < 100ms)

### 8d. Security Tests
- [ ] Verify cannot access another user's progress
- [ ] Verify cannot call admin endpoints without service role
- [ ] Verify cannot modify completed status of others' progress
- [ ] Verify deleted course removes associated data (cascading)

---

## Phase 9: Documentation & Deployment (1 day)

### 9a. Code Documentation
- [ ] Document all API endpoints
- [ ] Document database schema
- [ ] Add inline comments for complex queries
- [ ] Create API postman collection for testing

### 9b. Operational Documents
- [ ] Backup & recovery procedures
- [ ] Monitoring dashboards
- [ ] Incident response plan
- [ ] Scaling checklist for high traffic

### 9c. Deployment
- [ ] Test in staging environment
- [ ] Run security audit (Supabase advisors)
- [ ] Create migration scripts if needed
- [ ] Deploy to production
- [ ] Monitor for errors/performance issues

---

## Phase 10: Launch Readiness (1 day)

### Final Validation
- [ ] All tests passing ✓
- [ ] No console errors in browser
- [ ] No errors in backend logs
- [ ] Performance acceptable (all response times < 500ms)
- [ ] Security audit passed
- [ ] Backups configured and tested
- [ ] Team trained on operations

### Go-Live Checklist
- [ ] Notify users (migration email if existing platform)
- [ ] Monitor first 24 hours closely
- [ ] Have rollback plan ready
- [ ] Collect feedback from early users
- [ ] Prepare post-launch iteration list

---

## Notes & Issues

```
Issue 1: ________________________________________
Status: ○ Not Started  ○ In Progress  ◉ Resolved
Notes:  ________________________________________

Issue 2: ________________________________________
Status: ○ Not Started  ○ In Progress  ○ Resolved
Notes:  ________________________________________
```

---

## Sign-Off

- [ ] All phases complete
- [ ] All tests passing
- [ ] Team trained
- [ ] Ready for production

**Completed By:** ________________ **Date:** ________

**Team Approval:** ________________ **Date:** ________

---

## Contact & Support

- **Supabase Support:** https://supabase.com/support
- **Docs:** https://supabase.com/docs
- **Community:** https://discord.gg/supabase
- **Status:** https://status.supabase.com
