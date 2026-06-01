# Reliote MVP — Design Specification

**Date :** 2026-06-01
**Owner :** Fabrice Geoffrey (fabricegeoffrey@gmail.com)
**Status :** Approved for plan writing

---

## 1. Product context

Reliote is a premium platform that connects:

- **Clients / project owners based in France**
- **Qualified architects, architecture studios and architectural professionals based in Côte d'Ivoire**

The core problem is **trust at distance**. A French client cannot easily assess the credibility, qualifications and reliability of an architect 5 000 km away. Reliote exists to make that decision *legible*.

Reliote must deliver:

- trust (verification, structured proof, clear status)
- clarity (structured profiles, transparent process, no surprises)
- structured collaboration (brief, milestones, mediation)
- premium presentation of architects
- a real project submission flow from France
- explainable matching between project needs and architect skills
- an admin dashboard to monitor the MVP data

The visual identity is locked: **V1 — Éditorial minéral** (mineral editorial), the direction the user already converged on across two design chats. It must feel calm, architectural, precise, trustworthy, premium — **not** a generic SaaS, a freelance marketplace, a real-estate listing or a futuristic AI tool.

## 2. MVP scope (what we are building)

### Included
1. Premium responsive landing page faithful to the locked design system.
2. Architect onboarding wizard (6 steps) that persists a real profile in Supabase.
3. Client project submission wizard (5 steps) that persists a real project in Supabase.
4. Explainable matching engine, run automatically on project creation, with a transparent scoring breakdown.
5. Admin dashboard reading real data: architects list, projects list, matches per project, status transitions for architects.
6. Bilingual FR / EN with an architectural blueprint-style language switch.
7. Three-role Supabase Auth (`client`, `architect`, `admin`) with RLS, plus minimal client and architect dashboards.

### Explicitly NOT in MVP (post-MVP follow-ups)
- Real transactional email (uses GoTrue local logs / Supabase Studio inbox during dev; production SMTP config is a separate post-MVP wire-up)
- Portfolio file uploads (text URLs only for now)
- Internal messaging
- Payments
- AI-driven matching (rule-based scoring is sufficient and more explainable for trust)
- Multi-tenant / complex permissions beyond the three roles
- CMS for landing content (strings live in code in `messages/fr.json` and `messages/en.json`)
- Analytics dashboards beyond simple counts

## 3. Architecture decisions

| Decision | Choice | Rationale |
|---|---|---|
| Framework | Next.js 15 App Router + TypeScript | User-requested stack, RSC for SEO on architect profile pages, server actions for forms. |
| Styling | Tailwind CSS v4 + shadcn/ui | Already in the spec; v4 lets us put the locked palette into `@theme` tokens. |
| Backend | **Supabase self-hosted via docker-compose** | User cannot afford the cloud plan, and chose self-hosted explicitly. Local stack: Postgres + GoTrue + PostgREST + Storage + Studio. |
| Auth | Supabase Auth (email/password), three roles | User chose 2b (full auth). Roles stored as enum on `profiles` table. |
| RLS | Enabled on every table | Required by Supabase good practice; admin reads via `service_role` from server, never the browser. |
| i18n | next-intl, locale-prefixed routes (`/fr/`, `/en/`), default FR | User chose 3b (bilingual MVP) with a styled architectural switch. |
| Forms | React Hook Form + Zod | Shared schemas between client validation and server-action validation. |
| Animations | Framer Motion, sparingly | Wizard steps, drawer, scroll-reveal — nothing flashier. CSS for hairlines, hover and the language switch tick. |
| Deployment | VPS-ready: `Dockerfile` for Next.js + the same `supabase/docker-compose.yml` portable to the VPS | User's stated deployment target. Same env vars, no code change between local and VPS. |

## 4. Design system (locked, from Claude Design bundle)

### Palette (CSS tokens)
```
--green:           #073E18   /* identity accent — ≤ 8 % of surface */
--green-deep:      #052b10
--green-soft:      #0a4a1f
--accent-brass:    #b89968   /* rare punctuation, dots, active states */
--paper:           #f3f1ec   /* primary background */
--paper-2:         #ebe8e1
--ink:             #14140f   /* primary text */
--ink-2:           #2a2925
--concrete-1:      #4a4844
--concrete-2:      #6e6c66
--concrete-3:      #9b9892
--concrete-4:      #c8c5be
--hairline:        rgba(20,20,15,0.16)
--hairline-soft:   rgba(20,20,15,0.08)
--water:           #0c1614   /* dark sections (hero, CTA band) */
```

### Type
- Display / italic accent: **Instrument Serif** — used only for the italic words inside headlines (`d'exception`, `confiance`, etc.)
- Sans / UI: **Geist** weights 300/400/500/600/700
- Mono / metadata / coordinates: **Geist Mono** weights 300/400/500

Font feature settings on body: `"ss01","ss02","cv11"`.

### Structure
- 12-column grid with `column-gap: clamp(16px,2.2vw,32px)`, page edge `clamp(20px,3.4vw,56px)`.
- All sections numbered (`01` → `08`) shown as small mono labels top-left of each section.
- 1 px hairlines everywhere (no shadows except subtle drawer/card lift).
- Section eyebrows in mono uppercase 11 px with letter-spacing 0.18em.
- Two ambient coordinates: `48°51'24"N · PARIS` and `5°20'08"N · ABIDJAN`, present as tiny corner labels in the hero and footer.

### Sections (in order)
1. **Hero** — water-darkened photo (`assets/img-courtyard-pool.jpg`), oversized headline with one italic accent word, sub-line, two CTAs ("Initier un projet" primary, "Explorer les architectes" ghost), live-spotlight card (featured studio) bottom-left.
2. **Stats bar** — four numerals (84 architectes vérifiés · 27 projets en cours · 92 % réponse sous 48 h · 2 pays une exigence).
3. **02 — Approche** — five expandable pillars (Sélection · Vérification · Méthode · Transparence · Accompagnement). Active panel turns dark, reveals a large numeric stat (`1/6 candidats admis`, `100% diplômes contrôlés`, `0 surprise honoraires fixes`).
4. **03 — Architectes en lumière** — filterable index (filters: Tous · Résidentiel · Hospitalité · Commercial · Urbain · Culturel). Cards show photo, name, studio, city, years, availability dot, rating. Click → drawer with bio, projects, fees.
5. **04 — Processus** — animated 4-step timeline (Brief · Sélection · Rencontres · Mission). Active step pulses brass, line fills green progressively. Each step lists deliverables (`Brief signé`, `Cahier des charges`, etc.).
6. **05 — Étude de cas** — *Rives de la Lagune* featured project: 3-image carousel, 3 architectural hotspots (Béton banché, Lumière rasante, Bassin réfléchissant), 4 counters that animate on entry (480 m² · 18 mois · 23 artisans · 100 % jalons tenus), quote and meta panel.
7. **06 — Audiences** — two cards side by side: "Vous portez un projet" (client CTA) and "Vous exercez l'architecture" (architect CTA).
8. **07 — Journal** — three editorial essay teasers.
9. **CTA band** — dark water background, "Initier un projet" primary CTA.
10. **Footer** — brand mark, nav links, both coordinates, mono colophon.

### Interactions
- Sticky nav: transparent on hero, frosted (`backdrop-filter: blur(14px)`) once scrolled.
- Language switch: see § 9.
- Architect drawer: slide in from right (Framer Motion `x: 100% → 0`), closes on overlay click or Escape.
- Wizard transitions: horizontal cross-fade between steps.
- Scroll-reveal: each section eyebrow + title fades in with a 8 px translateY when entering viewport.
- Pillar expand: hover/focus expands horizontally with a 360 ms ease.
- Counters animate on intersection (`requestAnimationFrame` ease-out).

## 5. Routes & flows

```
/                                       → redirects to /fr
/[locale]                               Landing page
/[locale]/architectes                   Public filterable index
/[locale]/architectes/[id]              Architect public profile (SEO, only verified)
/[locale]/architectes/rejoindre         Architect onboarding wizard (6 steps)

/[locale]/projets/initier               Client project submission wizard (5 steps)

/[locale]/auth/login                    Login (email/password)
/[locale]/auth/register?role=...        Register (role pre-filled by entry CTA)
/[locale]/auth/forgot                   Forgot password (GoTrue link)
/[locale]/auth/callback                 Supabase auth callback route handler

/[locale]/dashboard/client              Client space: list projects + matches
/[locale]/dashboard/architecte         Architect space: own profile + incoming matches

/[locale]/admin                         Admin overview (counts, latest activity)
/[locale]/admin/architectes             Table of architects + status actions
/[locale]/admin/projets                 Table of projects + detail view
/[locale]/admin/matches                 Matches per project, re-run match action
```

### Architect onboarding wizard (6 steps)
1. **Identité** — full name, email (pre-filled if logged in), phone, photo URL
2. **Localisation** — country (default Côte d'Ivoire), city
3. **Expertise** — specialties (multi-select from canonical list), languages, project types handled (multi-select enum)
4. **Expérience** — years of experience, short professional description (≥ 80 chars), portfolio URL
5. **Disponibilité** — availability status (available / busy / unavailable), typical fee range
6. **Validation** — recap card, terms checkbox, submit → INSERT into `architect_profiles` with `status='pending'` → confirmation screen ("Votre dossier est en cours de validation")

### Client project wizard (5 steps)
Mirrors the existing 5-step modal in the prototype:
1. **Type** — project_type enum
2. **Programme** — project description (≥ 100 chars), required specialties (multi-select), expected needs
3. **Site / budget / échéance** — project_location, budget_range, timeline
4. **Coordonnées** — client_name, email, phone (pre-filled if logged in)
5. **Confirmation** — submit → INSERT into `client_projects` → server action runs `calculateMatches(projectId)` → INSERT into `match_results` → redirect to confirmation page showing top 3-5 recommended architects with their score and reasons.

### Admin flow
- Login → if `profile.role !== 'admin'` then 403.
- Overview: counters (architects by status, projects by status, matches total).
- Architects table: filterable by status; row click → drawer with full profile + buttons `Valider`, `Refuser`, `Mettre en pause`.
- Projects table: row click → drawer with project details + sorted matches list (with score breakdown).
- Matches view: pick a project → see matches sorted by score; button "Re-calculer" hits a Route Handler that re-runs scoring (useful when an architect's status changes).

## 6. Database schema (Postgres)

```sql
-- Enums
CREATE TYPE user_role           AS ENUM ('client','architect','admin');
CREATE TYPE architect_status    AS ENUM ('pending','verified','rejected','paused');
CREATE TYPE project_status      AS ENUM ('new','matched','in_review','closed');
CREATE TYPE project_type        AS ENUM ('residential','hospitality','commercial','urban','cultural','other');
CREATE TYPE availability_status AS ENUM ('available','busy','unavailable');

-- profiles: 1-to-1 with auth.users, holds role + locale
CREATE TABLE profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role        user_role NOT NULL DEFAULT 'client',
  full_name   text,
  locale      text NOT NULL DEFAULT 'fr',
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE architect_profiles (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid REFERENCES profiles(id) ON DELETE CASCADE,
  full_name         text        NOT NULL,
  email             text        NOT NULL,
  phone             text,
  country           text        NOT NULL DEFAULT 'Côte d''Ivoire',
  city              text        NOT NULL,
  specialties       text[]      NOT NULL DEFAULT '{}',
  years_experience  int         NOT NULL CHECK (years_experience BETWEEN 0 AND 70),
  project_types     project_type[] NOT NULL DEFAULT '{}',
  description       text        NOT NULL,
  portfolio_url     text,
  photo_url         text,
  languages         text[]      NOT NULL DEFAULT '{FR}',
  rating            numeric(2,1),
  availability      availability_status NOT NULL DEFAULT 'available',
  fee_from          text,
  status            architect_status    NOT NULL DEFAULT 'pending',
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE client_projects (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              uuid REFERENCES profiles(id) ON DELETE SET NULL,
  client_name          text NOT NULL,
  email                text NOT NULL,
  phone                text,
  project_location     text NOT NULL,
  project_type         project_type NOT NULL,
  project_description  text NOT NULL,
  required_specialties text[] NOT NULL DEFAULT '{}',
  budget_range         text,
  timeline             text,
  notes                text,
  status               project_status NOT NULL DEFAULT 'new',
  created_at           timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE match_results (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    uuid NOT NULL REFERENCES client_projects(id) ON DELETE CASCADE,
  architect_id  uuid NOT NULL REFERENCES architect_profiles(id) ON DELETE CASCADE,
  score         int  NOT NULL,
  reasons       jsonb NOT NULL DEFAULT '[]',
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE(project_id, architect_id)
);

-- Trigger: create profile on signup
CREATE FUNCTION handle_new_user() RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, role, full_name, locale)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data ->> 'role')::user_role, 'client'),
    NEW.raw_user_meta_data ->> 'full_name',
    COALESCE(NEW.raw_user_meta_data ->> 'locale', 'fr')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### RLS policies (summary)
- `profiles` — owner can SELECT and UPDATE own row; admin can SELECT all.
- `architect_profiles` — public can SELECT `WHERE status='verified'`; owner can SELECT/UPDATE own row regardless of status; admin can do everything. Anyone authenticated as `architect` can INSERT a row tied to their `user_id`.
- `client_projects` — owner can SELECT/INSERT/UPDATE own; admin all; architects can SELECT a project they are matched on (via EXISTS subquery on `match_results`).
- `match_results` — owner of the linked project can SELECT; matched architect can SELECT; admin all. INSERT only from server using `service_role` (no RLS bypass needed because we use service key on the server).

Admin role check uses a Postgres helper `is_admin()` reading `profiles.role` for the current user.

## 7. Matching engine

Pure function `calculateMatches(project, architects) → ranked match list`, lives in `src/lib/matching/score.ts` with unit tests.

```
For each architect where status = 'verified' AND availability != 'unavailable':
  score = 0
  reasons = []

  // +30 — direct specialty intersection
  overlap = project.required_specialties ∩ architect.specialties
  if overlap.length > 0:
    score += 30
    reasons.push({ kind: 'specialty', items: overlap, weight: 30 })

  // +20 — project type already in architect's portfolio
  if project.project_type ∈ architect.project_types:
    score += 20
    reasons.push({ kind: 'project_type', item: project.project_type, weight: 20 })

  // +15 — currently available
  if architect.availability === 'available':
    score += 15
    reasons.push({ kind: 'availability', weight: 15 })

  // +10 — experience threshold by budget
  threshold = budget < 50k ? 5 : 10
  if architect.years_experience >= threshold:
    score += 10
    reasons.push({ kind: 'experience', years: architect.years_experience, weight: 10 })

  // +10 — location signal (client mentioned a CI city in project_location)
  if project.project_location.toLowerCase().includes(architect.city.toLowerCase()):
    score += 10
    reasons.push({ kind: 'location', city: architect.city, weight: 10 })

  // +5 — strong rating
  if architect.rating >= 4.5:
    score += 5
    reasons.push({ kind: 'rating', value: architect.rating, weight: 5 })

Sort desc by score, slice top 5.
For each → INSERT into match_results.
UPDATE client_projects SET status='matched' WHERE id = project.id.
```

Max total = 90. Surfaced everywhere as `(score / 90) * 100 %` plus the `reasons` array so the client and the admin both see *why*.

The function is callable from:
- Server action after project submission (automatic).
- POST `/api/admin/match/recalculate?projectId=...` (admin button).

## 8. Auth & roles

- Supabase Auth email/password, no OAuth for MVP.
- Three flows: `register?role=client`, `register?role=architect`, plus an admin user created manually via SQL seed (no public admin signup).
- Session handled by `@supabase/ssr` in Next.js middleware (refresh on every request, server-readable cookie).
- Middleware redirects:
  - Any `/dashboard/client/*` → must be `role=client`.
  - Any `/dashboard/architecte/*` → must be `role=architect`.
  - Any `/admin/*` → must be `role=admin`, else 403.
- Login form posts to a server action that calls `supabase.auth.signInWithPassword`.
- Forgot password uses GoTrue's reset link; in self-hosted dev the email lands in Supabase Studio's "Email templates / Inbox" panel.

## 9. Language switch — *architectural*

Component `<LangSwitch />`, top-right of header.

Visual model: an architect's **dimension line** at the bottom of a cartouche.

```
   F R    │    E N
   ───┬───────────
      ▲                ← the tick (4 px notch + 8 px segment) sits under the active locale
```

Specifics:
- Container `inline-flex`, height 32 px, mono Geist Mono 11 px uppercase letter-spacing 0.18em.
- Letters padded 0 12 px each, separated by a 1 px vertical hairline `var(--hairline)`.
- Below the letter pair, a 1 px horizontal hairline `var(--hairline)` runs full width.
- A second 1 px segment, 24 px wide, in `var(--green)`, sits under the active locale and shifts left/right with `transform: translateX(...)` on switch, easing `cubic-bezier(0.32, 0.72, 0, 1)` 320 ms.
- A tiny 4 px vertical tick at the centre of that segment pointing **up** (like the head of a dimension extension).
- Inactive locale colour `var(--concrete-3)`; on hover → `var(--concrete-1)` with a ghosted tick sketched at 30 % opacity.
- Active locale colour `var(--ink)` on light backgrounds, `var(--paper)` on dark (`<nav>` modifier `is-dark`).
- Click on inactive triggers `router.replace` with the swapped locale prefix, preserving the current pathname.
- Accessible: `<button role="switch" aria-checked={...}>`, keyboard `Left/Right` swaps focus, `Enter` activates.

## 10. Project structure

```
reliote/
├── src/
│   ├── app/
│   │   ├── [locale]/
│   │   │   ├── (marketing)/
│   │   │   │   ├── layout.tsx           # nav + footer
│   │   │   │   └── page.tsx             # landing
│   │   │   ├── architectes/
│   │   │   │   ├── page.tsx             # public index
│   │   │   │   ├── [id]/page.tsx        # public profile
│   │   │   │   └── rejoindre/
│   │   │   │       ├── page.tsx
│   │   │   │       └── actions.ts       # server action
│   │   │   ├── projets/
│   │   │   │   └── initier/
│   │   │   │       ├── page.tsx
│   │   │   │       └── actions.ts
│   │   │   ├── auth/
│   │   │   │   ├── login/page.tsx
│   │   │   │   ├── register/page.tsx
│   │   │   │   ├── forgot/page.tsx
│   │   │   │   └── callback/route.ts
│   │   │   ├── dashboard/
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── client/page.tsx
│   │   │   │   └── architecte/page.tsx
│   │   │   └── admin/
│   │   │       ├── layout.tsx
│   │   │       ├── page.tsx
│   │   │       ├── architectes/page.tsx
│   │   │       ├── projets/page.tsx
│   │   │       └── matches/page.tsx
│   │   ├── api/
│   │   │   └── admin/
│   │   │       └── match/
│   │   │           └── recalculate/route.ts
│   │   ├── layout.tsx
│   │   └── middleware.ts
│   ├── components/
│   │   ├── ui/                          # shadcn primitives
│   │   ├── landing/
│   │   │   ├── Hero.tsx
│   │   │   ├── StatsBar.tsx
│   │   │   ├── Pillars.tsx
│   │   │   ├── ArchitectIndex.tsx
│   │   │   ├── ArchitectCard.tsx
│   │   │   ├── ArchitectDrawer.tsx
│   │   │   ├── Process.tsx
│   │   │   ├── FeaturedCase.tsx
│   │   │   ├── Audiences.tsx
│   │   │   ├── Journal.tsx
│   │   │   ├── CtaBand.tsx
│   │   │   └── Footer.tsx
│   │   ├── forms/
│   │   │   ├── ArchitectWizard.tsx
│   │   │   ├── ProjectWizard.tsx
│   │   │   └── steps/
│   │   ├── admin/
│   │   │   ├── AdminShell.tsx
│   │   │   ├── ArchitectsTable.tsx
│   │   │   ├── ProjectsTable.tsx
│   │   │   └── MatchesView.tsx
│   │   └── shared/
│   │       ├── Nav.tsx
│   │       ├── LangSwitch.tsx
│   │       ├── BrandMark.tsx
│   │       ├── Hairline.tsx
│   │       └── Eyebrow.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts                # browser client
│   │   │   ├── server.ts                # server client (cookies)
│   │   │   ├── service.ts               # service-role client (server-only)
│   │   │   └── middleware.ts            # session refresh
│   │   ├── validation/
│   │   │   ├── architect.schema.ts
│   │   │   └── project.schema.ts
│   │   ├── matching/
│   │   │   ├── score.ts
│   │   │   └── score.test.ts
│   │   └── i18n/
│   │       ├── config.ts
│   │       └── request.ts
│   ├── messages/
│   │   ├── fr.json
│   │   └── en.json
│   ├── styles/
│   │   └── globals.css                  # tokens + fonts + utilities
│   └── types/
│       └── database.ts                  # generated via supabase gen types
├── supabase/
│   ├── docker-compose.yml
│   ├── .env.example
│   ├── migrations/
│   │   ├── 0001_schema.sql
│   │   ├── 0002_rls.sql
│   │   └── 0003_triggers.sql
│   ├── seed.sql                         # 8 architects from the design + 3 demo projects + 1 admin
│   └── README.md                        # how to start the stack
├── public/
│   ├── assets/                          # photos from the design bundle
│   └── reliote-logo.svg
├── Dockerfile                           # Next.js production build
├── .env.example
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md                            # full setup, dev, deploy
```

## 11. Setup & deployment

### Local dev
1. `git clone` then `cd reliote && cp .env.example .env.local`.
2. `cd supabase && cp .env.example .env && docker compose up -d` → starts Postgres, GoTrue, PostgREST, Storage, Studio on `localhost:54321` and `localhost:54323`.
3. Run migrations: `psql` or Supabase CLI loads `migrations/*.sql` then `seed.sql`.
4. From repo root: `npm install && npm run dev` → app on `localhost:3000`.
5. Seeded admin login: `admin@reliote.test` / `admin-dev-password` (printed in seed).

### VPS deployment (later, post-MVP step)
- Same `supabase/docker-compose.yml` on the VPS, with real secrets in `supabase/.env`.
- Next.js app built via the repo `Dockerfile`, runs with env pointing to the VPS Supabase URL.
- Behind nginx + Let's Encrypt.

## 12. Quality gates

- TypeScript strict mode, no `any` in business logic.
- Every form: visible loading state, error state, success state, empty states where relevant.
- Zod schemas shared between client (React Hook Form resolver) and server actions.
- Matching engine has unit tests (≥ 5 cases incl. zero matches, partial match, all weights).
- RLS verified manually with at least three test sessions (anonymous, client, architect, admin).
- Lighthouse desktop ≥ 90 on landing.
- Responsive checkpoints: 360 / 768 / 1024 / 1440 px.

## 13. Out-of-scope tracker (post-MVP backlog)

Tracked so we can come back fast:
- Production SMTP wiring (Resend or Postmark) for password reset and admin notifications.
- File upload for architect portfolio images (Supabase Storage bucket + signed URLs).
- Internal messaging between client and matched architect.
- Email notifications: new project, new match, status change.
- Public review system + rating computation from real client feedback.
- Stripe-based mission escrow / milestone payments.
- More refined matching (semantic search on `project_description`).

---

## 14. Acceptance criteria

The MVP is complete when **all** of the following are demonstrably true on a freshly-cloned repo with `docker compose up -d` and `npm run dev`:

1. Landing page at `/fr` matches the locked design at every section.
2. Toggling the architectural lang switch at the top-right swaps the entire page to `/en` and back, preserving scroll position-ish (router navigation is acceptable).
3. An anonymous visitor can register as an architect, fill the 6-step wizard, submit, and see their profile appear in `architect_profiles` with `status='pending'`.
4. An anonymous visitor can register as a client, fill the 5-step wizard, submit, and see a confirmation page with the top 3-5 architects ranked by score with their reason breakdown.
5. The seeded admin can log in, see real counters, validate a pending architect, see the architect become public on `/architectes`, see all projects and their matches, and re-run the matching for one project.
6. Closing and reopening the browser preserves the session; logging out clears it.
7. RLS is on: from an architect session, `select * from client_projects` returns only projects where the architect appears in `match_results`.
