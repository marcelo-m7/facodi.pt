# Website_Slides Module — Deep Reference Guide

## Overview

**website_slides** is Odoo's native eLearning module that provides course/channel management, slide content, quizzes, and learner progress tracking. It powers online learning platforms without requiring separate LMS integration.

**Instance Status**: edu-facodi.odoo.com
- **Active Courses**: 2 (slide.channel records)
- **Total Slides**: 134 (slide.slide records)
- **Total Tags**: 10 (slide.tag records)
- **Student Enrollments**: 2 (slide.channel.partner records)
- **External Resources**: 25 (slide.slide.resource records)

---

## Core Data Model Architecture

### 1. slide.channel (Course/Learning Path)

**Purpose**: Represents a course, track, or learning journey. This is the top-level container for all learning content.

**Key Fields** (149 total):

#### Identity & Metadata
- `id` — unique channel ID
- `name` (char) — channel display name
- `description` (text) — full course description
- `description_short` (text) — brief summary
- `sequence` (integer) — order in listings
- `slug` (char) — URL-friendly identifier (e.g., `/slides/my-course`)

#### Visibility & Access Control
- `is_published` (boolean) — make channel public
- `is_preview` (boolean) — allow preview before enrollment
- `channel_type` (selection) — `training` (paid/managed) or `documentation` (free/open)
- `visibility` (selection) — `public` | `members` | `invite` | `link_only`
- `website_id` (many2one → website) — linked website for multi-site scenarios

#### Enrollment & Gamification
- `enroll_msg` (text) — message shown on enrollment
- `partner_ids` (many2many → res.partner) — enrolled learners
- `total_views` (integer) — aggregated view count
- `rating_avg` (float) — average rating from learners
- `rating_ids` (one2many → rating.rating) — detailed ratings

#### Communication (mail.thread mixin)
- `message_ids` (one2many → mail.message) — channel discussion thread
- `message_follower_ids` (one2many → mail.followers) — followers
- `message_partner_ids` (many2many → res.partner) — message participants
- `website_message_ids` (one2many → mail.message) — website chat messages
- `website_published` (boolean) — publish to website

#### Activities & Notifications
- `activity_ids` (one2many → mail.activity) — scheduled tasks
- `activity_type_id` (many2one → mail.activity.type) — activity type
- `activity_user_id` (many2one → res.users) — assigned to user
- `activity_calendar_event_id` (many2one → calendar.event) — linked calendar event

#### Content Organization
- `slide_ids` (one2many → slide.slide) — all slides in channel
- `slides_count` (computed) — total slide count
- `category_id` (many2one → slide.slide) — category slide (if hierarchical)
- `document_ids` (one2many) — downloadable documents
- `quiz_first_attempt_reward` (integer) — gamification points

#### FACODI Semantic Extensions (23 custom fields)
- `x_facodi_level` (selection) — **Fundamentos** | **Intermediário** | **Avançado**
- `x_facodi_journey_name` (char) — friendly jornada identifier
- `x_facodi_workload_hours` (float) — estimated learning hours
- `x_facodi_roadmap` (text) — learning path narrative
- `x_facodi_certification_enabled` (boolean) — enable certification on completion
- `x_facodi_project_name` (char) — source project name
- `x_facodi_project_slug` (char) — project identifier
- `x_facodi_project_site` (char) — project website URL
- `x_facodi_source_institution` (char) — partnering institution
- `x_facodi_source_type` (char) — e.g., "Académica", "Corporativa"
- `x_facodi_source_api_doc` (char) — API documentation URL
- `x_facodi_company_name` (char) — company/org name
- `x_facodi_company_site` (char) — company website
- `x_facodi_company_tagline` (text) — company short description
- `x_facodi_company_manifesto` (text) — company mission/values
- `x_facodi_partnership_model` (char) — partnership type
- `x_facodi_content_license` (char) — license type (e.g., CC-BY-4.0)
- `x_facodi_primary_language` (char) — main language code
- `x_facodi_supported_languages` (text) — comma-separated language list
- `x_facodi_editorial_state` (char) — editorial workflow state
- `x_facodi_curriculum_version` (char) — curriculum version identifier
- `x_facodi_dictionary_version` (char) — competency dictionary version
- `x_facodi_project_value_proposition` (text) — value proposition

**Example Query**:
```python
# Get all FACODI courses by level
courses = models.execute_kw(db, uid, pwd, 'slide.channel', 'search_read', 
    [[('x_facodi_level', 'in', ['Fundamentos', 'Intermediário'])]],
    {'fields': ['id', 'name', 'x_facodi_level', 'x_facodi_workload_hours']})
```

---

### 2. slide.slide (Slide/Content Unit)

**Purpose**: Represents individual content items (lessons, videos, quizzes, articles) within a channel.

**Key Fields** (115 total):

#### Identity & Content Type
- `id` — unique slide ID
- `name` (char) — slide title
- `sequence` (integer) — order within channel
- `slide_type` (selection) — **article** | **video** | **infographic** | **webpage** | **quiz**
- `description` (text) — slide content (for article type)
- `html_content` (html) — rich HTML content
- `url` (char) — external URL (for webpage/video type)
- `video_source_type` (selection) — `youtube` | `vimeo` | `url`

#### Relationships
- `channel_id` (many2one → slide.channel) — parent course
- `category_id` (many2one → slide.slide) — parent category (hierarchical structure)
- `slide_ids` (one2many → slide.slide) — child slides (if this is a category)
- `tag_ids` (many2many → slide.tag) — content tags/topics

#### Content Metadata
- `duration` (float) — video duration in minutes
- `slide_views` (integer) — total views
- `likes` (integer) — user likes count
- `dislikes` (integer) — user dislikes count
- `rating_avg` (float) — average rating
- `rating_ids` (one2many → rating.rating) — detailed ratings
- `has_document` (boolean) — has downloadable attachment

#### Quiz & Assessment
- `question_ids` (one2many → slide.question) — quiz questions
- `questions_count` (computed) — total question count
- `quiz_first_attempt_reward` (integer) — gamification points for first attempt

#### Learner Tracking
- `partner_ids` (many2many → slide.slide.partner) — learners who viewed this slide
- `slide_partner_ids` (one2many → slide.slide.partner) — detailed tracking
- `public_views` (integer) — unauthenticated views

#### FACODI Semantic Extensions (14 custom fields)
- `x_facodi_unit_code` (char) — curriculum unit identifier (e.g., "UC001")
- `x_facodi_content_kind` (selection) — **video** | **exercise** | **reading** | **quiz** | **interactive**
- `x_facodi_duration_minutes` (integer) — estimated content duration
- `x_facodi_competency` (char) — target competency/skill
- `x_facodi_project_name` (char) — source project
- `x_facodi_project_slug` (char) — project identifier
- `x_facodi_source_type` (char) — content source type
- `x_facodi_source_institution` (char) — source institution
- `x_facodi_primary_language` (char) — content language
- `x_facodi_content_license` (char) — content license
- `x_facodi_editorial_state` (char) — editorial state
- `x_facodi_curriculum_version` (char) — curriculum version
- `x_facodi_dictionary_version` (char) — dictionary version
- `x_facodi_company_name` (char) — company/org name

**Example Query**:
```python
# Get all content units for course 9 filtered by competency
slides = models.execute_kw(db, uid, pwd, 'slide.slide', 'search_read',
    [[('channel_id', '=', 9), ('x_facodi_competency', 'ilike', 'Segurança')]],
    {'fields': ['id', 'name', 'slide_type', 'x_facodi_unit_code', 'x_facodi_duration_minutes'],
     'order': 'sequence asc'})
```

---

### 3. slide.channel.partner (Student Enrollment/Progress)

**Purpose**: Tracks which learners are enrolled in which channels, and their progress (completed slides, completion status).

**Key Fields** (22 total):

#### Relationships
- `channel_id` (many2one → slide.channel) — course reference
- `partner_id` (many2one → res.partner) — enrolled learner
- `channel_user_id` (many2one → res.users) — if learner is a user
- `channel_website_id` (many2one → website) — website context

#### Progress Tracking
- `completion_time` (float) — time spent in hours
- `last_activity_date` (datetime) — last access timestamp
- `completed` (boolean) — all required slides completed?
- `completion_slide_count` (integer) — number of slides completed
- `next_slide_id` (many2one → slide.slide) — suggested next slide
- `quizz_score` (float) — quiz average score
- `quiz_attempt_count` (integer) — number of quiz attempts

#### FACODI Semantic Extension (1 custom field)
- `x_facodi_participation_note` (text) — instructor notes on student progress

**Queries**:
```python
# Get learner progress for course 9
progress = models.execute_kw(db, uid, pwd, 'slide.channel.partner', 'search_read',
    [[('channel_id', '=', 9)]],
    {'fields': ['id', 'partner_id', 'completion_slide_count', 'completed', 'x_facodi_participation_note']})

# Mark course as completed
models.execute_kw(db, uid, pwd, 'slide.channel.partner', 'write',
    [partner_id], {'completed': True})
```

---

### 4. slide.slide.partner (Individual Slide Tracking)

**Purpose**: Detailed learner-slide interaction tracking. Records which learners viewed which slides.

**Key Fields** (13 total):

#### Relationships
- `slide_id` (many2one → slide.slide) — specific slide
- `channel_id` (many2one → slide.channel) — parent course
- `partner_id` (many2one → res.partner) — learner
- `create_uid` / `write_uid` (many2one → res.users) — audit trail

#### Interaction Data
- `is_favorite` (boolean) — learner bookmarked this slide
- `quiz_points_on_previous_attempt` (float) — previous quiz score (if applicable)

---

### 5. slide.tag (Content Tags/Topics)

**Purpose**: Taxonomy for organizing and categorizing slide content. Flexible tagging system for knowledge areas.

**Key Fields** (7 total):

#### Taxonomy Metadata
- `id` — tag ID
- `name` (char) — tag name (e.g., "Segurança Digital", "UX/UI")
- `create_date` / `write_date` — audit timestamps
- `create_uid` / `write_uid` — audit users

**FACODI Taxonomy** (added as slide.tag records):
- Curriculo Oficial — official curriculum content
- Competencias Digitais — digital skills
- Trilha Comunitaria — community-sourced learning
- Projeto Aplicado — practical/applied projects
- Certificacao FACODI — certification-track content

**Usage**:
```python
# Tag a slide with multiple topics
models.execute_kw(db, uid, pwd, 'slide.slide', 'write',
    [slide_id], {'tag_ids': [(6, 0, [tag1_id, tag2_id])]})
```

---

### 6. slide.channel.tag / slide.channel.tag.group (Channel-Specific Tags)

**Purpose**: Organize channels into tag-based hierarchies (e.g., skill levels, competency areas).

**Structure**:
- `slide.channel.tag.group` — tag category container
- `slide.channel.tag` — individual tags within a group

**Example Hierarchy**:
```
Tag Group: "Proficiency Level"
  └─ Tag: "Beginner"
  └─ Tag: "Intermediate"
  └─ Tag: "Advanced"

Tag Group: "Content Type"
  └─ Tag: "Theory"
  └─ Tag: "Practical"
```

---

### 7. slide.slide.resource (Additional Resources / External Links)

**Purpose**: Attach supplementary resources, external links, or downloadable materials to individual slides.

**Key Fields** (14 total):

#### Resource Metadata
- `id` — resource ID
- `slide_id` (many2one → slide.slide) — parent slide
- `resource_type` (selection) — resource category type
- `create_date` / `write_date` — timestamps
- `create_uid` / `write_uid` — audit users

**Extensibility**: This model is designed for attaching:
- External URLs (e.g., UALG curriculum links, GitHub repos)
- PDF documents
- Code repositories
- Reference materials
- Official documentation links

**⚠️ Limitation**: `slide.slide.resource.link` model does NOT exist in this Odoo instance. Resource linking is handled directly on `slide.slide.resource` or via `ir.attachment` relationships.

**Alternative Pattern**: Use `ir.attachment` model to link external resources:
```python
# Create attachment
models.execute_kw(db, uid, pwd, 'ir.attachment', 'create', [{
    'name': 'UALG Course 1941',
    'type': 'url',
    'url': 'https://www.ualg.pt/curso/1941/plano',
    'res_model': 'slide.slide',
    'res_id': slide_id,
}])
```

---

### 8. slide.question (Quiz Questions)

**Purpose**: Define quiz questions associated with slides.

**Key Fields** (14 total):

#### Question Metadata
- `id` — question ID
- `slide_id` (many2one → slide.slide) — parent slide
- `name` (text) — question text
- `question_type` (selection) — `multiple_choice` | `true_false` | `text_choice`
- `sequence` (integer) — order in quiz

#### Question Content
- `answer_ids` (one2many → slide.answer) — answer options
- `create_date` / `write_date` — timestamps

---

### 9. slide.answer (Quiz Answers)

**Purpose**: Define answer options for quiz questions.

**Key Fields** (11 total):

#### Answer Metadata
- `question_id` (many2one → slide.question) — parent question
- `name` (text) — answer text
- `sequence` (integer) — display order
- `is_correct` (boolean) — is this the correct answer?
- `create_date` / `write_date` — timestamps

---

### 10. slide.embed (Embedded View Counter)

**Purpose**: Track embedded slide views when slides are embedded in external websites via iframe.

**Key Fields** (10 total):

#### Embed Tracking
- `slide_id` (many2one → slide.slide) — embedded slide
- `create_date` — embed timestamp
- `count_success` (integer) — successful load count

---

## Relationship Map

```
┌─────────────────────────────────────────────────────────────────┐
│                      slide.channel (Course)                     │
│  • name, description, visibility, is_published                 │
│  • x_facodi_level, x_facodi_workload_hours, certification flag │
└──────────────────────┬──────────────────────────────────────────┘
                       │
         ┌─────────────┼─────────────┐
         │             │             │
    [1:N] SLIDES    [1:N] PARTNERS   [N:M] TAGS
         │             │             │
         ▼             ▼             ▼
┌──────────────┐  ┌──────────────────┐  ┌────────────┐
│ slide.slide  │  │slide.channel.par-│  │ slide.tag  │
│              │  │ tner (Enrollment)│  │            │
│ • slide_type │  │                  │  │ • name     │
│ • duration   │  │ • completed      │  │ • taxonomy │
│ • url        │  │ • progress notes │  │            │
│ • quiz_q*    │  │ • x_facodi_notes │  │ FACODI set:│
│ • x_facodi_* │  │                  │  │ - Oficial  │
│              │  │ → res.partner    │  │ - Digital  │
└──────┬───────┘  └──────────────────┘  │ - Comunid. │
       │                                  │ - Aplic.   │
    [1:N] CHILD SLIDES                   │ - Certif.  │
    [1:N] QUESTIONS                      └────────────┘
    [1:N] RESOURCES
    [N:M] TAGS
    [N:M] PARTNERS
       │
       ├─────────────────────────────────┐
       │                                  │
       ▼                                  ▼
┌─────────────────────┐      ┌──────────────────────┐
│slide.slide.partner  │      │slide.slide.resource  │
│ (Learner tracking)  │      │ (Supplementary links)│
│                     │      │                      │
│ • partner_id        │      │ • resource_type      │
│ • is_favorite       │      │ • (extensible for    │
│ • quiz_points*      │      │   external URLs,     │
│                     │      │   PDFs, repos, etc.) │
└─────────────────────┘      └──────────────────────┘
```

---

## Access Control & Security

**Record Rules** (14 rules deployed):

| Rule | Model | Effect |
|------|-------|--------|
| **Officer** | slide.channel.partner | create/write/unlink own records only |
| **Manager** | slide.channel.partner | full CRUD on all records |
| **Slide: Public** | slide.slide | published OR public/link-based channel + (category OR previewable) |
| **Slide: Portal/User** | slide.slide | published AND connected user (attendee/invited) OR link-based channel |
| **Slide: Always** | slide.slide | base rule for visibility logic |

**Authentication Model**:
- Public channels: accessible without login
- Members-only: enrolled partners only
- Link-only: shareable URLs (no enrollment list)
- Invite-only: instructor-managed invitations

---

## Public Routes & Controllers

### Main Learning Routes

| Route | Controller | Purpose | FACODI Customization |
|-------|-----------|---------|----------------------|
| **`/slides`** | website.slides | course catalog & discovery | ✓ Hero + semantic badges |
| **`/slides/<slug>`** | website.slides | course detail & lesson player | ✓ Course main inherit |
| **`/slides/my`** | website.slides | learner's enrolled courses | ❌ not implemented |
| **`/slides/search`** | website.slides | course search | ❌ not implemented |
| **`/slides/channel/<id>`** | website.slides | course page alternative | — |
| **`/forum`** | website.forum | community discussion | — |

### FACODI Custom Routes (Added as website.page records)

| Route | Purpose |
|-------|---------|
| **`/home`** | FACODI institutional landing |
| **`/sobre`** | About FACODI |
| **`/faq`** | FAQ |
| **`/contribuir`** | Partnership/contribution |

### Removed Routes (SaaS Consolidation)

| Route | Why | Replacement |
|-------|-----|-------------|
| `/cursos` | Legacy path | `/slides` |
| `/trilhas` | Legacy path | `/slides` |
| `/aulas` | Legacy path | `/slides` |
| `/comunidade` | Legacy path | `/forum` |

---

## Templates & QWeb Inheritance

### Core website_slides Templates

| Template | Path | Purpose |
|----------|------|---------|
| `website.course_card` | `/slides` listing | individual course card render |
| `website.course_main` | `/slides/<course>` | course detail page layout |
| `website_slides.course_nav` | course breadcrumb/nav | navigation breadcrumb |
| `website_slides.lessons` | course content player | slide player + progress bar |
| `website_slides.home` | `/slides` home | course catalog landing |

### FACODI Custom Inherits

| View ID | Base Template | Purpose | Status |
|---------|---------------|---------|--------|
| `website.facodi_slides_courses_home_inherit` | `website.course_home` | Hero + semantic badges on /slides | ✅ Deployed |
| `website.facodi_slides_course_nav_inherit` | `website_slides.course_nav` | Breadcrumb customization | ✅ Deployed |
| `website.facodi_slides_course_main_inherit` | `website.course_main` | Course detail polish + FACODI styling | ✅ Deployed |

### Planned Inherits

| View | Purpose | Status |
|------|---------|--------|
| course_card inherit | enhance card metadata display | 📋 Planned (trilhas filters) |
| lessons inherit | slide player customization | 📋 Planned |

---

## Extensibility Patterns

### Pattern 1: Semantic Fields (Non-Python Model Extension)

Add custom fields to slide.channel, slide.slide, slide.channel.partner via XML-RPC:

```python
# Add field to slide.channel
models.execute_kw(db, uid, pwd, 'ir.model.fields', 'create', [{
    'model_id': 10,  # ID of slide.channel model
    'name': 'x_my_custom_field',
    'field_description': 'My Custom Field',
    'ttype': 'char',
}])
```

**FACODI Example**: All 38 custom fields added this way (no code changes needed).

### Pattern 2: QWeb Inheritance (Template Customization)

Extend templates without forking via XPath:

```xml
<record id="my.slides.course.main.inherit" model="ir.ui.view">
    <field name="name">Course Main (Custom)</field>
    <field name="model">website</field>
    <field name="inherit_id" ref="website.course_main"/>
    <field name="type">qweb</field>
    <field name="arch" type="xml">
        <xpath expr="//div[@class='course-header']" position="replace">
            <div class="course-header custom-facodi">
                <!-- custom markup -->
            </div>
        </xpath>
    </field>
</record>
```

**FACODI Example**: 3 major inherits deployed (courses_home, course_nav, course_main).

### Pattern 3: External Resource Linking

Attach supplementary materials via `slide.slide.resource` or `ir.attachment`:

```python
# Option A: Direct attachment
models.execute_kw(db, uid, pwd, 'ir.attachment', 'create', [{
    'name': 'Official Curriculum Link',
    'type': 'url',
    'url': 'https://example.com/curriculum',
    'res_model': 'slide.slide',
    'res_id': slide_id,
}])

# Option B: Resource record (if resource_type supports it)
models.execute_kw(db, uid, pwd, 'slide.slide.resource', 'create', [{
    'slide_id': slide_id,
    'resource_type': 'external_link',
    # other fields based on resource_type selection options
}])
```

### Pattern 4: JavaScript Client-Side Filtering

Add inline JavaScript in QWeb templates for interactive filters:

```xml
<script>
    document.querySelectorAll('[data-facodi-level]').forEach(card => {
        card.addEventListener('facodi-filter', (e) => {
            const level = card.dataset.facodiLevel;
            card.style.display = (e.detail.level === level) ? 'block' : 'none';
        });
    });
</script>
```

**Planned Use**: Trilhas discovery filters (level + competency dropdowns).

---

## Data Statistics

| Model | Record Count | Growth |
|-------|--------------|--------|
| slide.channel | 2 | — |
| slide.slide | 134 | 67 per course avg |
| slide.tag | 10 | taxonomy |
| slide.channel.partner | 2 | 1 per course avg |
| slide.slide.partner | (many) | interaction tracking |
| slide.slide.resource | 25 | supplementary materials |
| slide.question | (varies) | quizzes per course |
| slide.answer | (varies) | answers per question |

---

## FACODI Customization Summary

### Custom Fields Added (38 Total)
- **slide.channel**: 23 fields
- **slide.slide**: 14 fields
- **slide.channel.partner**: 1 field

### Custom Tags Added (5 Total)
- Curriculo Oficial
- Competencias Digitais
- Trilha Comunitaria
- Projeto Aplicado
- Certificacao FACODI

### QWeb Inherits (3 Deployed)
- website.facodi_slides_courses_home_inherit
- website.facodi_slides_course_nav_inherit
- website.facodi_slides_course_main_inherit

### Public Pages (4 New)
- /home
- /sobre
- /faq
- /contribuir

### Deployment Safety
- ✅ SaaS-compatible (semantic fields + QWeb only)
- ✅ No custom Python code required
- ✅ Deterministic XML-RPC writes
- ✅ Fully rollbackable
- ✅ JSON evidence logging

---

## Next Opportunities

### 1. Trilhas Discovery Filters (Planned)
**Goal**: Filter /slides by x_facodi_level and x_facodi_competency

**Tasks**:
- Add JavaScript filtering logic to course_card template
- Data attributes on cards for CSS/JS filtering
- "No results" messaging
- Filter state persistence (URL params or localStorage)

### 2. Certification Workflow (Planned)
**Goal**: Award certificates on course completion

**Tasks**:
- Create certificate template (PDF/HTML)
- Hook into slide.channel.partner.completed = True
- Generate and email certificate
- Track cert issuance in new model

### 3. Content Enrichment API (Planned)
**Goal**: Link external curriculum (e.g., UALG) to slides

**Tasks**:
- Create enrich script that fetches UALG course structure
- Map UALG units to slide.slide records
- Store links in slide.slide.resource
- Update x_facodi_unit_code from source

### 4. Gamification Integration (Planned)
**Goal**: Deeper engagement tracking

**Tasks**:
- Link slide completion to gamification.challenge
- Award badges for milestones
- Track leaderboards by competency
- Visualize progress in UI

### 5. Mail Integration (Planned)
**Goal**: Automate student communication

**Tasks**:
- Send enrollment confirmation
- Course completion certificates
- Weekly progress digests
- Quiz results notifications

---

## Common Queries

### Find all slides of a specific type
```python
slides = models.execute_kw(db, uid, pwd, 'slide.slide', 'search_read',
    [[('channel_id', '=', 9), ('slide_type', '=', 'video')]],
    {'fields': ['id', 'name', 'duration']})
```

### Find learners who completed a course
```python
completed = models.execute_kw(db, uid, pwd, 'slide.channel.partner', 'search_read',
    [[('channel_id', '=', 9), ('completed', '=', True)]],
    {'fields': ['partner_id', 'completion_time']})
```

### Tag a slide with multiple competencies
```python
models.execute_kw(db, uid, pwd, 'slide.slide', 'write', [slide_id],
    {'tag_ids': [(6, 0, [tag1_id, tag2_id, tag3_id])]})
```

### Get all slides by competency
```python
slides_by_competency = models.execute_kw(db, uid, pwd, 'slide.slide', 'search_read',
    [[('x_facodi_competency', 'ilike', 'Segurança')]],
    {'fields': ['id', 'name', 'channel_id', 'x_facodi_unit_code']})
```

### Find courses by level
```python
courses = models.execute_kw(db, uid, pwd, 'slide.channel', 'search_read',
    [[('x_facodi_level', '=', 'Intermediário')]],
    {'fields': ['id', 'name', 'x_facodi_workload_hours']})
```

---

## References

- **Instance**: https://edu-facodi.odoo.com
- **Exploration Log**: docs/analysis/website_slides_deep_exploration_*.json
- **Feature Documentation**: docs/features/feature-facodi-elearning-foundation.md
- **Feature (Planned)**: docs/features/feature-facodi-trilhas-discovery-filters.md

---

**Last Updated**: 2026-04-21
**Explorer**: Codoo Agent (Deep Module Analysis)
