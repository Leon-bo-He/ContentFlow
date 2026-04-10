# Orbit — Design Document

**Version:** 3.0 | **Last updated:** 2026-04-10

---

## Table of Contents

1. [Product Positioning](#1-product-positioning)
2. [Information Architecture](#2-information-architecture)
3. [Core Features](#3-core-features)
   - 3.1 [Idea Capture](#31-idea-capture)
   - 3.2 [Workspaces](#32-workspaces)
   - 3.3 [Content Lifecycle (Kanban)](#33-content-lifecycle-kanban)
   - 3.4 [Content Brief](#34-content-brief)
   - 3.5 [Scheduling Calendar](#35-scheduling-calendar)
   - 3.6 [Publication Management](#36-publication-management)
   - 3.7 [Analytics Dashboard](#37-analytics-dashboard)
4. [Multilingual Support](#4-multilingual-support)
5. [PWA & Mobile](#5-pwa--mobile)
6. [Technical Architecture](#6-technical-architecture)
7. [Data Model](#7-data-model)
8. [API Reference](#8-api-reference)

---

## 1. Product Positioning

**One sentence:** Orbit doesn't replace your creative tools — it manages everything around creation: idea capture, scheduling, multi-platform distribution, and performance tracking.

**Core scenario:** A creator running multiple content verticals simultaneously — comedy shorts, lifestyle posts, long-form tech writing — and publishing each across a mix of platforms (Douyin, TikTok, Xiaohongshu, Instagram, WeChat OA, YouTube, X, or a custom channel) needs one place to plan content, manage publishing cadence, and track performance across all channels. Workspaces represent content areas, not platforms; platforms are selected per publication.

### Phase Roadmap

| Phase | Focus | Status |
|-------|-------|--------|
| **Phase 1 — MVP** | Idea capture, multi-workspace Kanban, content briefs, scheduling calendar, manual-assist publishing, analytics dashboard, 5-locale i18n, PWA/offline, custom platforms | **Done** |
| **Phase 2 — Platform Integration** | Multi-platform API auto-publish (Douyin, WeChat, Xiaohongshu, YouTube, etc.), inbound and outbound webhooks | **In progress** |
| **Phase 3 — AI Skills** | Hot topic discovery, AI-assisted titling, translation suggestions, brief generation, content idea expansion | Planned |
| **Phase 4 — Advanced Analytics** | Cross-platform performance comparison, trend charts, funnel analysis, audience insights, scheduled report delivery | Planned |
| **Phase 5 — Collaboration** | Multi-user team workspaces, approval workflows, role-based access control, member invites, activity audit logs | Planned |

---

## 2. Information Architecture

```
Orbit
│
├── Global Dashboard        — cross-workspace overview
├── Global Publish Queue    — cross-workspace timeline
├── Ideas                   — global idea pool
│
├── Workspace A  (e.g. "Comedy")
│   ├── Content Board (Kanban)
│   ├── Scheduling Calendar
│   ├── Analytics Panel
│   └── Archive
│
├── Workspace B  (e.g. "Lifestyle")
│   └── ...
│
└── Settings  — account, appearance, language, custom platforms
```

---

## 3. Core Features

### 3.1 Idea Capture

Capture inspiration anywhere with zero friction. Categorize later.

**Entry points:**

| Platform | Mechanism |
|----------|-----------|
| Mobile | Persistent floating `+` button; tap → write; voice-to-text supported |
| Desktop | Global shortcut `Cmd/Ctrl + Shift + I` opens a quick-entry overlay |
| Android | PWA notification bar shortcut |

**Idea fields:**

| Field | Required | Notes |
|-------|----------|-------|
| Title | Yes | One-line summary |
| Note | No | Extended plain text |
| Tags | No | Free-form |
| Workspace | No | Assignable later; defaults to global pool |
| Attachments | No | Images, links, screenshots |
| Priority | No | low / medium / high |

**Key decisions:**
- Ideas default to the **global idea pool** — no forced workspace selection.
- Ideas can be promoted to a full Content item at any time.
- Promoted ideas retain a back-link (`converted_to`) for traceability.

---

### 3.2 Workspaces

Each content vertical has its own isolated workspace. Platforms are not bound to a workspace — any content can publish to any combination of platforms via independent Publication records.

**Workspace fields:**

| Field | Description |
|-------|-------------|
| Name & icon | e.g. "Comedy", "Lifestyle" — the content area, not the platform |
| Color | Workspace accent color, used in calendar and labels |
| About | Optional description |
| Publish goal | e.g. `{ count: 3, period: "week" }` — drives calendar gap alerts |
| Stage config | Custom Kanban stage list (JSON) |

**Custom platforms:** Users can define their own publishing platforms beyond the built-in list (Douyin, WeChat, Xiaohongshu, YouTube, etc.). Each custom platform has a name and emoji icon.

---

### 3.3 Content Lifecycle (Kanban)

Every content item moves through well-defined stages with a full `stage_history` audit trail.

**Default stage pipeline:**

```
Planned → Creating → Ready → Publishing → Published → Reviewed
```

**Kanban board:**

```
┌──────────┬──────────┬──────────┬────────────┬───────────┬──────────┐
│ Planned  │ Creating │  Ready   │ Publishing │ Published │ Reviewed │
├──────────┼──────────┼──────────┼────────────┼───────────┼──────────┤
│ Card 1   │ Card 3   │ Card 5   │            │           │          │
│ Apr 15   │ Filming  │ Apr 12   │            │           │          │
│ Card 2   │ Card 4   │          │            │           │          │
└──────────┴──────────┴──────────┴────────────┴───────────┴──────────┘
```

**Content fields:**

| Field | Notes |
|-------|-------|
| Title | |
| Stage | Current Kanban column |
| Content type | short_video, image_text, long_video, podcast, live, article |
| Target platforms | e.g. Douyin, WeChat Video, custom platforms |
| Tags | |
| Scheduled publish date | |
| Notes | Production progress notes |
| Review notes | Filled in the Reviewed stage |
| Source idea | Link to originating Idea |
| Attachments | |
| Stage history | Auto-logged on every stage transition |

**Stage customization:** Workspace settings allow adding/removing stages. Phase 5 can insert "In Review" between Creating and Ready as part of the approval workflow.

---

### 3.4 Content Brief

When a content item enters the Planning stage it receives a structured **Brief** — a production guide with seven sub-modules.

#### ① Content Type
Select format: Image-text / Short video / Long video / Podcast / Live.
Type-specific fields appear on selection (duration, aspect ratio, etc.).

#### ② Target Audience Profile

| Field | Example |
|-------|---------|
| Age range | 18–25 |
| Persona tags | University students, early-career, side-hustle seekers |
| Core pain point | Want to do self-media but can't edit |
| Reach scenario | Scrolling Douyin during fragmented downtime |

Audience profiles can be saved as workspace-level templates for reuse.

#### ③ Content Goals
Select one or more: Grow followers / Conversion / Traffic referral / Brand awareness.
Add a goal description and KPI targets (e.g. Likes ≥ 500, Comments ≥ 50).

#### ④ Hook Analysis

| Element | Description |
|---------|-------------|
| Core hook | e.g. "Learn in 3 days" — time anchor creates urgency |
| Conflict / contrast | "Others pay ¥3,000; here are 3 free apps" |
| Golden-3-second design | Show before/after comparison immediately |
| Memory anchor | "The editing triad: cut, color, caption" |

#### ⑤ Title Candidates
List multiple candidates; mark primary/backup. After publishing, record which was used per platform.

#### ⑥ Content Outline
Ordered list with time markers. Example:
```
1. Intro (0–3s):    Before/after edit comparison
2. Pain point (3–8s): "Want to make videos but can't edit?"
3. Tip 1 (8–25s):  CapCut basics
4. CTA (55–65s):   Follow + resource pack
```

#### ⑦ Competitive References
Reference accounts: author, title, platform, URL, metrics snapshot, takeaway, attachments.

---

### 3.5 Scheduling Calendar

Visualize all content on a publication timeline.

**View modes:** Month · Week · List

**Core interactions:**
- Drag content cards onto calendar slots to set publish time.
- Workspaces color-coded on the calendar.
- Gap alerts: "Thursday has no Xiaohongshu post (goal: 3/week)."
- Frequency progress: "This week: 2 of 3 posts scheduled."

---

### 3.6 Publication Management

Once content reaches "Ready", Publication Management tracks its publish lifecycle across every platform independently.

**Per-platform publish fields:**

| Section | Fields |
|---------|--------|
| Title | Select from brief title candidates or write platform-specific |
| Copy | Platform-specific text |
| Hashtags | Platform-specific tag list |
| Cover | Upload or select from attachments |
| Platform settings | Visibility, comments, location, collection/series |
| Scheduled time | |
| Result | Status, platform post ID, platform URL, failure reason |
| Publish log | Timestamped action history |

**Publication status flow:**

```
draft → queued → ready → posting → published
                  │                    │
                skipped              failed
```

| Status | Description |
|--------|-------------|
| `draft` | Config incomplete |
| `queued` | Config complete; waiting for scheduled time |
| `ready` | Time reached; awaiting manual publish (Phase 1) or auto-publish (Phase 2) |
| `posting` | API call in progress (Phase 2) |
| `published` | Successfully published; platform URL recorded |
| `failed` | Auto-publish failed; requires manual intervention |
| `skipped` | Intentionally cancelled |

**Phase 1 vs Phase 2:**

| Phase 1 (manual-assist) | Phase 2 (auto-publish) |
|------------------------|----------------------|
| Manually publish on each platform | API integration handles posting |
| System notifies when it's time | System posts automatically at scheduled time |
| Return and mark published + paste URL | Auto-captures platform URL and initial metrics |

---

### 3.7 Analytics Dashboard

Track content performance via manual metric entry (Phase 1); platform API auto-collection planned for Phase 2.

**Dashboard hierarchy:**

```
Global Dashboard
├── Total content count, published count, weekly/monthly cadence
├── Cross-platform aggregated totals
├── Top 10 content by performance
└── Per-workspace summary

Workspace Analytics
├── Account KPI trend charts (weekly / monthly)
├── Per-post data table (sortable)
├── Publish frequency achievement rate
└── Tag-dimension analysis

Single Content Detail
├── Per-platform data comparison
├── Metrics-over-time curve
└── Post-mortem notes
```

**Metrics recorded per publication:** views, likes, comments, shares, saves, followers_gained.

---

## 4. Multilingual Support

**Supported locales:** `zh-CN` (default) · `zh-TW` · `en-US` · `ja-JP` · `ko-KR`

- `react-i18next` with async on-demand locale bundle loading.
- Browser language auto-detection; manual override in Settings.
- Dates and numbers formatted via `Intl.DateTimeFormat` / `Intl.NumberFormat`.
- Calendar week start follows locale convention.

---

## 5. PWA & Mobile

**Primary scenario — quick idea capture on phone:**
- Floating `+` FAB; tap → write; voice input via browser Speech API.
- Android notification bar quick-action shortcut.

**Secondary scenario — check schedule and metrics on phone:**
- Calendar defaults to week view on mobile.
- Analytics responsive layout with swipeable metric cards.
- Push notifications: publish deadline reminders and metric milestones.

**Offline capabilities:**

| Available Offline | Requires Network |
|-------------------|-----------------|
| Record ideas | Refresh analytics |
| View scheduling calendar | Publish actions |
| View content board | Sync to server |
| Edit content card notes | |
| View cached metrics | |

Offline writes queue via **Background Sync** and flush automatically on reconnect.

---

## 6. Technical Architecture

```
┌──────────────────────────────────────────┐
│          PWA Client (React 18)            │
│  Zustand + TanStack Query + react-i18next │
│  Workbox SW + IndexedDB (Dexie.js)        │
└──────────────────┬───────────────────────┘
                   │ HTTPS / REST
┌──────────────────▼───────────────────────┐
│          Fastify API Server               │
│  ┌─────────────────────────────────────┐  │
│  │  Interfaces (src/interfaces/http/)  │  │
│  │  Thin route handlers                │  │
│  └──────────────┬──────────────────────┘  │
│  ┌──────────────▼──────────────────────┐  │
│  │  Domain (src/domain/)               │  │
│  │  Service classes + repo interfaces  │  │
│  │  Pure business logic; no DB/HTTP    │  │
│  └──────────────┬──────────────────────┘  │
│  ┌──────────────▼──────────────────────┐  │
│  │  Infrastructure                     │  │
│  │  (src/infrastructure/db/repos/)     │  │
│  │  Drizzle ORM implementations        │  │
│  └──────────────┬──────────────────────┘  │
└─────────────────┼─────────────────────────┘
                  ▼
   PostgreSQL    Redis         BullMQ
   (primary)  (cache/session) (jobs)
```

**Stack:**

| Layer | Choice |
|-------|--------|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS |
| State (local) | Zustand |
| State (server) | TanStack Query |
| i18n | react-i18next |
| PWA | Workbox + Dexie.js (IndexedDB) |
| Backend | Fastify (Node.js) + TypeScript |
| Database | PostgreSQL 16 |
| Cache / sessions | Redis 7 |
| Job queue | BullMQ |
| Auth | JWT (access + refresh) + OAuth 2.0 (WeChat / Google) |
| Deploy | Docker Compose |

---

## 7. Data Model

```sql
-- Users
users (
  id uuid PK,
  email text UNIQUE NOT NULL,
  username text NOT NULL,
  avatar text,
  locale text NOT NULL DEFAULT 'en-US',
  timezone text NOT NULL DEFAULT 'America/Los_Angeles',
  password_hash text,
  telegram_bot_token text,
  telegram_chat_id text,
  telegram_notifications_enabled boolean NOT NULL DEFAULT true,
  notification_lead_time integer NOT NULL DEFAULT 15,  -- minutes; applies to all channels
  created_at timestamptz NOT NULL
)

-- Workspaces
workspaces (
  id uuid PK,
  user_id uuid FK→users CASCADE,
  name text NOT NULL,
  icon text NOT NULL,
  color text NOT NULL,
  about text,
  publish_goal jsonb,          -- { count: 3, period: "week" }
  stage_config jsonb NOT NULL, -- custom Kanban stage list
  created_at timestamptz NOT NULL
)

-- Ideas
ideas (
  id uuid PK,
  user_id uuid FK→users CASCADE,
  workspace_id uuid FK→workspaces SET NULL,  -- null = global pool
  title text NOT NULL,
  note text,
  tags jsonb NOT NULL DEFAULT [],
  priority text NOT NULL DEFAULT 'medium',   -- low | medium | high
  attachments jsonb NOT NULL DEFAULT [],
  status text NOT NULL DEFAULT 'active',     -- active | converted | archived
  converted_to uuid FK→contents SET NULL,
  created_at timestamptz NOT NULL
)

-- Contents
contents (
  id uuid PK,
  workspace_id uuid FK→workspaces CASCADE,
  idea_id uuid,                -- source idea (nullable)
  title text NOT NULL,
  description text,
  content_type text NOT NULL,  -- short_video | long_video | image_text | article | podcast | live
  stage text NOT NULL DEFAULT 'planned',
  tags jsonb NOT NULL DEFAULT [],
  target_platforms jsonb NOT NULL DEFAULT [],
  scheduled_at timestamptz,
  published_at timestamptz,
  notes text,
  review_notes text,
  attachments jsonb NOT NULL DEFAULT [],
  stage_history jsonb NOT NULL DEFAULT [],   -- [{ stage, timestamp, actor }]
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL
)

-- Content Briefs  (1-to-1 with contents)
content_plans (
  id uuid PK,
  content_id uuid FK→contents CASCADE UNIQUE,
  format_config jsonb NOT NULL DEFAULT {},
  audience jsonb,              -- { age_range, persona_tags[], pain_points, reach_scenario }
  audience_template_id uuid,
  goals jsonb NOT NULL DEFAULT [],
  goal_description text,
  kpi_targets jsonb NOT NULL DEFAULT {},
  hooks jsonb,                 -- { core_hook, conflict, golden_opening, memory_point }
  title_candidates jsonb NOT NULL DEFAULT [],
  outline jsonb NOT NULL DEFAULT [],
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL
)

-- Competitive References  (many-to-1 with contents)
content_references (
  id uuid PK,
  content_id uuid FK→contents CASCADE,
  author_name text NOT NULL,
  content_title text NOT NULL,
  platform text NOT NULL,
  url text NOT NULL,
  metrics_snapshot jsonb NOT NULL DEFAULT {},
  takeaway text NOT NULL,
  attachments jsonb NOT NULL DEFAULT [],
  created_at timestamptz NOT NULL
)

-- Brief Templates  (workspace-level reuse)
plan_templates (
  id uuid PK,
  workspace_id uuid FK→workspaces CASCADE,
  name text NOT NULL,
  audience jsonb,
  goals jsonb NOT NULL DEFAULT [],
  goal_description text,
  created_at timestamptz NOT NULL
)

-- Publications  (1 content × 1 platform = 1 publication)
publications (
  id uuid PK,
  content_id uuid FK→contents CASCADE,
  platform text NOT NULL,
  platform_title text,
  platform_copy text,
  platform_tags jsonb NOT NULL DEFAULT [],
  cover_url text,
  platform_settings jsonb NOT NULL DEFAULT {},
  scheduled_at timestamptz,
  published_at timestamptz,
  status text NOT NULL DEFAULT 'draft',  -- draft | queued | ready | posting | published | failed | skipped
  platform_post_id text,
  platform_url text,
  failure_reason text,
  publish_log jsonb NOT NULL DEFAULT [],
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL
)

-- Metrics  (time-series snapshots per publication)
metrics (
  id uuid PK,
  publication_id uuid FK→publications CASCADE,
  views integer NOT NULL DEFAULT 0,
  likes integer NOT NULL DEFAULT 0,
  comments integer NOT NULL DEFAULT 0,
  shares integer NOT NULL DEFAULT 0,
  saves integer NOT NULL DEFAULT 0,
  followers_gained integer NOT NULL DEFAULT 0,
  recorded_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL
)

-- Custom Platforms
custom_platforms (
  id text PK,            -- format: "custom_${timestamp}"
  user_id uuid FK→users CASCADE,
  name text NOT NULL,
  icon text NOT NULL DEFAULT '📌',
  created_at timestamptz NOT NULL
)
```

---

## 8. API Reference

All endpoints require a valid JWT in the `Authorization: Bearer <token>` header unless noted otherwise.

### Auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/auth/register` | No | Register new user |
| `POST` | `/api/auth/login` | No | Login, returns access token |
| `POST` | `/api/auth/refresh` | Cookie | Refresh access token via refresh cookie |
| `POST` | `/api/auth/logout` | Yes | Invalidate session |
| `GET` | `/api/auth/me` | Yes | Get current user profile |
| `PATCH` | `/api/auth/profile` | Yes | Update username, email, locale, timezone |
| `PATCH` | `/api/auth/password` | Yes | Change password |
| `DELETE` | `/api/auth/account` | Yes | Delete account |

### Workspaces

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/workspaces` | Create workspace |
| `GET` | `/api/workspaces` | List workspaces |
| `PATCH` | `/api/workspaces/:id` | Update workspace |
| `POST` | `/api/upload/workspace-icon` | Upload workspace icon (max 2 MB, JPEG/PNG/GIF/WebP) |
| `POST` | `/api/upload/avatar` | Upload user avatar (max 2 MB, JPEG/PNG/GIF/WebP) |

### Ideas

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/ideas` | Create idea |
| `GET` | `/api/ideas?workspace=&status=&priority=&q=` | List ideas |
| `PATCH` | `/api/ideas/:id` | Update idea |
| `POST` | `/api/ideas/:id/convert` | Promote idea to Content |
| `GET` | `/api/ideas/archived/export?workspace=&from=&to=` | Export archived ideas as JSON |
| `DELETE` | `/api/ideas/archived?workspace=&from=&to=` | Bulk-delete archived ideas |

### Contents

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/contents` | Create content |
| `GET` | `/api/contents?workspace=&stage=` | List contents |
| `PATCH` | `/api/contents/:id` | Update content / advance stage |
| `DELETE` | `/api/contents/:id` | Delete content |
| `GET` | `/api/contents/calendar?from=&to=&workspace=` | Calendar view data |
| `GET` | `/api/contents/archived/export?workspace=&from=&to=` | Export archived contents as JSON |
| `DELETE` | `/api/contents/archived?workspace=&from=&to=` | Bulk-delete archived contents |

### Content Briefs

| Method | Path | Description |
|--------|------|-------------|
| `PUT` | `/api/contents/:id/plan` | Upsert brief |
| `GET` | `/api/contents/:id/plan` | Get brief |
| `GET` | `/api/contents/:id/references` | List competitive references |
| `POST` | `/api/contents/:id/references` | Add reference |
| `DELETE` | `/api/contents/:id/references/:refId` | Remove reference |
| `POST` | `/api/workspaces/:id/plan-templates` | Save audience template |
| `GET` | `/api/workspaces/:id/plan-templates` | List templates |
| `PATCH` | `/api/workspaces/:id/plan-templates/:templateId` | Rename template |
| `DELETE` | `/api/workspaces/:id/plan-templates/:templateId` | Delete template |

### Publication Management

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/contents/:id/publications` | Add platform to content |
| `GET` | `/api/contents/:id/publications` | List publications for content |
| `PATCH` | `/api/publications/:id` | Update publication config / status |
| `DELETE` | `/api/publications/:id` | Delete publication |
| `POST` | `/api/publications/:id/mark-published` | Mark published + record URL |
| `GET` | `/api/publications/queue?status=&from=&to=` | Global publish queue |
| `PATCH` | `/api/publications/batch` | Batch reschedule or status update |

### Analytics

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/metrics` | Record metric snapshot |
| `GET` | `/api/metrics/dashboard?workspace=` | Workspace analytics |
| `GET` | `/api/metrics/content/:id` | Single content metrics |
| `GET` | `/api/dashboard` | Global dashboard summary |

### Data Portability

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/export` | Export all user data as JSON archive |
| `POST` | `/api/import` | Import a JSON archive |

### Notifications

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/notifications/telegram` | Get Telegram config (token never returned; returns `configured`, `tokenSet`, `chatId`, `enabled`, `leadTime`) |
| `PATCH` | `/api/notifications/telegram` | Save or clear Telegram config; also updates `enabled` toggle and `leadTime` |
| `POST` | `/api/notifications/telegram/fetch-chat-id` | Auto-detect Chat ID via `getUpdates` |
| `POST` | `/api/notifications/telegram/test` | Send a test message with stored credentials |

### Custom Platforms

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/custom-platforms` | List custom platforms |
| `POST` | `/api/custom-platforms` | Create custom platform |
| `DELETE` | `/api/custom-platforms/:id` | Delete custom platform |

### System

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/health` | No | Health check (Postgres + Redis) |
