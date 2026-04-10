# Orbit — Claude Code Project Settings

## Project Status

Phase 1 (MVP) is complete and shipped at v0.3.0. Phase 2 is now in active development.

**Phase 1 (done):** Idea capture, multi-workspace Kanban, content briefs, scheduling calendar, manual-assist publishing, analytics dashboard, 5-locale i18n, PWA/offline support, custom platforms, workspace icon upload.

**Phase 2 (current):** Multi-platform API auto-publish (Douyin, WeChat, Xiaohongshu, YouTube, etc.) and inbound/outbound webhooks. All platform calls must go through BullMQ — never synchronous. Credentials encrypted at rest. Webhook handlers must be idempotent and acknowledge immediately (2xx), then process asynchronously. The queue currently has a notification stub only; auto-publish jobs are the primary Phase 2 deliverable.

**Phase 3 (next):** AI skills — hot topic discovery, assisted titling, translation suggestions, brief generation, and content idea expansion. All AI output is a suggestion; never auto-save without explicit user confirmation.

**Phase 4:** Advanced analytics — cross-platform performance comparison, trend charts, funnel analysis, audience insights, scheduled report delivery.

**Phase 5:** Multi-user collaboration — team workspaces, approval workflows, RBAC (owner / admin / editor / viewer), member invites, activity audit logs.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| State | Zustand + TanStack Query |
| i18n | react-i18next — locales: zh-CN, zh-TW, en-US, ja-JP, ko-KR |
| PWA | Workbox, Dexie.js (IndexedDB) |
| Backend | Fastify (Node.js), TypeScript |
| Database | PostgreSQL 16 |
| Cache / Sessions | Redis 7 |
| Job Queue | BullMQ — scheduled reminders, auto-publish jobs (Phase 2), webhook delivery (Phase 2) |
| Auth | JWT (access + refresh) + OAuth 2.0 (WeChat / Google) |
| AI | Anthropic Claude API — Phase 3 AI skills |
| Deploy | Docker Compose (single-host) |

---

## Directory Layout

```
Orbit/
├── apps/
│   ├── web/
│   │   └── src/
│   │       ├── api/          # TanStack Query hooks
│   │       ├── components/
│   │       ├── pages/
│   │       ├── store/        # Zustand stores
│   │       └── locales/      # i18n translation files (5 locales)
│   └── api/
│       └── src/
│           ├── domain/                    # Pure business logic — no DB, no HTTP
│           │   ├── errors.ts
│           │   ├── workspace/workspace.service.ts
│           │   ├── content/content.service.ts
│           │   ├── idea/idea.service.ts
│           │   ├── publication/publication.service.ts
│           │   ├── plan/plan.service.ts
│           │   ├── metric/metric.service.ts
│           │   └── user/user.service.ts
│           ├── infrastructure/
│           │   └── db/repositories/       # Drizzle ORM implementations
│           ├── interfaces/
│           │   └── http/
│           │       ├── plugins/           # Fastify plugins (auth, cors)
│           │       └── routes/            # Thin HTTP handlers
│           ├── db/                        # Drizzle schema + migrations
│           ├── queue/                     # BullMQ queues and workers
│           └── app.ts                     # Composition root
├── packages/
│   └── shared/               # Shared TypeScript types
├── docker-compose.yml
└── docs/
```

---

## Code Conventions

### General
- **TypeScript strict mode** everywhere; no `any` unless third-party types force it.
- **API routes** follow REST conventions defined in DESIGN.md §7; no ad-hoc endpoints.
- **i18n**: All user-visible strings go through `t()` — no hardcoded display text.
- **Database**: Use Drizzle migrations; never alter schema with raw ad-hoc SQL.

### Backend Architecture (DDD)

| Layer | Path | Responsibility |
|-------|------|---------------|
| **Domain** | `src/domain/` | Service classes + repository interfaces. No DB imports, no Fastify imports. Pure business logic and domain errors. |
| **Infrastructure** | `src/infrastructure/db/repositories/` | Drizzle ORM implementations of domain repository interfaces. All DB queries live here. |
| **Interfaces** | `src/interfaces/http/` | Thin Fastify route handlers. Extract params → call service → return response. No business logic. |

**Key rules:**
- Domain services receive repository instances via constructor injection (no DI container).
- `app.ts` is the composition root: instantiates repositories → services → calls `registerRoutes(app, services)`.
- Domain errors (`NotFoundError`, `ForbiddenError`, `ConflictError`, `ValidationError`) are thrown from services and mapped to HTTP codes by the global error handler in `app.ts`.
- Route handlers must not contain business logic or DB queries — move that logic to a service.
- The `export.ts` and `import.ts` routes are intentional exceptions: they are bulk data-transfer operations that access the DB directly.

### Multi-tenancy
- Every DB query that touches workspace data must be scoped to the authenticated user's workspace. Never trust a workspace ID from the request body alone — always verify ownership via the service layer.

### Platform API Integrations (Phase 2)
- All platform API calls must be dispatched as BullMQ jobs, never called synchronously in a route handler.
- Jobs must be idempotent (safe to retry). Use BullMQ's built-in retry with exponential backoff.
- Store platform credentials encrypted at rest; never log them.
- Each integration lives in `apps/api/src/integrations/<platform>/` and exports a standard interface.

### AI Features (Phase 3)
- Use the Anthropic Claude API for all AI-assisted features.
- AI-generated content is always a suggestion — never auto-save without explicit user confirmation.
- Stream responses where latency matters (title generation, translation). Use non-streaming for batch jobs.
- Keep prompt templates close to their feature — no global prompt registry.

### Webhooks (Phase 2)
- Verify platform webhook signatures before processing any payload.
- Handlers must be idempotent — platforms may deliver the same event more than once.
- Acknowledge immediately (2xx) and process asynchronously via BullMQ.

### Offline-first
- Data mutations must enqueue a BackgroundSync task before returning success.
- Do not block the UI waiting for server confirmation.

---

## Domain Glossary

| Term | Meaning |
|------|---------|
| Workspace | One content vertical or account (e.g. "Douyin · Comedy") |
| Idea | A raw, unstructured inspiration captured quickly |
| Content | A formal content item promoted from an Idea |
| Brief | Structured creative brief attached 1-to-1 with a Content (stored as `content_plans`) |
| Publication | One platform-specific publish record for a Content |
| Stage | Kanban column: planned → creating → ready → published → reviewed |
| StageHistory | JSON log of every stage transition on a Content item |
| Metric | A single performance data snapshot for a Publication |
| CustomPlatform | A user-defined publishing platform beyond the built-in list |
| PlatformConnection | (Phase 2) An OAuth-authorized link between a Workspace and a social platform account |
| Job | A BullMQ background task (auto-publish, webhook delivery, AI generation, reminders) |
| ApprovalRequest | (Phase 5) A workflow step where content requires sign-off before publishing |

---

## Git Workflow

- **Never commit directly to `master`** for any meaningful change.
- For every feature, fix, or improvement: create a branch (`feat/...`, `fix/...`, `chore/...`), do all work there, then wait for the user to explicitly approve before merging.
- Only merge to `master` after the user says something like "looks good", "merge it", or "LGTM".
- Minor single-line fixes may be committed directly to master only when the user asks for a quick fix in the same message.
- Do not squash or rebase without being asked.
- Do not include `Co-Authored-By` lines or mention `Claude` in commit messages.
- **After each major change, commit and push to the current branch automatically.** A "major change" is any edit that fixes a bug, adds a feature, or meaningfully refactors logic. Minor clarifying edits (typos, comment tweaks) do not require a commit.

---

## Testing

- Unit tests: Vitest
- API integration tests: always hit a real test PostgreSQL database — do not mock the DB layer
- E2E: Playwright
- Platform integrations (Phase 2): use sandbox/test credentials in CI; never call live platform APIs in tests

---

## Running Locally

```bash
docker compose up -d    # Postgres + Redis
pnpm install
pnpm migrate            # run DB migrations
pnpm dev                # API on :3000, web on :5173
```

Copy `.env.example` to `.env`. OAuth and platform credentials are optional for local dev.
