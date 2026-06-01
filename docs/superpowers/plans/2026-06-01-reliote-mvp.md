# Reliote MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Reliote MVP — a premium FR/EN landing page, a self-hosted Supabase backend, three-role auth, architect onboarding, client project submission with explainable matching, and an admin dashboard, all faithful to the locked V1 *Éditorial minéral* design.

**Architecture:** Next.js 15 App Router (TypeScript) + Tailwind v4 + shadcn/ui + Framer Motion on the frontend; self-hosted Supabase (Postgres + GoTrue + PostgREST + Storage + Studio) via docker-compose on the backend; next-intl for FR/EN; React Hook Form + Zod for forms; pure scoring function for matching. The Next.js app talks to Supabase via `@supabase/ssr` with one client-side, one server-side (cookies) and one service-role helper. RLS is enabled everywhere; the matching engine inserts via the service-role key.

**Tech Stack:** Next.js 15, React 19, TypeScript 5, Tailwind CSS v4, shadcn/ui, Framer Motion, next-intl, React Hook Form, Zod, @supabase/ssr, @supabase/supabase-js, Vitest, Supabase self-hosted (docker-compose), Postgres 15.

**Reference:**
- Spec: `docs/superpowers/specs/2026-06-01-reliote-mvp-design.md` (re-read it before each phase)
- Locked design source: `_design-reference/reliote/project/index.html`, `data.jsx`, `app.jsx`, `sections-v2.jsx`, `modal.jsx`, `extra-sections.jsx`. **Treat these as ground truth for visuals only — copy values (colors, paddings, copy strings), not the React structure.**

**Source layout note:** All app code lives under `src/`. Migration paths assume the spec's project structure (§ 10 of the spec).

---

## File Structure

```
reliote/
├── src/
│   ├── app/[locale]/...                Routes (see spec §10)
│   ├── components/
│   │   ├── ui/                         shadcn primitives
│   │   ├── landing/                    Hero, StatsBar, Pillars, ArchitectIndex, ArchitectCard, ArchitectDrawer, Process, FeaturedCase, Audiences, Journal, CtaBand, Footer
│   │   ├── forms/                      ArchitectWizard, ProjectWizard, steps/
│   │   ├── admin/                      AdminShell, ArchitectsTable, ProjectsTable, MatchesView
│   │   └── shared/                     Nav, LangSwitch, BrandMark, Hairline, Eyebrow
│   ├── lib/
│   │   ├── supabase/                   client, server, service, middleware
│   │   ├── validation/                 architect.schema.ts, project.schema.ts
│   │   ├── matching/                   score.ts + score.test.ts
│   │   └── i18n/                       config.ts, request.ts
│   ├── messages/{fr,en}.json
│   ├── styles/globals.css              tokens + fonts + utilities
│   └── types/database.ts               generated
├── supabase/
│   ├── docker-compose.yml
│   ├── .env.example
│   ├── migrations/{0001_schema,0002_rls,0003_triggers}.sql
│   ├── seed.sql
│   └── README.md
├── public/assets/...                   copied from _design-reference
├── Dockerfile
├── .env.example
└── README.md
```

---

# Phase 0 — Foundation

### Task 1: Initialize Next.js 15 with TypeScript and Tailwind v4

**Files:**
- Create: `package.json`, `next.config.ts`, `tsconfig.json`, `postcss.config.mjs`, `tailwind.config.ts`, `.gitignore`, `.eslintrc.json`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/styles/globals.css` (empty for now)

- [ ] **Step 1: Scaffold the project**

```bash
cd C:/Projets/Reliote
npx create-next-app@latest reliote --typescript --tailwind --eslint --app --src-dir --no-import-alias --use-npm
mv reliote/* reliote/.* . 2>/dev/null || true
rmdir reliote 2>/dev/null || true
```

- [ ] **Step 2: Move generated `globals.css` to `src/styles/globals.css`**

```bash
mv src/app/globals.css src/styles/globals.css
```

Then in `src/app/layout.tsx`, change the import to `import "@/styles/globals.css";`. Update `tsconfig.json` `paths` to include `"@/*": ["src/*"]`.

- [ ] **Step 3: Verify dev server runs**

Run: `npm run dev`. Expected: serves on `localhost:3000` with default Next.js page. Stop the server (Ctrl-C).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js 15 + Tailwind v4 + TS"
```

---

### Task 2: Install fonts and write design tokens into `globals.css`

**Files:**
- Modify: `src/app/layout.tsx`, `src/styles/globals.css`

- [ ] **Step 1: Load fonts via `next/font/google`**

In `src/app/layout.tsx`:

```tsx
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import "@/styles/globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans", weight: ["300","400","500","600","700"] });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono", weight: ["300","400","500"] });
const instrument = Instrument_Serif({ subsets: ["latin"], variable: "--font-display", weight: "400", style: ["normal","italic"] });

export const metadata = { title: "Reliote — Architecture, sélectionnée.", description: "Plateforme premium de mise en relation entre porteurs de projets en France et architectes en Côte d'Ivoire." };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${geist.variable} ${geistMono.variable} ${instrument.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 2: Replace `src/styles/globals.css` with the Reliote tokens**

```css
@import "tailwindcss";

@theme {
  --color-green:        #073E18;
  --color-green-deep:   #052b10;
  --color-green-soft:   #0a4a1f;
  --color-brass:        #b89968;
  --color-paper:        #f3f1ec;
  --color-paper-2:      #ebe8e1;
  --color-ink:          #14140f;
  --color-ink-2:        #2a2925;
  --color-concrete-1:   #4a4844;
  --color-concrete-2:   #6e6c66;
  --color-concrete-3:   #9b9892;
  --color-concrete-4:   #c8c5be;
  --color-water:        #0c1614;

  --font-sans:    var(--font-sans), "Söhne", "Helvetica Neue", system-ui, sans-serif;
  --font-mono:    var(--font-mono), "JetBrains Mono", ui-monospace, monospace;
  --font-display: var(--font-display), "Söhne", serif;
}

:root {
  --hairline:      rgba(20, 20, 15, 0.16);
  --hairline-soft: rgba(20, 20, 15, 0.08);
  --gutter: clamp(16px, 2.2vw, 32px);
  --edge:   clamp(20px, 3.4vw, 56px);
}

* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body {
  font-family: var(--font-sans);
  background: var(--color-paper);
  color: var(--color-ink);
  font-size: 16px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
  font-feature-settings: "ss01", "ss02", "cv11";
  overflow-x: hidden;
}
img { max-width: 100%; display: block; }
a { color: inherit; text-decoration: none; }
button { font-family: inherit; cursor: pointer; border: none; background: none; color: inherit; padding: 0; }
::selection { background: var(--color-green); color: var(--color-paper); }

.mono     { font-family: var(--font-mono); letter-spacing: 0.02em; }
.serif-i  { font-family: var(--font-display); font-style: italic; font-weight: 400; }
.eyebrow  { font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--color-concrete-2); }
.hairline   { height: 1px; background: var(--hairline); width: 100%; }
.hairline-v { width: 1px;  background: var(--hairline); align-self: stretch; }
.page-edge  { padding-left: var(--edge); padding-right: var(--edge); }
.grid-12    { display: grid; grid-template-columns: repeat(12, 1fr); column-gap: var(--gutter); }
```

- [ ] **Step 3: Sanity test**

Replace `src/app/page.tsx` with:

```tsx
export default function Page() {
  return (
    <main className="page-edge py-16">
      <p className="eyebrow">01 — Reliote</p>
      <h1 className="serif-i text-6xl mt-4">Architectes <em>d'exception.</em></h1>
      <div className="hairline mt-8" />
    </main>
  );
}
```

Run `npm run dev`, open `localhost:3000`. Expected: italic serif headline on cream background, monospace eyebrow above, hairline below. Stop.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: design tokens, fonts, base styles"
```

---

### Task 3: Install runtime deps

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install everything we'll use**

```bash
npm i @supabase/ssr @supabase/supabase-js next-intl framer-motion react-hook-form @hookform/resolvers zod clsx tailwind-merge lucide-react class-variance-authority
npm i -D vitest @vitest/ui tsx
```

- [ ] **Step 2: Add `cn` helper**

Create `src/lib/utils.ts`:

```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
```

- [ ] **Step 3: Add Vitest scripts**

In `package.json` `"scripts"` add `"test": "vitest run"` and `"test:watch": "vitest"`.

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import path from "node:path";
export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  test: { environment: "node", include: ["src/**/*.test.ts"] },
});
```

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "chore: install runtime deps + vitest"
```

---

### Task 4: Self-hosted Supabase stack via docker-compose

**Files:**
- Create: `supabase/docker-compose.yml`, `supabase/.env.example`, `supabase/README.md`, `supabase/volumes/api/kong.yml`

- [ ] **Step 1: Pull the official Supabase self-hosted bundle**

```bash
mkdir -p supabase-tmp
git clone --depth 1 https://github.com/supabase/supabase supabase-tmp
cp -r supabase-tmp/docker/. supabase/
rm -rf supabase-tmp
```

- [ ] **Step 2: Create `supabase/.env.example` from the bundle's `.env.example`, then copy to `.env`**

```bash
cp supabase/.env.example.bak supabase/.env.example 2>/dev/null || cp supabase/.env.example supabase/.env.example.bak
cp supabase/.env.example supabase/.env
```

The bundle ships an `.env.example` already; we just generate dev secrets. Open `supabase/.env` and set strong unique values for `POSTGRES_PASSWORD`, `JWT_SECRET` (≥32 chars), `ANON_KEY`, `SERVICE_ROLE_KEY` (use `npx supabase --version` then `openssl rand -hex 32` for secrets; generate `ANON_KEY` and `SERVICE_ROLE_KEY` JWTs at `https://supabase.com/docs/guides/self-hosting/docker#generate-api-keys`).

Also set:
- `STUDIO_DEFAULT_ORGANIZATION=Reliote`
- `STUDIO_DEFAULT_PROJECT=reliote`
- `DASHBOARD_USERNAME=admin`
- `DASHBOARD_PASSWORD=<strong>`
- `KONG_HTTP_PORT=54321`
- `STUDIO_PORT=54323`
- `SMTP_*` — leave default for dev (mailpit-style or disabled).

- [ ] **Step 3: Add `supabase/.gitignore`**

```
.env
volumes/db/data/
volumes/storage/
```

- [ ] **Step 4: Write `supabase/README.md`**

```md
# Reliote — Supabase self-hosted

## Start
```bash
cd supabase
cp .env.example .env  # fill secrets
docker compose up -d
```
- API:    http://localhost:54321
- Studio: http://localhost:54323 (login from DASHBOARD_USERNAME/PASSWORD)

## Apply migrations
```bash
docker compose exec db psql -U postgres -d postgres -f /docker-entrypoint-initdb.d/migrations/0001_schema.sql
docker compose exec db psql -U postgres -d postgres -f /docker-entrypoint-initdb.d/migrations/0002_rls.sql
docker compose exec db psql -U postgres -d postgres -f /docker-entrypoint-initdb.d/migrations/0003_triggers.sql
docker compose exec db psql -U postgres -d postgres -f /docker-entrypoint-initdb.d/seed.sql
```

(For automatic load on first boot, files in `migrations/` and `seed.sql` are mounted into `/docker-entrypoint-initdb.d/`.)

## Reset
```bash
docker compose down -v
```
```

- [ ] **Step 5: Mount migrations folder into the db container**

In `supabase/docker-compose.yml`, find the `db` service and add to its `volumes:` list:

```yaml
      - ./migrations:/docker-entrypoint-initdb.d/migrations:ro
      - ./seed.sql:/docker-entrypoint-initdb.d/seed.sql:ro
```

- [ ] **Step 6: Start the stack**

```bash
cd supabase && docker compose up -d
docker compose ps
```

Expected: `db`, `auth`, `rest`, `realtime`, `storage`, `studio`, `kong`, `meta` all `running` / `healthy`. Browse `localhost:54323`, log in with the dashboard creds, see an empty database.

- [ ] **Step 7: Commit**

```bash
cd .. && git add supabase/.gitignore supabase/README.md supabase/docker-compose.yml supabase/.env.example
git commit -m "feat(supabase): self-hosted docker-compose stack"
```

---

### Task 5: Migration 0001 — enums and tables

**Files:**
- Create: `supabase/migrations/0001_schema.sql`

- [ ] **Step 1: Write the migration**

```sql
-- 0001_schema.sql
create extension if not exists "pgcrypto";

create type user_role           as enum ('client','architect','admin');
create type architect_status    as enum ('pending','verified','rejected','paused');
create type project_status      as enum ('new','matched','in_review','closed');
create type project_type        as enum ('residential','hospitality','commercial','urban','cultural','other');
create type availability_status as enum ('available','busy','unavailable');

create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        user_role   not null default 'client',
  full_name   text,
  locale      text        not null default 'fr',
  created_at  timestamptz not null default now()
);

create table architect_profiles (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid references profiles(id) on delete cascade,
  full_name         text not null,
  email             text not null,
  phone             text,
  country           text not null default 'Côte d''Ivoire',
  city              text not null,
  specialties       text[] not null default '{}',
  years_experience  int not null check (years_experience between 0 and 70),
  project_types     project_type[] not null default '{}',
  description       text not null,
  portfolio_url     text,
  photo_url         text,
  languages         text[] not null default '{FR}',
  rating            numeric(2,1),
  availability      availability_status not null default 'available',
  fee_from          text,
  status            architect_status not null default 'pending',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index on architect_profiles (status);
create index on architect_profiles (availability);

create table client_projects (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid references profiles(id) on delete set null,
  client_name          text not null,
  email                text not null,
  phone                text,
  project_location     text not null,
  project_type         project_type not null,
  project_description  text not null,
  required_specialties text[] not null default '{}',
  budget_range         text,
  timeline             text,
  notes                text,
  status               project_status not null default 'new',
  created_at           timestamptz not null default now()
);

create index on client_projects (status);

create table match_results (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references client_projects(id) on delete cascade,
  architect_id  uuid not null references architect_profiles(id) on delete cascade,
  score         int  not null,
  reasons       jsonb not null default '[]',
  created_at    timestamptz not null default now(),
  unique(project_id, architect_id)
);

create index on match_results (project_id, score desc);
```

- [ ] **Step 2: Apply and verify**

```bash
cd supabase
docker compose exec db psql -U postgres -d postgres -f /docker-entrypoint-initdb.d/migrations/0001_schema.sql
docker compose exec db psql -U postgres -d postgres -c "\dt"
```

Expected: tables `profiles, architect_profiles, client_projects, match_results` listed.

- [ ] **Step 3: Commit**

```bash
cd .. && git add supabase/migrations/0001_schema.sql && git commit -m "feat(db): schema 0001 — enums, tables, indexes"
```

---

### Task 6: Migration 0002 — RLS policies + admin helper

**Files:**
- Create: `supabase/migrations/0002_rls.sql`

- [ ] **Step 1: Write the policies**

```sql
-- 0002_rls.sql

create or replace function public.current_role()
returns user_role language sql stable as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean language sql stable as $$
  select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false);
$$;

-- profiles --
alter table profiles enable row level security;
create policy "profiles self read"
  on profiles for select using (auth.uid() = id);
create policy "profiles self update"
  on profiles for update using (auth.uid() = id);
create policy "profiles admin all"
  on profiles for all using (is_admin());

-- architect_profiles --
alter table architect_profiles enable row level security;
create policy "architects public read verified"
  on architect_profiles for select using (status = 'verified');
create policy "architects owner read"
  on architect_profiles for select using (auth.uid() = user_id);
create policy "architects admin all"
  on architect_profiles for all using (is_admin());
create policy "architects owner insert"
  on architect_profiles for insert with check (auth.uid() = user_id and current_role() = 'architect');
create policy "architects owner update"
  on architect_profiles for update using (auth.uid() = user_id);

-- client_projects --
alter table client_projects enable row level security;
create policy "projects owner read"
  on client_projects for select using (auth.uid() = user_id);
create policy "projects owner insert"
  on client_projects for insert with check (auth.uid() = user_id);
create policy "projects admin all"
  on client_projects for all using (is_admin());
create policy "projects matched architect read"
  on client_projects for select using (
    exists (
      select 1 from match_results mr
      join architect_profiles ap on ap.id = mr.architect_id
      where mr.project_id = client_projects.id and ap.user_id = auth.uid()
    )
  );

-- match_results --
alter table match_results enable row level security;
create policy "matches project owner read"
  on match_results for select using (
    exists (select 1 from client_projects cp where cp.id = match_results.project_id and cp.user_id = auth.uid())
  );
create policy "matches architect read"
  on match_results for select using (
    exists (select 1 from architect_profiles ap where ap.id = match_results.architect_id and ap.user_id = auth.uid())
  );
create policy "matches admin all"
  on match_results for all using (is_admin());
-- inserts happen with service_role; no policy needed (service role bypasses RLS).
```

- [ ] **Step 2: Apply**

```bash
cd supabase
docker compose exec db psql -U postgres -d postgres -f /docker-entrypoint-initdb.d/migrations/0002_rls.sql
docker compose exec db psql -U postgres -d postgres -c "select tablename, rowsecurity from pg_tables where schemaname='public';"
```

Expected: all 4 tables show `rowsecurity = t`.

- [ ] **Step 3: Commit**

```bash
cd .. && git add supabase/migrations/0002_rls.sql && git commit -m "feat(db): 0002 — RLS + admin helpers"
```

---

### Task 7: Migration 0003 — auth user trigger

**Files:**
- Create: `supabase/migrations/0003_triggers.sql`

- [ ] **Step 1: Write the trigger**

```sql
-- 0003_triggers.sql
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, role, full_name, locale)
  values (
    new.id,
    coalesce((new.raw_user_meta_data ->> 'role')::user_role, 'client'),
    new.raw_user_meta_data ->> 'full_name',
    coalesce(new.raw_user_meta_data ->> 'locale', 'fr')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- updated_at maintenance
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists touch_architect_profiles on architect_profiles;
create trigger touch_architect_profiles before update on architect_profiles
  for each row execute function public.touch_updated_at();
```

- [ ] **Step 2: Apply**

```bash
cd supabase
docker compose exec db psql -U postgres -d postgres -f /docker-entrypoint-initdb.d/migrations/0003_triggers.sql
```

- [ ] **Step 3: Commit**

```bash
cd .. && git add supabase/migrations/0003_triggers.sql && git commit -m "feat(db): 0003 — auth user + updated_at triggers"
```

---

### Task 8: Seed data — 1 admin + 8 architects + 3 demo projects

**Files:**
- Create: `supabase/seed.sql`

- [ ] **Step 1: Write the seed**

```sql
-- supabase/seed.sql
-- Idempotent: re-runnable.

-- Admin: insert into auth.users directly (self-hosted only).
-- Email: admin@reliote.test  Password: ReliotePass2026!
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
values (
  '00000000-0000-0000-0000-00000000a001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'admin@reliote.test',
  crypt('ReliotePass2026!', gen_salt('bf')),
  now(),
  jsonb_build_object('role','admin','full_name','Reliote Admin','locale','fr'),
  now(), now()
) on conflict (id) do nothing;

-- The trigger created the profile. Ensure role is admin (in case the trigger
-- ran before the metadata existed):
update public.profiles set role = 'admin', full_name = 'Reliote Admin'
  where id = '00000000-0000-0000-0000-00000000a001';

-- 8 architects (from the locked design's data.jsx)
insert into architect_profiles (id, full_name, email, city, specialties, years_experience, project_types, description, portfolio_url, photo_url, languages, rating, availability, fee_from, status) values
('00000000-0000-0000-0000-0000000a0001','Aïssata N''Guessan','aissata@atelier-faidherbe.test','Cocody, Abidjan','{Résidentiel,Hospitalité}',12,'{residential,hospitality}','Travail sensible sur la lumière naturelle tropicale et la maîtrise des volumes en béton brut.','https://atelier-faidherbe.test','https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=500&h=620&fit=crop&q=80&auto=format','{FR,EN}',4.9,'available','€48k','verified'),
('00000000-0000-0000-0000-0000000a0002','Bakary Traoré','bakary@forme-latitude.test','Plateau, Abidjan','{Commercial,Urbain}',18,'{commercial,urban}','Spécialiste tertiaire et tours mixtes. Études de structure intégrées, certifications HQE Tropical.','https://forme-latitude.test','https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=620&fit=crop&q=80&auto=format','{FR,EN,DE}',4.8,'busy','€90k','verified'),
('00000000-0000-0000-0000-0000000a0003','Clémentine Yao','clementine@studio-asa.test','Bingerville','{Résidentiel,Culturel}',9,'{residential,cultural}','Maisons-jardin, espaces culturels. Approche éditoriale, attention aux finitions.','https://studio-asa.test','https://images.unsplash.com/photo-1580489944761-15a19d654956?w=500&h=620&fit=crop&q=80&auto=format','{FR,EN,IT}',5.0,'available','€36k','verified'),
('00000000-0000-0000-0000-0000000a0004','Daniel K. Diallo','daniel@parallele-archi.test','Marcory, Abidjan','{Hospitalité,Culturel}',15,'{hospitality,cultural}','Hôtellerie balnéaire et programmes culturels.','https://parallele-archi.test','https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&h=620&fit=crop&q=80&auto=format','{FR,EN}',4.9,'available','€72k','verified'),
('00000000-0000-0000-0000-0000000a0005','Émilie Brou','emilie@bureau-lagune.test','Riviera, Abidjan','{Résidentiel}',7,'{residential}','Villas contemporaines bord de lagune. Rénovation lourde, extensions.','https://bureau-lagune.test','https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=500&h=620&fit=crop&q=80&auto=format','{FR,EN}',4.7,'available','€28k','verified'),
('00000000-0000-0000-0000-0000000a0006','Florent Achi','florent@atelier21.test','Yopougon','{Urbain,Commercial}',16,'{urban,commercial}','Urbanisme opérationnel, masterplans. Pilotage de chantiers complexes.','https://atelier21.test','https://images.unsplash.com/photo-1463453091185-61582044d556?w=500&h=620&fit=crop&q=80&auto=format','{FR,EN}',4.8,'busy','€60k','verified'),
('00000000-0000-0000-0000-0000000a0007','Grace Kouamé','grace@rive-est.test','Cocody','{Résidentiel,Hospitalité}',10,'{residential,hospitality}','Architecture résidentielle premium et maisons d''hôtes.','https://rive-est.test','https://images.unsplash.com/photo-1592621385612-4d7129426394?w=500&h=620&fit=crop&q=80&auto=format','{FR,EN,PT}',4.9,'available','€40k','verified'),
('00000000-0000-0000-0000-0000000a0008','Hervé N''Doli','herve@planb-archi.test','Plateau','{Commercial,Culturel}',13,'{commercial,cultural}','Programmes culturels, sièges sociaux et galeries.','https://planb-archi.test','https://images.unsplash.com/photo-1545167622-3a6ac756afa4?w=500&h=620&fit=crop&q=80&auto=format','{FR,EN}',4.8,'available','€55k','verified')
on conflict (id) do nothing;

-- 3 demo projects
insert into client_projects (id, client_name, email, project_location, project_type, project_description, required_specialties, budget_range, timeline, status) values
('00000000-0000-0000-0000-0000000c0001','Marie L.','marie.l@example.test','Bingerville · Côte d''Ivoire','residential','Villa contemporaine bord de lagune, 350 m², jardin tropical et bassin.','{Résidentiel}','€500k–€800k','12–18 mois','new'),
('00000000-0000-0000-0000-0000000c0002','Pierre G.','pierre.g@example.test','Plateau · Abidjan','commercial','Siège régional 1200 m² avec espaces collaboratifs et patio intérieur.','{Commercial,Urbain}','€1M–€2M','24 mois','new'),
('00000000-0000-0000-0000-0000000c0003','Sophie M.','sophie.m@example.test','Cocody · Abidjan','hospitality','Maison d''hôtes 8 chambres, restaurant signature, piscine de 25m.','{Hospitalité,Résidentiel}','€350k–€500k','15 mois','new')
on conflict (id) do nothing;
```

- [ ] **Step 2: Apply**

```bash
cd supabase
docker compose exec db psql -U postgres -d postgres -f /docker-entrypoint-initdb.d/seed.sql
docker compose exec db psql -U postgres -d postgres -c "select count(*) from architect_profiles; select count(*) from client_projects;"
```

Expected: 8 architects, 3 projects.

- [ ] **Step 3: Commit**

```bash
cd .. && git add supabase/seed.sql && git commit -m "feat(db): seed admin, 8 architects, 3 demo projects"
```

---

### Task 9: Generate TypeScript types from the live DB

**Files:**
- Create: `src/types/database.ts`, `scripts/gen-types.sh`

- [ ] **Step 1: Add the generator script**

`scripts/gen-types.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
# Use Supabase CLI if present, else fall back to npx
npx supabase gen types typescript --db-url "postgresql://postgres:${POSTGRES_PASSWORD:-postgres}@localhost:54322/postgres" --schema public > src/types/database.ts
```

Add npm script in `package.json`: `"db:types": "bash scripts/gen-types.sh"`.

- [ ] **Step 2: Run it**

Read `supabase/.env` to find `POSTGRES_PASSWORD`, then:

```bash
POSTGRES_PASSWORD=<the-value> npm run db:types
head -40 src/types/database.ts
```

Expected: a `Database` interface with `public.Tables.architect_profiles.Row` etc.

- [ ] **Step 3: Commit**

```bash
git add scripts/gen-types.sh package.json src/types/database.ts && git commit -m "feat: db type generation"
```

---

### Task 10: Env files for the Next.js app

**Files:**
- Create: `.env.example`, `.env.local`

- [ ] **Step 1: Write `.env.example`**

```
# Public (browser)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<paste ANON_KEY from supabase/.env>

# Server-only
SUPABASE_SERVICE_ROLE_KEY=<paste SERVICE_ROLE_KEY from supabase/.env>
SITE_URL=http://localhost:3000
```

- [ ] **Step 2: Copy and fill `.env.local`**

```bash
cp .env.example .env.local
# Edit .env.local with the actual ANON_KEY and SERVICE_ROLE_KEY from supabase/.env
```

Add `.env.local` to `.gitignore` (Next.js scaffolds this; verify).

- [ ] **Step 3: Commit**

```bash
git add .env.example .gitignore && git commit -m "chore: env vars"
```

---

# Phase 1 — Auth, shared chrome, i18n

### Task 11: Supabase clients

**Files:**
- Create: `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, `src/lib/supabase/service.ts`, `src/lib/supabase/middleware.ts`

- [ ] **Step 1: Browser client**

```ts
// src/lib/supabase/client.ts
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

- [ ] **Step 2: Server (cookies) client**

```ts
// src/lib/supabase/server.ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(toSet) { try { toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch {} },
      },
    }
  );
}
```

- [ ] **Step 3: Service-role client (server only — never imported from a `'use client'` file)**

```ts
// src/lib/supabase/service.ts
import "server-only";
import { createClient as createSb } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export function createServiceClient() {
  return createSb<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
```

- [ ] **Step 4: Middleware helper**

```ts
// src/lib/supabase/middleware.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(toSet) {
          toSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  return { response, user, supabase };
}
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/supabase && git commit -m "feat(auth): supabase clients (browser/server/service/middleware)"
```

---

### Task 12: next-intl wiring with locale-prefixed routes

**Files:**
- Create: `src/lib/i18n/config.ts`, `src/lib/i18n/request.ts`, `src/middleware.ts`, `src/messages/fr.json`, `src/messages/en.json`
- Modify: `next.config.ts`, `src/app/layout.tsx`
- Create: `src/app/[locale]/layout.tsx`
- Move: `src/app/page.tsx` → `src/app/[locale]/page.tsx`

- [ ] **Step 1: i18n config**

```ts
// src/lib/i18n/config.ts
export const locales = ["fr", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "fr";
```

```ts
// src/lib/i18n/request.ts
import { getRequestConfig } from "next-intl/server";
import { locales, defaultLocale, type Locale } from "./config";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale: Locale = (locales as readonly string[]).includes(requested ?? "") ? (requested as Locale) : defaultLocale;
  return { locale, messages: (await import(`@/messages/${locale}.json`)).default };
});
```

- [ ] **Step 2: `next.config.ts`**

```ts
import createNextIntlPlugin from "next-intl/plugin";
const withNextIntl = createNextIntlPlugin("./src/lib/i18n/request.ts");

const config = {
  images: { remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }] },
};
export default withNextIntl(config);
```

- [ ] **Step 3: Middleware for locale routing + auth session**

```ts
// src/middleware.ts
import createIntlMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { locales, defaultLocale } from "@/lib/i18n/config";
import { updateSession } from "@/lib/supabase/middleware";

const intlMiddleware = createIntlMiddleware({
  locales: [...locales],
  defaultLocale,
  localePrefix: "always",
});

export async function middleware(request: NextRequest) {
  // 1) Locale routing
  const intlRes = intlMiddleware(request);
  if (intlRes && intlRes.headers.get("location")) return intlRes;

  // 2) Refresh Supabase session, keep cookies in sync
  const { response, user } = await updateSession(request);

  // 3) Route protection
  const url = request.nextUrl.pathname;
  const isAdmin = /^\/(fr|en)\/admin/.test(url);
  const isDashClient = /^\/(fr|en)\/dashboard\/client/.test(url);
  const isDashArch = /^\/(fr|en)\/dashboard\/architecte/.test(url);

  if (!user && (isAdmin || isDashClient || isDashArch)) {
    const locale = url.split("/")[1] || defaultLocale;
    return NextResponse.redirect(new URL(`/${locale}/auth/login?next=${encodeURIComponent(url)}`, request.url));
  }

  // Merge intl response cookies into ours
  if (intlRes) intlRes.cookies.getAll().forEach((c) => response.cookies.set(c.name, c.value, c));
  return response;
}

export const config = {
  matcher: ["/((?!_next|api|favicon.ico|assets|.*\\..*).*)"],
};
```

- [ ] **Step 4: Stub message files**

`src/messages/fr.json`:

```json
{ "nav": { "architects": "Architectes", "approach": "Approche", "projects": "Projets", "journal": "Journal", "about": "À propos", "cta": "Initier un projet", "account": "Espace client" } }
```

`src/messages/en.json`:

```json
{ "nav": { "architects": "Architects", "approach": "Approach", "projects": "Projects", "journal": "Journal", "about": "About", "cta": "Start a project", "account": "Client area" } }
```

- [ ] **Step 5: Move page into locale segment**

```bash
mkdir -p src/app/\[locale\]
git mv src/app/page.tsx src/app/\[locale\]/page.tsx
```

Replace the contents with:

```tsx
import { useTranslations } from "next-intl";
export default function Page() {
  const t = useTranslations("nav");
  return <main className="page-edge py-16"><p className="eyebrow">01 — Reliote</p><h1 className="serif-i text-6xl mt-4">{t("cta")}</h1></main>;
}
```

Create `src/app/[locale]/layout.tsx`:

```tsx
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { locales } from "@/lib/i18n/config";
import { notFound } from "next/navigation";

export function generateStaticParams() { return locales.map((locale) => ({ locale })); }

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!locales.includes(locale as (typeof locales)[number])) notFound();
  setRequestLocale(locale);
  const messages = await getMessages();
  return <NextIntlClientProvider locale={locale} messages={messages}>{children}</NextIntlClientProvider>;
}
```

- [ ] **Step 6: Run and verify**

```bash
npm run dev
```

Open `localhost:3000` → should redirect to `localhost:3000/fr`. Visit `localhost:3000/en` → page in English (CTA reads "Start a project"). Stop.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat(i18n): next-intl FR/EN with locale-prefixed routes"
```

---

### Task 13: Strings — full FR/EN dictionary

**Files:**
- Modify: `src/messages/fr.json`, `src/messages/en.json`

- [ ] **Step 1: Port the full copy table from the design**

Open `_design-reference/reliote/project/data.jsx`. Replace `src/messages/fr.json` with a full namespace structure (`nav`, `hero`, `stats`, `pillars`, `architects`, `process`, `featured`, `audiences`, `journal`, `cta`, `footer`, `lang`, `wizardClient`, `wizardArchitect`, `admin`, `auth`).

For brevity in this plan, copy the FR text verbatim from `data.jsx` (lines 4-220 carry the entire FR copy: navLinks, heroEyebrow, heroTitle, heroSub, heroPrimary, heroSecondary, stats, pillarsHead, pillars, archHead, filters, pillarStats, procDeliverables, procVerbs, featHotspots, featStats, procHead, process, featHead, feat, audiences, journal). Convert JSX-y values like `<>... <em>...</em>...</>` to plain strings — split at the `<em>` so the renderer can wrap the italic word: `"hero.titlePre": "Architectes "`, `"hero.titleItalic": "d'exception,"`, `"hero.titleRest": "choisis avec méthode."`.

Mirror every key in `src/messages/en.json` with English copy from `data.jsx` (the `en` block in that file).

Also add the `lang` namespace:

```json
"lang": { "fr": "FR", "en": "EN", "switchTo": "Switch to {target}" }
```

- [ ] **Step 2: Commit**

```bash
git add src/messages && git commit -m "feat(i18n): full FR/EN dictionary from locked design"
```

---

### Task 14: Shared primitives — BrandMark, Hairline, Eyebrow

**Files:**
- Create: `src/components/shared/BrandMark.tsx`, `src/components/shared/Hairline.tsx`, `src/components/shared/Eyebrow.tsx`

- [ ] **Step 1: BrandMark** — the `R` in a bordered square next to the wordmark

```tsx
// src/components/shared/BrandMark.tsx
import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-[10px]", className)}>
      <span className="inline-grid place-items-center w-[22px] h-[22px] border border-current font-display text-[13px] leading-none pt-px">R</span>
      <span className="font-sans font-medium tracking-[0.18em] text-[13px]">RELIOTE</span>
    </span>
  );
}
```

- [ ] **Step 2: Hairline + Eyebrow**

```tsx
// src/components/shared/Hairline.tsx
export function Hairline({ vertical = false }: { vertical?: boolean }) {
  return <span className={vertical ? "hairline-v" : "hairline"} aria-hidden />;
}
```

```tsx
// src/components/shared/Eyebrow.tsx
import { cn } from "@/lib/utils";
export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("eyebrow", className)}>{children}</p>;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/shared && git commit -m "feat: shared primitives — BrandMark, Hairline, Eyebrow"
```

---

### Task 15: LangSwitch — architectural dimension line

**Files:**
- Create: `src/components/shared/LangSwitch.tsx`, `src/components/shared/LangSwitch.module.css`

- [ ] **Step 1: Component**

```tsx
"use client";
// src/components/shared/LangSwitch.tsx
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { locales, type Locale } from "@/lib/i18n/config";
import styles from "./LangSwitch.module.css";

export function LangSwitch({ dark = false }: { dark?: boolean }) {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("lang");
  const [pending, startTransition] = useTransition();

  function go(target: Locale) {
    if (target === locale) return;
    const next = pathname.replace(new RegExp(`^/${locale}`), `/${target}`);
    startTransition(() => router.replace(next));
  }

  return (
    <div className={`${styles.root} ${dark ? styles.dark : ""}`} data-pending={pending}>
      {locales.map((l, i) => (
        <button
          key={l}
          role="switch"
          aria-checked={l === locale}
          aria-label={t("switchTo", { target: t(l) })}
          className={`${styles.letter} ${l === locale ? styles.active : ""}`}
          onClick={() => go(l)}
        >
          {t(l)}
          {i === 0 && <span className={styles.divider} aria-hidden />}
        </button>
      ))}
      <span className={styles.rule} aria-hidden />
      <span
        className={styles.tick}
        style={{ transform: `translateX(${locale === "en" ? 100 : 0}%)` }}
        aria-hidden
      />
    </div>
  );
}
```

- [ ] **Step 2: CSS module — the dimension line look**

```css
/* src/components/shared/LangSwitch.module.css */
.root {
  position: relative;
  display: inline-flex;
  align-items: center;
  height: 32px;
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--color-concrete-3);
}
.letter {
  padding: 0 12px;
  height: 32px;
  position: relative;
  transition: color 240ms ease;
}
.letter:hover { color: var(--color-concrete-1); }
.letter.active { color: var(--color-ink); }
.divider {
  position: absolute;
  right: 0; top: 6px; bottom: 6px;
  width: 1px;
  background: var(--hairline);
}
.rule {
  position: absolute;
  left: 0; right: 0; bottom: 0;
  height: 1px;
  background: var(--hairline);
}
.tick {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 50%;
  height: 1px;
  background: var(--color-green);
  transition: transform 320ms cubic-bezier(0.32, 0.72, 0, 1);
}
.tick::before {
  content: "";
  position: absolute;
  left: 50%;
  bottom: 0;
  width: 1px;
  height: 4px;
  background: var(--color-green);
  transform: translateX(-50%);
}
.dark { color: rgba(243, 241, 236, 0.55); }
.dark .letter.active { color: var(--color-paper); }
.dark .divider, .dark .rule { background: rgba(255,255,255,0.18); }
```

- [ ] **Step 3: Smoke test in the page**

Replace `src/app/[locale]/page.tsx` body with `<main className="page-edge py-16"><div className="flex justify-end"><LangSwitch /></div></main>`, import `LangSwitch`. Run `npm run dev`. Expected: see the FR/EN dimension line, click EN → URL becomes `/en`, the green tick slides right.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: architectural LangSwitch (dimension line + sliding tick)"
```

---

### Task 16: Nav component

**Files:**
- Create: `src/components/shared/Nav.tsx`

- [ ] **Step 1: Implement**

```tsx
"use client";
// src/components/shared/Nav.tsx
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { BrandMark } from "./BrandMark";
import { LangSwitch } from "./LangSwitch";
import { cn } from "@/lib/utils";

export function Nav({ dark = false }: { dark?: boolean }) {
  const locale = useLocale();
  const t = useTranslations("nav");
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links: { id: string; href: string }[] = [
    { id: "architects", href: `/${locale}/architectes` },
    { id: "approach",   href: `/${locale}#approche` },
    { id: "projects",   href: `/${locale}#projets` },
    { id: "journal",    href: `/${locale}#journal` },
    { id: "about",      href: `/${locale}#apropos` },
  ];

  return (
    <header className={cn(
      "fixed inset-x-0 top-0 z-50 px-[var(--edge)] py-[18px] flex items-center justify-between transition-[background,color,border,padding] duration-[360ms] border-b border-transparent",
      scrolled && (dark
        ? "bg-water/70 backdrop-blur-md saturate-[1.05] text-paper border-white/10 py-3"
        : "bg-paper/85 backdrop-blur-md saturate-[1.05] border-[var(--hairline-soft)] py-3"),
      !scrolled && dark && "text-paper"
    )}>
      <Link href={`/${locale}`} aria-label="Reliote"><BrandMark /></Link>
      <nav className="hidden md:flex gap-7 text-[13px]">
        {links.map((l) => (
          <Link key={l.id} href={l.href} className="opacity-80 hover:opacity-100 transition-opacity relative group">
            {t(l.id)}
            <span className="absolute left-0 -bottom-1 h-px w-0 bg-current group-hover:w-full transition-[width] duration-300" />
          </Link>
        ))}
      </nav>
      <div className="flex items-center gap-3.5">
        <LangSwitch dark={dark && !scrolled} />
        <Link href={`/${locale}/projets/initier`} className="inline-flex items-center gap-2.5 px-5 py-3 bg-green text-paper text-[13px] font-medium hover:bg-green-deep transition-colors">
          {t("cta")}
          <span className="inline-block w-[9px] h-[9px] border-r border-t border-current rotate-45" />
        </Link>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/shared/Nav.tsx && git commit -m "feat: Nav with scroll-frosted state, dark variant, lang switch"
```

---

### Task 17: Footer

**Files:**
- Create: `src/components/landing/Footer.tsx`

- [ ] **Step 1: Implement**

```tsx
// src/components/landing/Footer.tsx
import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { BrandMark } from "@/components/shared/BrandMark";
import { Hairline } from "@/components/shared/Hairline";

export async function Footer() {
  const locale = await getLocale();
  const t = await getTranslations("footer");
  const navT = await getTranslations("nav");
  return (
    <footer className="bg-paper-2 text-ink mt-32">
      <div className="page-edge py-20">
        <div className="grid grid-cols-12 gap-[var(--gutter)] items-start">
          <div className="col-span-12 md:col-span-4">
            <BrandMark />
            <p className="text-sm text-concrete-1 mt-6 max-w-[36ch]">{t("tagline")}</p>
          </div>
          <div className="col-span-6 md:col-span-3">
            <p className="eyebrow mb-4">{t("explore")}</p>
            <ul className="space-y-2 text-sm">
              <li><Link href={`/${locale}/architectes`}>{navT("architects")}</Link></li>
              <li><Link href={`/${locale}/projets/initier`}>{navT("cta")}</Link></li>
              <li><Link href={`/${locale}/architectes/rejoindre`}>{t("joinAsArchitect")}</Link></li>
            </ul>
          </div>
          <div className="col-span-6 md:col-span-3">
            <p className="eyebrow mb-4">{t("account")}</p>
            <ul className="space-y-2 text-sm">
              <li><Link href={`/${locale}/auth/login`}>{t("login")}</Link></li>
              <li><Link href={`/${locale}/auth/register`}>{t("register")}</Link></li>
            </ul>
          </div>
          <div className="col-span-12 md:col-span-2 mono text-[10px] tracking-[0.18em] uppercase text-concrete-2">
            <p>48°51′24″N — PARIS</p>
            <p>5°20′08″N — ABIDJAN</p>
          </div>
        </div>
        <div className="my-10"><Hairline /></div>
        <div className="flex flex-wrap justify-between text-[11px] mono uppercase tracking-[0.18em] text-concrete-2">
          <span>© {new Date().getFullYear()} Reliote</span>
          <span>{t("colophon")}</span>
        </div>
      </div>
    </footer>
  );
}
```

- [ ] **Step 2: Add the strings to `messages/{fr,en}.json` under `"footer"`**

FR:

```json
"footer": {
  "tagline": "Reliote relie les porteurs de projets en France aux meilleurs architectes de Côte d'Ivoire.",
  "explore": "Explorer", "account": "Compte",
  "joinAsArchitect": "Rejoindre Reliote", "login": "Se connecter", "register": "Créer un compte",
  "colophon": "Plateforme premium — Paris ⇄ Abidjan"
}
```

EN:

```json
"footer": {
  "tagline": "Reliote connects project owners in France with the best architects in Côte d'Ivoire.",
  "explore": "Explore", "account": "Account",
  "joinAsArchitect": "Join Reliote", "login": "Sign in", "register": "Create account",
  "colophon": "Premium platform — Paris ⇄ Abidjan"
}
```

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: Footer with coordinates colophon"
```

---

### Task 18: Auth pages — login, register, forgot, callback

**Files:**
- Create: `src/app/[locale]/auth/login/page.tsx`, `src/app/[locale]/auth/register/page.tsx`, `src/app/[locale]/auth/forgot/page.tsx`, `src/app/[locale]/auth/callback/route.ts`, `src/app/[locale]/auth/actions.ts`

- [ ] **Step 1: Server actions**

```ts
"use server";
// src/app/[locale]/auth/actions.ts
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function signIn(formData: FormData) {
  const supabase = await createClient();
  const email = String(formData.get("email"));
  const password = String(formData.get("password"));
  const locale = String(formData.get("locale") || "fr");
  const next = String(formData.get("next") || `/${locale}`);
  const { error, data } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, error: error.message };
  // Route by role
  const { data: prof } = await supabase.from("profiles").select("role").eq("id", data.user.id).single();
  if (prof?.role === "admin") redirect(`/${locale}/admin`);
  redirect(next.startsWith("/") ? next : `/${locale}`);
}

export async function signUp(formData: FormData) {
  const supabase = await createClient();
  const email = String(formData.get("email"));
  const password = String(formData.get("password"));
  const role = (String(formData.get("role")) === "architect" ? "architect" : "client");
  const full_name = String(formData.get("full_name") || "");
  const locale = String(formData.get("locale") || "fr");
  const { error } = await supabase.auth.signUp({
    email, password,
    options: { data: { role, full_name, locale }, emailRedirectTo: `${process.env.SITE_URL}/${locale}/auth/callback` },
  });
  if (error) return { ok: false, error: error.message };
  if (role === "architect") redirect(`/${locale}/architectes/rejoindre`);
  redirect(`/${locale}/projets/initier`);
}

export async function signOut(locale: string) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(`/${locale}`);
}

export async function forgot(formData: FormData) {
  const supabase = await createClient();
  const email = String(formData.get("email"));
  const locale = String(formData.get("locale") || "fr");
  await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${process.env.SITE_URL}/${locale}/auth/callback?type=recovery` });
  return { ok: true };
}
```

- [ ] **Step 2: Login page**

```tsx
// src/app/[locale]/auth/login/page.tsx
import { signIn } from "../actions";
import { getTranslations, getLocale } from "next-intl/server";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const locale = await getLocale();
  const t = await getTranslations("auth");
  const { next } = await searchParams;
  return (
    <main className="page-edge py-32 max-w-[480px] mx-auto">
      <p className="eyebrow">{t("loginEyebrow")}</p>
      <h1 className="font-light text-5xl mt-4 leading-tight">{t("loginTitle")}</h1>
      <form action={signIn} className="mt-10 space-y-4">
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="next" value={next || ""} />
        <label className="block">
          <span className="eyebrow">{t("email")}</span>
          <input name="email" type="email" required className="w-full mt-1 bg-transparent border-b border-[var(--hairline)] py-2 outline-none focus:border-green" />
        </label>
        <label className="block">
          <span className="eyebrow">{t("password")}</span>
          <input name="password" type="password" required className="w-full mt-1 bg-transparent border-b border-[var(--hairline)] py-2 outline-none focus:border-green" />
        </label>
        <button className="mt-6 inline-flex items-center gap-2 px-5 py-3 bg-green text-paper text-sm">{t("signIn")}</button>
      </form>
      <p className="mt-8 text-sm text-concrete-1"><a href={`/${locale}/auth/register`}>{t("noAccount")}</a> · <a href={`/${locale}/auth/forgot`}>{t("forgot")}</a></p>
    </main>
  );
}
```

- [ ] **Step 3: Register page**

```tsx
// src/app/[locale]/auth/register/page.tsx
import { signUp } from "../actions";
import { getTranslations, getLocale } from "next-intl/server";

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ role?: string }> }) {
  const locale = await getLocale();
  const t = await getTranslations("auth");
  const { role: roleParam } = await searchParams;
  const role = roleParam === "architect" ? "architect" : "client";
  return (
    <main className="page-edge py-32 max-w-[520px] mx-auto">
      <p className="eyebrow">{t("registerEyebrow")}</p>
      <h1 className="font-light text-5xl mt-4 leading-tight">{role === "architect" ? t("registerArchitectTitle") : t("registerClientTitle")}</h1>
      <form action={signUp} className="mt-10 space-y-4">
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="role"   value={role} />
        <label className="block"><span className="eyebrow">{t("fullName")}</span><input name="full_name" required className="w-full mt-1 bg-transparent border-b border-[var(--hairline)] py-2 outline-none focus:border-green" /></label>
        <label className="block"><span className="eyebrow">{t("email")}</span><input name="email" type="email" required className="w-full mt-1 bg-transparent border-b border-[var(--hairline)] py-2 outline-none focus:border-green" /></label>
        <label className="block"><span className="eyebrow">{t("password")}</span><input name="password" type="password" minLength={8} required className="w-full mt-1 bg-transparent border-b border-[var(--hairline)] py-2 outline-none focus:border-green" /></label>
        <button className="mt-6 inline-flex items-center gap-2 px-5 py-3 bg-green text-paper text-sm">{t("createAccount")}</button>
      </form>
    </main>
  );
}
```

- [ ] **Step 4: Forgot page**

```tsx
// src/app/[locale]/auth/forgot/page.tsx
import { forgot } from "../actions";
import { getTranslations, getLocale } from "next-intl/server";

export default async function ForgotPage() {
  const locale = await getLocale();
  const t = await getTranslations("auth");
  return (
    <main className="page-edge py-32 max-w-[480px] mx-auto">
      <p className="eyebrow">{t("forgotEyebrow")}</p>
      <h1 className="font-light text-5xl mt-4">{t("forgotTitle")}</h1>
      <p className="mt-4 text-concrete-1">{t("forgotHint")}</p>
      <form action={forgot} className="mt-8 space-y-4">
        <input type="hidden" name="locale" value={locale} />
        <label className="block"><span className="eyebrow">{t("email")}</span><input name="email" type="email" required className="w-full mt-1 bg-transparent border-b border-[var(--hairline)] py-2 outline-none focus:border-green" /></label>
        <button className="mt-6 inline-flex items-center gap-2 px-5 py-3 bg-green text-paper text-sm">{t("sendLink")}</button>
      </form>
    </main>
  );
}
```

- [ ] **Step 5: Callback route**

```ts
// src/app/[locale]/auth/callback/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }
  return NextResponse.redirect(new URL(`/${locale}`, request.url));
}
```

- [ ] **Step 6: Add `auth` namespace to `messages/{fr,en}.json`**

FR:

```json
"auth": {
  "loginEyebrow": "Espace Reliote", "loginTitle": "Se connecter.",
  "registerEyebrow": "Rejoindre Reliote",
  "registerClientTitle": "Créer mon espace client.", "registerArchitectTitle": "Rejoindre comme architecte.",
  "forgotEyebrow": "Réinitialiser", "forgotTitle": "Mot de passe oublié.", "forgotHint": "Un lien sécurisé vous sera envoyé par e-mail.",
  "email": "E-mail", "password": "Mot de passe", "fullName": "Nom complet",
  "signIn": "Se connecter", "createAccount": "Créer le compte", "sendLink": "Envoyer le lien",
  "noAccount": "Pas encore de compte ?", "forgot": "Mot de passe oublié ?"
}
```

EN: same keys translated.

- [ ] **Step 7: Test the auth round-trip**

Run `npm run dev`. Go to `/fr/auth/login`, log in with `admin@reliote.test / ReliotePass2026!`. Expected: redirected to `/fr/admin` (which doesn't exist yet → 404, that's OK). Visit `/fr/auth/register?role=architect`, create a test account → redirected to `/fr/architectes/rejoindre` (404 for now, OK). Stop.

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "feat(auth): login, register, forgot, callback, role-aware redirect"
```

---

# Phase 2 — Landing page sections

For all of Phase 2, **read** the corresponding section in `_design-reference/reliote/project/index.html` (search for the section eyebrow text, e.g. "01 — Plateforme") and `_design-reference/reliote/project/sections-v2.jsx`. Copy structure values (paddings, column spans, type sizes) and use the string keys from `messages/`.

Copy the design assets:

```bash
mkdir -p public/assets
cp _design-reference/reliote/project/assets/* public/assets/
```

Commit: `git add public/assets && git commit -m "chore: import locked design photo assets"`.

---

### Task 19: Hero

**Files:**
- Create: `src/components/landing/Hero.tsx`

- [ ] **Step 1: Implement**

```tsx
// src/components/landing/Hero.tsx
import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { Eyebrow } from "@/components/shared/Eyebrow";

export async function Hero() {
  const locale = await getLocale();
  const t = await getTranslations("hero");
  return (
    <section id="top" className="relative min-h-screen bg-water text-paper overflow-hidden">
      <div className="absolute inset-0 bg-[url('/assets/img-courtyard-pool.jpg')] bg-cover bg-[center_30%] brightness-[0.62] contrast-[1.05] saturate-[0.7] scale-[1.04]" />
      <div className="absolute inset-0 bg-gradient-to-b from-water/55 via-water/20 to-water" />
      <div className="absolute inset-0 [background-image:radial-gradient(rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:3px_3px] mix-blend-overlay opacity-60 pointer-events-none" />
      <div className="absolute top-[120px] left-[var(--edge)] mono text-[10px] tracking-[0.18em] uppercase text-paper/60">48°51′24″N — Paris</div>
      <div className="absolute bottom-[120px] right-[var(--edge)] mono text-[10px] tracking-[0.18em] uppercase text-paper/60">5°20′08″N — Abidjan</div>
      <div className="relative z-10 min-h-screen flex flex-col pt-[120px] pb-8 page-edge">
        <Eyebrow className="text-paper/70">{t("eyebrow")}</Eyebrow>
        <h1 className="font-light text-[clamp(48px,7.5vw,116px)] leading-[0.96] tracking-[-0.025em] mt-8 text-balance">
          {t("titlePre")}<em className="serif-i tracking-[-0.005em]">{t("titleItalic")}</em><br />
          {t("titleRest")}
        </h1>
        <p className="text-[15px] leading-[1.55] text-paper/80 max-w-[38ch] mt-7 mb-9">{t("sub")}</p>
        <div className="flex gap-4 flex-wrap">
          <Link href={`/${locale}/projets/initier`} className="inline-flex items-center gap-2.5 px-5 py-3 bg-green text-paper text-[13px] hover:bg-green-deep transition-colors">{t("primary")}<span className="inline-block w-[9px] h-[9px] border-r border-t border-current rotate-45" /></Link>
          <Link href={`/${locale}/architectes`} className="inline-flex items-center gap-2.5 px-5 py-3 border border-current text-paper/90 text-[13px] hover:bg-white/5 transition-colors">{t("secondary")}</Link>
        </div>
        <div className="mt-auto flex items-center gap-8 mono text-[11px] tracking-[0.16em] uppercase text-paper/70">
          <span><span className="inline-block w-1.5 h-1.5 rounded-full bg-brass align-middle mr-2 animate-pulse" />{t("liveLabel")}</span>
          <span>{t("liveName")}</span>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Mount on landing**

Open `src/app/[locale]/page.tsx`:

```tsx
import { Hero } from "@/components/landing/Hero";
import { Nav } from "@/components/shared/Nav";
import { Footer } from "@/components/landing/Footer";
export default function Page() {
  return (<>
    <Nav dark />
    <Hero />
    <Footer />
  </>);
}
```

Run `npm run dev`, check `/fr` — hero photo, headline with italic accent. Stop.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat(landing): Hero with darkened pool photo, italic accent headline"
```

---

### Task 20: StatsBar

**Files:** Create `src/components/landing/StatsBar.tsx`

- [ ] **Step 1: Implement**

```tsx
import { getTranslations } from "next-intl/server";
import { Hairline } from "@/components/shared/Hairline";

export async function StatsBar() {
  const t = await getTranslations("stats");
  const items = ["a","b","c","d"].map((k) => ({ num: t(`${k}.num`), label: t(`${k}.label`) }));
  return (
    <section className="bg-paper">
      <div className="page-edge py-16 grid grid-cols-2 md:grid-cols-4 gap-y-10">
        {items.map((it, i) => (
          <div key={i} className="flex flex-col gap-2">
            <span className="font-display text-[56px] leading-none text-ink">{it.num}</span>
            <span className="eyebrow">{it.label}</span>
          </div>
        ))}
      </div>
      <div className="page-edge"><Hairline /></div>
    </section>
  );
}
```

- [ ] **Step 2: Strings** — add to `stats` namespace (FR/EN). Keys `a,b,c,d` each with `num` + `label`. Copy values from `data.jsx`.

- [ ] **Step 3: Mount + commit**

Add `<StatsBar />` after `<Hero />` in the landing page. `git add -A && git commit -m "feat(landing): StatsBar"`.

---

### Task 21: Pillars (interactive expanding panels)

**Files:** Create `src/components/landing/Pillars.tsx`

- [ ] **Step 1: Implement (as `"use client"` for hover state)**

```tsx
"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Eyebrow } from "@/components/shared/Eyebrow";

const KEYS = ["p1","p2","p3","p4","p5"] as const;

export function Pillars() {
  const t = useTranslations("pillars");
  const [active, setActive] = useState(0);
  return (
    <section id="approche" className="bg-paper">
      <div className="page-edge py-32">
        <Eyebrow>02 — {t("eyebrow")}</Eyebrow>
        <h2 className="font-light text-[clamp(36px,5vw,72px)] leading-[1.05] tracking-[-0.02em] mt-6 max-w-[24ch]">
          {t("titlePre")}<em className="serif-i">{t("titleItalic")}</em>
        </h2>
        <p className="text-concrete-1 max-w-[60ch] mt-6">{t("kicker")}</p>
        <div className="mt-16 grid grid-cols-1 md:grid-cols-5 min-h-[420px] border-t border-[var(--hairline)]" onMouseLeave={() => setActive(0)}>
          {KEYS.map((k, i) => {
            const isActive = i === active;
            return (
              <div
                key={k}
                onMouseEnter={() => setActive(i)}
                className={`relative border-b md:border-b-0 md:border-r border-[var(--hairline)] p-8 transition-[flex] duration-[360ms] ease-[cubic-bezier(0.32,0.72,0,1)] ${isActive ? "md:flex-[2] bg-water text-paper" : "md:flex-[1]"}`}
                style={{ display: "flex", flexDirection: "column" }}
              >
                <span className={`mono text-[11px] tracking-[0.18em] uppercase ${isActive ? "text-paper/70" : "text-concrete-2"}`}>{t(`${k}.n`)}</span>
                <h3 className="font-display text-3xl mt-4">{t(`${k}.t`)}</h3>
                <p className={`mt-3 text-sm leading-relaxed ${isActive ? "text-paper/80" : "text-concrete-1"}`}>{t(`${k}.b`)}</p>
                {isActive && (
                  <div className="mt-auto pt-8">
                    <span className="font-display text-5xl text-brass">{t(`${k}.statNum`)}<span className="text-2xl text-paper/60">{t(`${k}.statDenom`)}</span></span>
                    <p className="eyebrow text-paper/60 mt-2">{t(`${k}.statLabel`)}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Strings** — `pillars` namespace with `eyebrow`, `titlePre`, `titleItalic`, `kicker`, then `p1..p5` each with `n,t,b,statNum,statDenom,statLabel`. Copy from `data.jsx` (`pillarsHead`, `pillars`, `pillarStats`).

- [ ] **Step 3: Mount + commit**

Mount after `<StatsBar />`. Commit.

---

### Task 22: ArchitectIndex + ArchitectCard + ArchitectDrawer

**Files:** `src/components/landing/ArchitectIndex.tsx`, `src/components/landing/ArchitectCard.tsx`, `src/components/landing/ArchitectDrawer.tsx`

- [ ] **Step 1: Server fetch + client filter wrapper**

```tsx
// src/components/landing/ArchitectIndex.tsx
import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { Eyebrow } from "@/components/shared/Eyebrow";
import { ArchitectGrid } from "./ArchitectGrid";

export async function ArchitectIndex() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("architect_profiles")
    .select("id, full_name, city, specialties, project_types, years_experience, photo_url, rating, availability, fee_from, languages, description")
    .eq("status", "verified")
    .order("rating", { ascending: false })
    .limit(12);
  const t = await getTranslations("architects");
  return (
    <section id="architectes" className="bg-paper">
      <div className="page-edge py-32">
        <Eyebrow>03 — {t("eyebrow")}</Eyebrow>
        <h2 className="font-light text-[clamp(36px,5vw,72px)] leading-[1.05] tracking-[-0.02em] mt-6 max-w-[24ch]">
          {t("titlePre")}<em className="serif-i">{t("titleItalic")}</em>
        </h2>
        <p className="text-concrete-1 max-w-[60ch] mt-6">{t("kicker")}</p>
        <ArchitectGrid architects={data ?? []} />
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Client grid with filters + drawer**

```tsx
"use client";
// src/components/landing/ArchitectGrid.tsx
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ArchitectCard } from "./ArchitectCard";
import { ArchitectDrawer } from "./ArchitectDrawer";

type A = { id: string; full_name: string; city: string; specialties: string[]; project_types: string[]; years_experience: number; photo_url: string|null; rating: number|null; availability: string; fee_from: string|null; languages: string[]; description: string };

export function ArchitectGrid({ architects }: { architects: A[] }) {
  const t = useTranslations("architects");
  const [filter, setFilter] = useState("all");
  const [open, setOpen] = useState<A | null>(null);
  const FILTERS = ["all","Résidentiel","Hospitalité","Commercial","Urbain","Culturel"];
  const filtered = useMemo(() => filter === "all" ? architects : architects.filter(a => a.specialties.includes(filter)), [filter, architects]);
  return (
    <>
      <div className="mt-10 flex flex-wrap gap-1 border-b border-[var(--hairline)] pb-4">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-1.5 text-[12px] mono tracking-[0.1em] uppercase rounded-full transition-colors ${filter===f ? "bg-ink text-paper" : "text-concrete-1 hover:text-ink"}`}>{f==="all" ? t("filterAll") : f}</button>
        ))}
        <span className="ml-auto eyebrow self-center">{filtered.length} {t("count")}</span>
      </div>
      <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-[var(--gutter)]">
        {filtered.map(a => <ArchitectCard key={a.id} a={a} onOpen={() => setOpen(a)} />)}
      </div>
      <ArchitectDrawer architect={open} onClose={() => setOpen(null)} />
    </>
  );
}
```

- [ ] **Step 3: ArchitectCard**

```tsx
// src/components/landing/ArchitectCard.tsx
import Image from "next/image";

export function ArchitectCard({ a, onOpen }: { a: any; onOpen: () => void }) {
  return (
    <button onClick={onOpen} className="text-left group">
      <div className="relative aspect-[4/5] overflow-hidden bg-paper-2">
        {a.photo_url && <Image src={a.photo_url} alt={a.full_name} fill className="object-cover transition-transform duration-[600ms] group-hover:scale-[1.04]" sizes="(min-width: 768px) 25vw, 50vw" />}
        <span className="absolute top-3 left-3 mono text-[10px] tracking-[0.18em] uppercase text-paper/90 bg-water/40 px-2 py-1">{a.years_experience} ans</span>
        <span className={`absolute top-3 right-3 inline-flex items-center gap-1.5 mono text-[10px] tracking-[0.18em] uppercase ${a.availability==="available" ? "text-paper" : "text-paper/70"} bg-water/40 px-2 py-1`}>
          <span className={`inline-block w-1.5 h-1.5 rounded-full ${a.availability==="available" ? "bg-brass animate-pulse" : "bg-concrete-3"}`} />{a.availability==="available" ? "Disponible" : "Complet"}
        </span>
      </div>
      <div className="mt-3 flex justify-between items-baseline">
        <h4 className="font-medium text-[15px]">{a.full_name}</h4>
        <span className="mono text-[12px]">{a.rating?.toFixed(1)}★</span>
      </div>
      <p className="eyebrow mt-1">{a.city}</p>
      <p className="mt-2 text-[12px] text-concrete-1">{a.specialties.join(" · ")}</p>
    </button>
  );
}
```

- [ ] **Step 4: ArchitectDrawer**

```tsx
"use client";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";

export function ArchitectDrawer({ architect, onClose }: { architect: any | null; onClose: () => void }) {
  return (
    <AnimatePresence>
      {architect && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-[60] bg-water/60" />
          <motion.aside
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "tween", ease: [0.32, 0.72, 0, 1], duration: 0.5 }}
            className="fixed top-0 right-0 z-[70] h-full w-full md:w-[640px] bg-paper text-ink overflow-y-auto"
          >
            <button onClick={onClose} className="absolute top-5 right-5 mono text-[11px] tracking-[0.18em] uppercase">Fermer ✕</button>
            <div className="page-edge py-16">
              <p className="eyebrow">{architect.city}</p>
              <h3 className="font-light text-5xl mt-2 leading-tight">{architect.full_name}</h3>
              <p className="mt-3 text-concrete-1">{architect.specialties.join(" · ")}</p>
              {architect.photo_url && <div className="mt-8 relative aspect-[4/3]"><Image src={architect.photo_url} alt={architect.full_name} fill className="object-cover" sizes="640px" /></div>}
              <p className="mt-8">{architect.description}</p>
              <dl className="mt-8 grid grid-cols-2 gap-4 text-sm">
                <div><dt className="eyebrow">Expérience</dt><dd>{architect.years_experience} ans</dd></div>
                <div><dt className="eyebrow">Note</dt><dd>{architect.rating?.toFixed(1)}★</dd></div>
                <div><dt className="eyebrow">Langues</dt><dd>{architect.languages.join(", ")}</dd></div>
                <div><dt className="eyebrow">Honoraires</dt><dd>{architect.fee_from ?? "—"}</dd></div>
              </dl>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 5: Strings** — `architects` namespace with `eyebrow,titlePre,titleItalic,kicker,filterAll,count`.

- [ ] **Step 6: Mount + commit** — `<ArchitectIndex />` after `<Pillars />`. `git add -A && git commit -m "feat(landing): ArchitectIndex with live DB data, filters, drawer"`.

---

### Task 23: Process timeline (animated)

**Files:** Create `src/components/landing/Process.tsx`

- [ ] **Step 1: Implement (client; auto-advance)**

```tsx
"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Eyebrow } from "@/components/shared/Eyebrow";

const STEPS = ["s1","s2","s3","s4"] as const;

export function Process() {
  const t = useTranslations("process");
  const [active, setActive] = useState(0);
  useEffect(() => { const id = setInterval(() => setActive(a => (a+1) % STEPS.length), 4000); return () => clearInterval(id); }, []);
  return (
    <section id="processus" className="bg-paper">
      <div className="page-edge py-32">
        <Eyebrow>04 — {t("eyebrow")}</Eyebrow>
        <h2 className="font-light text-[clamp(36px,5vw,72px)] leading-[1.05] tracking-[-0.02em] mt-6 max-w-[24ch]">{t("titlePre")}<em className="serif-i">{t("titleItalic")}</em></h2>
        <p className="text-concrete-1 max-w-[60ch] mt-6">{t("kicker")}</p>
        <div className="relative mt-16">
          <div className="absolute left-0 right-0 top-[44px] h-px bg-[var(--hairline)]" />
          <div className="absolute left-0 top-[44px] h-px bg-green transition-[width] duration-[800ms]" style={{ width: `${((active+1)/STEPS.length)*100}%` }} />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-[var(--gutter)]">
            {STEPS.map((k, i) => {
              const isActive = i === active;
              return (
                <button key={k} onClick={() => setActive(i)} className={`text-left pt-12 relative ${isActive ? "" : "opacity-70"}`}>
                  <span className={`absolute -top-1 left-0 inline-block w-3 h-3 rounded-full ${isActive ? "bg-brass animate-pulse" : "bg-concrete-3"}`} />
                  <span className="eyebrow">{t(`${k}.n`)} · {t(`${k}.days`)}</span>
                  <h3 className="font-display text-3xl mt-2">{t(`${k}.t`)}</h3>
                  <p className="serif-i text-concrete-1 mt-3">{t(`${k}.verb`)}</p>
                  <p className="mt-4 text-sm text-concrete-1">{t(`${k}.b`)}</p>
                  <ul className="mt-5 space-y-1.5 text-[12px] mono text-concrete-2">
                    {(t.raw(`${k}.deliverables`) as string[]).map(d => <li key={d}>· {d}</li>)}
                  </ul>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Strings** — `process` ns with `eyebrow,titlePre,titleItalic,kicker` and `s1..s4` each with `n,t,days,verb,b,deliverables` (array). Copy from `data.jsx`.

- [ ] **Step 3: Mount + commit.**

---

### Task 24: FeaturedCase (carousel + hotspots + counters)

**Files:** Create `src/components/landing/FeaturedCase.tsx`

- [ ] **Step 1: Implement (client)**

```tsx
"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Eyebrow } from "@/components/shared/Eyebrow";

const IMGS = ["/assets/img-courtyard-pool.jpg", "/assets/img-redrock-pool.jpg", "/assets/img-museum-mist.jpg"];

function useCounter(target: number, run: boolean) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!run) return;
    let raf = 0; const t0 = performance.now(); const d = 1400;
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / d);
      const e = 1 - Math.pow(1 - p, 3);
      setV(Math.round(target * e));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [run, target]);
  return v;
}

export function FeaturedCase() {
  const t = useTranslations("featured");
  const [idx, setIdx] = useState(0);
  const [run, setRun] = useState(false);
  const ref = useRef<HTMLElement|null>(null);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setRun(true), { threshold: 0.4 });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  useEffect(() => { const id = setInterval(() => setIdx(i => (i+1) % IMGS.length), 6000); return () => clearInterval(id); }, []);

  const stats = [
    { n: 480, suf: " m²", l: t("stats.area") },
    { n: 18,  suf: " mois", l: t("stats.duration") },
    { n: 23,  suf: "",      l: t("stats.craftsmen") },
    { n: 100, suf: "%",     l: t("stats.milestones") },
  ];
  const hotspots = [
    { x: 28, y: 38, k: "h1" },
    { x: 68, y: 30, k: "h2" },
    { x: 42, y: 72, k: "h3" },
  ];

  return (
    <section id="projets" ref={ref} className="bg-water text-paper">
      <div className="page-edge py-32">
        <Eyebrow className="text-paper/70">05 — {t("eyebrow")}</Eyebrow>
        <h2 className="font-light text-[clamp(36px,5vw,72px)] leading-[1.05] tracking-[-0.02em] mt-6 max-w-[24ch]">{t("titlePre")}<em className="serif-i">{t("titleItalic")}</em></h2>
        <p className="text-paper/70 max-w-[60ch] mt-6">{t("kicker")}</p>
        <div className="mt-16 grid grid-cols-12 gap-[var(--gutter)]">
          <div className="col-span-12 md:col-span-8 relative aspect-[16/10] overflow-hidden">
            {IMGS.map((src, i) => (
              <Image key={src} src={src} alt="" fill className={`object-cover transition-opacity duration-[800ms] ${i===idx?"opacity-100":"opacity-0"}`} sizes="800px" />
            ))}
            {idx === 0 && hotspots.map(h => (
              <span key={h.k} className="absolute group" style={{ left: `${h.x}%`, top: `${h.y}%` }}>
                <span className="block w-3 h-3 rounded-full bg-brass ring-4 ring-brass/30 animate-pulse" />
                <span className="absolute left-5 top-1 whitespace-nowrap text-[11px] mono uppercase tracking-[0.18em] opacity-0 group-hover:opacity-100 bg-water/80 px-2 py-1 transition-opacity">{t(`hotspots.${h.k}.t`)}</span>
              </span>
            ))}
            <div className="absolute bottom-4 right-4 flex gap-2">
              {IMGS.map((_, i) => <button key={i} onClick={() => setIdx(i)} className={`w-8 h-px ${i===idx ? "bg-paper" : "bg-paper/40"} transition-colors`} />)}
            </div>
          </div>
          <aside className="col-span-12 md:col-span-4 grid grid-cols-2 gap-4">
            {stats.map((s,i) => {
              const v = useCounter(s.n, run);
              return <div key={i} className="border-t border-paper/20 pt-4"><span className="font-display text-5xl">{v}{s.suf}</span><p className="eyebrow text-paper/60 mt-2">{s.l}</p></div>;
            })}
            <div className="col-span-2 mt-6">
              <p className="serif-i text-2xl leading-snug">«{t("quote")}»</p>
              <p className="eyebrow mt-3 text-paper/60">{t("cite")}</p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Strings** — `featured` ns: `eyebrow,titlePre,titleItalic,kicker,quote,cite,stats.{area,duration,craftsmen,milestones},hotspots.{h1,h2,h3}.t`.

- [ ] **Step 3: Mount + commit.**

---

### Task 25: Audiences (2 cards)

**Files:** Create `src/components/landing/Audiences.tsx`

- [ ] **Step 1: Implement (server)**

```tsx
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";

export async function Audiences() {
  const locale = await getLocale();
  const t = await getTranslations("audiences");
  return (
    <section id="apropos" className="bg-paper">
      <div className="page-edge py-32 grid grid-cols-1 md:grid-cols-2 gap-[var(--gutter)]">
        {(["client","architect"] as const).map(k => (
          <article key={k} className="border border-[var(--hairline)] p-10 flex flex-col">
            <p className="eyebrow">{t(`${k}.eyebrow`)}</p>
            <h3 className="font-light text-4xl mt-4 leading-tight">{t(`${k}.title`)}</h3>
            <p className="text-concrete-1 mt-4">{t(`${k}.body`)}</p>
            <Link href={k === "client" ? `/${locale}/projets/initier` : `/${locale}/architectes/rejoindre`} className="mt-auto pt-8 inline-flex items-center gap-2 text-sm">{t(`${k}.cta`)}<span className="inline-block w-[9px] h-[9px] border-r border-t border-current rotate-45" /></Link>
          </article>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Strings + mount + commit.**

---

### Task 26: Journal (3 essay teasers)

**Files:** Create `src/components/landing/Journal.tsx`

- [ ] **Step 1: Implement (static; titles in messages)**

```tsx
import { getTranslations } from "next-intl/server";
import { Eyebrow } from "@/components/shared/Eyebrow";

export async function Journal() {
  const t = await getTranslations("journal");
  const items = ["j1","j2","j3"] as const;
  return (
    <section id="journal" className="bg-paper">
      <div className="page-edge py-32">
        <Eyebrow>07 — {t("eyebrow")}</Eyebrow>
        <h2 className="font-light text-[clamp(36px,5vw,72px)] mt-6">{t("title")}</h2>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-[var(--gutter)] border-t border-[var(--hairline)] pt-8">
          {items.map(k => (
            <article key={k} className="flex flex-col gap-3">
              <span className="eyebrow">{t(`${k}.date`)} · {t(`${k}.read`)}</span>
              <h3 className="font-display text-3xl leading-snug">{t(`${k}.title`)}</h3>
              <p className="text-concrete-1 text-sm">{t(`${k}.excerpt`)}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Strings + mount + commit.**

---

### Task 27: CtaBand

**Files:** Create `src/components/landing/CtaBand.tsx`

- [ ] **Step 1: Implement**

```tsx
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";

export async function CtaBand() {
  const locale = await getLocale();
  const t = await getTranslations("ctaBand");
  return (
    <section className="bg-water text-paper">
      <div className="page-edge py-32 text-center">
        <p className="eyebrow text-paper/60">{t("eyebrow")}</p>
        <h2 className="font-light text-[clamp(40px,6vw,88px)] leading-[1.05] mt-6 max-w-[18ch] mx-auto">{t("titlePre")}<em className="serif-i">{t("titleItalic")}</em></h2>
        <Link href={`/${locale}/projets/initier`} className="mt-10 inline-flex items-center gap-2.5 px-7 py-4 bg-green text-paper text-sm">{t("button")}<span className="inline-block w-[9px] h-[9px] border-r border-t border-current rotate-45" /></Link>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Strings + mount + commit.**

---

### Task 28: Wire the full landing page

**Files:** Modify `src/app/[locale]/page.tsx`

- [ ] **Step 1: Final composition**

```tsx
import { Nav } from "@/components/shared/Nav";
import { Hero } from "@/components/landing/Hero";
import { StatsBar } from "@/components/landing/StatsBar";
import { Pillars } from "@/components/landing/Pillars";
import { ArchitectIndex } from "@/components/landing/ArchitectIndex";
import { Process } from "@/components/landing/Process";
import { FeaturedCase } from "@/components/landing/FeaturedCase";
import { Audiences } from "@/components/landing/Audiences";
import { Journal } from "@/components/landing/Journal";
import { CtaBand } from "@/components/landing/CtaBand";
import { Footer } from "@/components/landing/Footer";

export default function Page() {
  return (<>
    <Nav dark />
    <Hero />
    <StatsBar />
    <Pillars />
    <ArchitectIndex />
    <Process />
    <FeaturedCase />
    <Audiences />
    <Journal />
    <CtaBand />
    <Footer />
  </>);
}
```

- [ ] **Step 2: Manual check**

`npm run dev` → walk `/fr` top to bottom, then `/en`. Confirm: scroll-frosted nav, hero pool image, stats render, pillars expand on hover, architect cards from real DB (8 cards), filters work, drawer opens, process auto-advances, featured carousel rotates, counters animate, CTA band dark, footer with coordinates. Stop.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat(landing): wire all sections into the locale page"
```

---

# Phase 3 — Architect onboarding wizard

### Task 29: Zod schema + types for architect profile

**Files:** Create `src/lib/validation/architect.schema.ts`

- [ ] **Step 1: Schema**

```ts
import { z } from "zod";

export const SPECIALTIES = ["Résidentiel","Hospitalité","Commercial","Urbain","Culturel"] as const;
export const PROJECT_TYPES = ["residential","hospitality","commercial","urban","cultural","other"] as const;

export const architectSchema = z.object({
  full_name: z.string().min(2, "Nom requis"),
  email: z.string().email(),
  phone: z.string().optional(),
  photo_url: z.string().url().optional().or(z.literal("")),
  country: z.string().default("Côte d'Ivoire"),
  city: z.string().min(2),
  specialties: z.array(z.enum(SPECIALTIES)).min(1, "Au moins 1 spécialité"),
  languages: z.array(z.string()).min(1),
  project_types: z.array(z.enum(PROJECT_TYPES)).min(1),
  years_experience: z.coerce.number().min(0).max(70),
  description: z.string().min(80, "≥ 80 caractères"),
  portfolio_url: z.string().url().optional().or(z.literal("")),
  availability: z.enum(["available","busy","unavailable"]),
  fee_from: z.string().optional(),
  terms: z.literal(true, { errorMap: () => ({ message: "Vous devez accepter les conditions." }) }),
});

export type ArchitectInput = z.infer<typeof architectSchema>;
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/validation && git commit -m "feat(validation): architect zod schema"
```

---

### Task 30: ArchitectWizard shell (6 steps with cross-fade)

**Files:** `src/components/forms/ArchitectWizard.tsx`, `src/components/forms/WizardShell.tsx`, `src/components/forms/steps/Architect{1..6}.tsx`

- [ ] **Step 1: WizardShell (reusable for both wizards)**

```tsx
"use client";
import { AnimatePresence, motion } from "framer-motion";
import { ReactNode } from "react";

export function WizardShell({ step, totalSteps, eyebrow, title, children, onBack, onNext, nextLabel, backLabel, submitting }: {
  step: number; totalSteps: number; eyebrow: string; title: ReactNode; children: ReactNode;
  onBack?: () => void; onNext?: () => void; nextLabel: string; backLabel: string; submitting?: boolean;
}) {
  return (
    <section className="page-edge py-32">
      <div className="max-w-[720px] mx-auto">
        <div className="flex items-center justify-between">
          <span className="eyebrow">{eyebrow}</span>
          <span className="mono text-[11px] tracking-[0.18em] uppercase text-concrete-2">{String(step).padStart(2,"0")} / {String(totalSteps).padStart(2,"0")}</span>
        </div>
        <div className="relative h-px bg-[var(--hairline)] mt-3"><span className="absolute left-0 top-0 h-px bg-green transition-[width] duration-[400ms]" style={{ width: `${(step/totalSteps)*100}%` }} /></div>
        <h1 className="font-light text-[clamp(32px,4vw,56px)] leading-[1.05] mt-10">{title}</h1>
        <div className="mt-10">
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.28 }}>
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="mt-12 flex justify-between">
          <button type="button" onClick={onBack} disabled={!onBack} className="text-sm mono tracking-[0.18em] uppercase opacity-70 disabled:opacity-30">← {backLabel}</button>
          <button type="button" onClick={onNext} disabled={submitting} className="px-6 py-3 bg-green text-paper text-sm inline-flex items-center gap-2 disabled:opacity-60">{submitting ? "…" : nextLabel}<span className="inline-block w-[9px] h-[9px] border-r border-t border-current rotate-45" /></button>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: ArchitectWizard orchestrator**

```tsx
"use client";
import { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { architectSchema, type ArchitectInput } from "@/lib/validation/architect.schema";
import { useTranslations } from "next-intl";
import { WizardShell } from "./WizardShell";
import Step1 from "./steps/Architect1";
import Step2 from "./steps/Architect2";
import Step3 from "./steps/Architect3";
import Step4 from "./steps/Architect4";
import Step5 from "./steps/Architect5";
import Step6 from "./steps/Architect6";
import { submitArchitect } from "@/app/[locale]/architectes/rejoindre/actions";

const STEP_FIELDS: (keyof ArchitectInput)[][] = [
  ["full_name","email","phone","photo_url"],
  ["country","city"],
  ["specialties","languages","project_types"],
  ["years_experience","description","portfolio_url"],
  ["availability","fee_from"],
  ["terms"],
];

export function ArchitectWizard({ defaultEmail, defaultName }: { defaultEmail?: string; defaultName?: string }) {
  const t = useTranslations("wizardArchitect");
  const [step, setStep] = useState(1);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const form = useForm<ArchitectInput>({
    resolver: zodResolver(architectSchema),
    mode: "onTouched",
    defaultValues: { full_name: defaultName ?? "", email: defaultEmail ?? "", country: "Côte d'Ivoire", specialties: [], languages: ["FR"], project_types: [], availability: "available" } as any,
  });

  async function next() {
    const valid = await form.trigger(STEP_FIELDS[step - 1] as any);
    if (!valid) return;
    if (step < 6) return setStep(step + 1);
    setSubmitting(true);
    const res = await submitArchitect(form.getValues());
    setSubmitting(false);
    if ((res as any)?.error) setServerError((res as any).error);
  }

  const STEPS = [Step1, Step2, Step3, Step4, Step5, Step6];
  const Current = STEPS[step - 1];
  const title = step === 6 ? t("titles.6") : t(`titles.${step}`);

  return (
    <FormProvider {...form}>
      <WizardShell step={step} totalSteps={6} eyebrow={t("eyebrow")} title={<>{title}</>}
        onBack={step > 1 ? () => setStep(step - 1) : undefined}
        onNext={next}
        nextLabel={step === 6 ? t("submit") : t("next")}
        backLabel={t("back")}
        submitting={submitting}>
        <Current />
        {serverError && <p className="mt-4 text-sm text-red-700">{serverError}</p>}
      </WizardShell>
    </FormProvider>
  );
}
```

- [ ] **Step 3: Steps 1-6**

Each step file is a focused fragment using `useFormContext`. Example for `steps/Architect1.tsx`:

```tsx
"use client";
import { useFormContext } from "react-hook-form";
import { useTranslations } from "next-intl";

export default function Architect1() {
  const { register, formState: { errors } } = useFormContext();
  const t = useTranslations("wizardArchitect");
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <label className="block md:col-span-2"><span className="eyebrow">{t("fields.full_name")}</span>
        <input {...register("full_name")} className="w-full mt-1 bg-transparent border-b border-[var(--hairline)] py-2 outline-none focus:border-green" />
        {errors.full_name && <span className="text-xs text-red-700">{String(errors.full_name.message)}</span>}
      </label>
      <label className="block"><span className="eyebrow">{t("fields.email")}</span>
        <input type="email" {...register("email")} className="w-full mt-1 bg-transparent border-b border-[var(--hairline)] py-2 outline-none focus:border-green" />
        {errors.email && <span className="text-xs text-red-700">{String(errors.email.message)}</span>}
      </label>
      <label className="block"><span className="eyebrow">{t("fields.phone")}</span>
        <input {...register("phone")} className="w-full mt-1 bg-transparent border-b border-[var(--hairline)] py-2 outline-none focus:border-green" />
      </label>
      <label className="block md:col-span-2"><span className="eyebrow">{t("fields.photo_url")}</span>
        <input {...register("photo_url")} placeholder="https://…" className="w-full mt-1 bg-transparent border-b border-[var(--hairline)] py-2 outline-none focus:border-green" />
      </label>
    </div>
  );
}
```

Write `Architect2.tsx` (country + city), `Architect3.tsx` (specialties checkbox grid + languages + project_types — use a `Checkboxes` helper component below), `Architect4.tsx` (years_experience number + description textarea + portfolio_url), `Architect5.tsx` (availability radio + fee_from), `Architect6.tsx` (read-only recap of all fields + `terms` checkbox).

Helper `src/components/forms/Checkboxes.tsx`:

```tsx
"use client";
import { useFormContext, useWatch } from "react-hook-form";

export function Checkboxes({ name, options }: { name: string; options: readonly string[] }) {
  const { register } = useFormContext();
  const value = useWatch({ name }) as string[] | undefined;
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {options.map(o => (
        <label key={o} className={`px-3 py-1.5 border text-sm cursor-pointer transition-colors ${value?.includes(o) ? "bg-ink text-paper border-ink" : "border-[var(--hairline)] text-concrete-1 hover:text-ink"}`}>
          <input type="checkbox" value={o} {...register(name)} className="sr-only" />
          {o}
        </label>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/forms && git commit -m "feat(forms): ArchitectWizard shell + 6 steps + Checkboxes helper"
```

---

### Task 31: Architect onboarding route + server action + confirmation

**Files:** `src/app/[locale]/architectes/rejoindre/page.tsx`, `src/app/[locale]/architectes/rejoindre/actions.ts`, `src/app/[locale]/architectes/rejoindre/merci/page.tsx`

- [ ] **Step 1: Server action**

```ts
"use server";
import { createClient } from "@/lib/supabase/server";
import { architectSchema } from "@/lib/validation/architect.schema";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

export async function submitArchitect(input: unknown) {
  const parsed = architectSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Validation error" };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const { terms, ...row } = parsed.data;
  const { error } = await supabase.from("architect_profiles").insert({ ...row, user_id: user.id, email: row.email });
  if (error) return { error: error.message };
  revalidatePath("/architectes");
  const locale = (await cookies()).get("NEXT_LOCALE")?.value || "fr";
  redirect(`/${locale}/architectes/rejoindre/merci`);
}
```

- [ ] **Step 2: Page**

```tsx
// src/app/[locale]/architectes/rejoindre/page.tsx
import { Nav } from "@/components/shared/Nav";
import { Footer } from "@/components/landing/Footer";
import { ArchitectWizard } from "@/components/forms/ArchitectWizard";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";

export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const locale = await getLocale();
  if (!user) redirect(`/${locale}/auth/register?role=architect`);
  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();
  return (<>
    <Nav />
    <ArchitectWizard defaultEmail={user.email ?? ""} defaultName={profile?.full_name ?? ""} />
    <Footer />
  </>);
}
```

- [ ] **Step 3: Confirmation page**

```tsx
// src/app/[locale]/architectes/rejoindre/merci/page.tsx
import { getTranslations, getLocale } from "next-intl/server";
import Link from "next/link";
import { Nav } from "@/components/shared/Nav";
import { Footer } from "@/components/landing/Footer";

export default async function Page() {
  const locale = await getLocale();
  const t = await getTranslations("wizardArchitect");
  return (<>
    <Nav />
    <section className="page-edge py-32 max-w-[640px] mx-auto">
      <p className="eyebrow">{t("thanks.eyebrow")}</p>
      <h1 className="font-light text-[clamp(40px,5vw,72px)] leading-[1.05] mt-6">{t("thanks.title")}</h1>
      <p className="text-concrete-1 mt-6">{t("thanks.body")}</p>
      <Link href={`/${locale}/dashboard/architecte`} className="mt-10 inline-flex items-center gap-2 px-5 py-3 bg-green text-paper text-sm">{t("thanks.cta")}</Link>
    </section>
    <Footer />
  </>);
}
```

- [ ] **Step 4: Strings** — `wizardArchitect` namespace with `eyebrow,next,back,submit,titles.{1..6},fields.{full_name,email,phone,photo_url,country,city,specialties,languages,project_types,years_experience,description,portfolio_url,availability,availability.available,availability.busy,availability.unavailable,fee_from,terms},thanks.{eyebrow,title,body,cta}`.

- [ ] **Step 5: Test end-to-end**

`npm run dev`. Logout if logged in. Visit `/fr/architectes/rejoindre` → redirects to register. Create `arch1@reliote.test` / password / role=architect. → Wizard appears. Walk through 6 steps with valid inputs. Submit. Verify: `docker compose exec db psql -U postgres -d postgres -c "select full_name,status from architect_profiles where email='arch1@reliote.test';"` returns 1 row with `status='pending'`.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: architect onboarding wizard end-to-end"
```

---

# Phase 4 — Client project wizard + matching engine

### Task 32: Project Zod schema

**Files:** Create `src/lib/validation/project.schema.ts`

- [ ] **Step 1: Schema**

```ts
import { z } from "zod";
import { SPECIALTIES, PROJECT_TYPES } from "./architect.schema";

export const projectSchema = z.object({
  project_type: z.enum(PROJECT_TYPES),
  project_description: z.string().min(100, "≥ 100 caractères"),
  required_specialties: z.array(z.enum(SPECIALTIES)).min(1),
  notes: z.string().optional(),
  project_location: z.string().min(2),
  budget_range: z.string().optional(),
  timeline: z.string().optional(),
  client_name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
});

export type ProjectInput = z.infer<typeof projectSchema>;
```

Commit: `git add -A && git commit -m "feat(validation): project zod schema"`.

---

### Task 33: Matching engine + unit tests

**Files:** Create `src/lib/matching/score.ts`, `src/lib/matching/score.test.ts`

- [ ] **Step 1: Write the test first**

```ts
// src/lib/matching/score.test.ts
import { describe, it, expect } from "vitest";
import { scoreArchitect, MAX_SCORE } from "./score";

const project = {
  id: "p1",
  project_type: "residential" as const,
  required_specialties: ["Résidentiel","Hospitalité"],
  project_location: "Bingerville",
  budget_range: "€500k–€800k",
};

const baseArchitect = {
  id: "a1", city: "Cocody", specialties: ["Commercial"], project_types: ["commercial"] as const[],
  years_experience: 2, availability: "available" as const, rating: 4.0, status: "verified" as const,
};

describe("scoreArchitect", () => {
  it("returns 0 with no overlap and low experience but +15 for availability", () => {
    const r = scoreArchitect(project, baseArchitect);
    expect(r.score).toBe(15);
    expect(r.reasons.map(x => x.kind)).toEqual(["availability"]);
  });

  it("awards +30 for specialty overlap", () => {
    const r = scoreArchitect(project, { ...baseArchitect, specialties: ["Résidentiel"] });
    expect(r.score).toBe(45);
    expect(r.reasons.some(x => x.kind === "specialty")).toBe(true);
  });

  it("awards +20 for project_type match", () => {
    const r = scoreArchitect(project, { ...baseArchitect, project_types: ["residential"] });
    expect(r.score).toBe(35);
  });

  it("awards +10 for experience threshold (large budget)", () => {
    const r = scoreArchitect(project, { ...baseArchitect, years_experience: 12 });
    expect(r.score).toBe(25);
  });

  it("awards +10 for location signal", () => {
    const r = scoreArchitect(project, { ...baseArchitect, city: "Bingerville" });
    expect(r.score).toBe(25);
  });

  it("awards +5 for high rating", () => {
    const r = scoreArchitect(project, { ...baseArchitect, rating: 4.8 });
    expect(r.score).toBe(20);
  });

  it("returns max possible score", () => {
    const r = scoreArchitect(project, { ...baseArchitect, specialties: ["Résidentiel","Hospitalité"], project_types: ["residential"], years_experience: 15, city: "Bingerville", rating: 4.9 });
    expect(r.score).toBe(MAX_SCORE);
  });
});
```

- [ ] **Step 2: Run — should fail**

```bash
npm test
```

Expected: "Cannot find module './score'".

- [ ] **Step 3: Implement**

```ts
// src/lib/matching/score.ts
export const MAX_SCORE = 30 + 20 + 15 + 10 + 10 + 5; // 90

export type MatchReason =
  | { kind: "specialty"; items: string[]; weight: 30 }
  | { kind: "project_type"; item: string; weight: 20 }
  | { kind: "availability"; weight: 15 }
  | { kind: "experience"; years: number; weight: 10 }
  | { kind: "location"; city: string; weight: 10 }
  | { kind: "rating"; value: number; weight: 5 };

export type ProjectForMatch = {
  id: string;
  project_type: string;
  required_specialties: string[];
  project_location: string;
  budget_range: string | null | undefined;
};

export type ArchitectForMatch = {
  id: string; city: string; specialties: string[]; project_types: readonly string[];
  years_experience: number; availability: "available" | "busy" | "unavailable";
  rating: number | null; status?: string;
};

function parseBudget(s?: string | null): number {
  if (!s) return 0;
  const m = s.match(/(\d+)\s*k/i);
  return m ? Number(m[1]) * 1000 : 0;
}

export function scoreArchitect(p: ProjectForMatch, a: ArchitectForMatch) {
  const reasons: MatchReason[] = [];
  let score = 0;

  const overlap = p.required_specialties.filter(s => a.specialties.includes(s));
  if (overlap.length > 0) { score += 30; reasons.push({ kind: "specialty", items: overlap, weight: 30 }); }

  if (a.project_types.includes(p.project_type)) { score += 20; reasons.push({ kind: "project_type", item: p.project_type, weight: 20 }); }

  if (a.availability === "available") { score += 15; reasons.push({ kind: "availability", weight: 15 }); }

  const budget = parseBudget(p.budget_range);
  const expThreshold = budget < 50_000 ? 5 : 10;
  if (a.years_experience >= expThreshold) { score += 10; reasons.push({ kind: "experience", years: a.years_experience, weight: 10 }); }

  if (a.city && p.project_location.toLowerCase().includes(a.city.toLowerCase())) {
    score += 10; reasons.push({ kind: "location", city: a.city, weight: 10 });
  }

  if ((a.rating ?? 0) >= 4.5) { score += 5; reasons.push({ kind: "rating", value: a.rating ?? 0, weight: 5 }); }

  return { architectId: a.id, score, reasons };
}

export function rankArchitects(p: ProjectForMatch, architects: ArchitectForMatch[], limit = 5) {
  return architects
    .filter(a => a.status === "verified" && a.availability !== "unavailable")
    .map(a => scoreArchitect(p, a))
    .sort((x, y) => y.score - x.score)
    .slice(0, limit);
}
```

- [ ] **Step 4: Run — should pass**

```bash
npm test
```

Expected: 7 passed.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(matching): rule-based scoring engine with 7 tests"
```

---

### Task 34: ProjectWizard (5 steps)

**Files:** `src/components/forms/ProjectWizard.tsx`, `src/components/forms/steps/Project{1..5}.tsx`

- [ ] **Step 1: Orchestrator**

Same shape as `ArchitectWizard` but with 5 steps. `STEP_FIELDS` per step:

```ts
const STEP_FIELDS = [
  ["project_type"],
  ["project_description","required_specialties","notes"],
  ["project_location","budget_range","timeline"],
  ["client_name","email","phone"],
  [], // confirmation
];
```

On the 5th step's Next, call `submitProject(form.getValues())` → redirects to `/projets/[id]/confirmation` returned in the server action. (Use Next.js redirect; no return value handling needed.)

- [ ] **Step 2: Steps**

- `Project1.tsx`: 6-button grid for `project_type` (radio styled as architectural tiles).
- `Project2.tsx`: textarea `project_description` (counter under it), `<Checkboxes name="required_specialties" options={SPECIALTIES} />`, textarea `notes`.
- `Project3.tsx`: `project_location`, `budget_range` (select with 4 ranges), `timeline` (select: <6 mois / 6–12 / 12–24 / >24).
- `Project4.tsx`: `client_name`, `email`, `phone`.
- `Project5.tsx`: read-only recap card listing every field.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat(forms): ProjectWizard 5-step shell + steps"
```

---

### Task 35: Project submission server action + matching write

**Files:** `src/app/[locale]/projets/initier/page.tsx`, `src/app/[locale]/projets/initier/actions.ts`, `src/app/[locale]/projets/[id]/confirmation/page.tsx`

- [ ] **Step 1: Server action**

```ts
"use server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { projectSchema } from "@/lib/validation/project.schema";
import { rankArchitects } from "@/lib/matching/score";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export async function submitProject(input: unknown) {
  const parsed = projectSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Validation error" };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: project, error } = await supabase
    .from("client_projects")
    .insert({ ...parsed.data, user_id: user?.id ?? null })
    .select()
    .single();
  if (error || !project) return { error: error?.message ?? "Insert failed" };

  // service-role for cross-RLS reads + writes into match_results
  const service = createServiceClient();
  const { data: architects } = await service
    .from("architect_profiles")
    .select("id, city, specialties, project_types, years_experience, availability, rating, status");
  const matches = rankArchitects(
    {
      id: project.id,
      project_type: project.project_type,
      required_specialties: project.required_specialties,
      project_location: project.project_location,
      budget_range: project.budget_range,
    },
    (architects ?? []) as any,
    5
  );
  if (matches.length > 0) {
    await service.from("match_results").insert(matches.map(m => ({ project_id: project.id, architect_id: m.architectId, score: m.score, reasons: m.reasons })));
    await service.from("client_projects").update({ status: "matched" }).eq("id", project.id);
  }

  const locale = (await cookies()).get("NEXT_LOCALE")?.value || "fr";
  redirect(`/${locale}/projets/${project.id}/confirmation`);
}
```

- [ ] **Step 2: Wizard page**

```tsx
// src/app/[locale]/projets/initier/page.tsx
import { Nav } from "@/components/shared/Nav";
import { Footer } from "@/components/landing/Footer";
import { ProjectWizard } from "@/components/forms/ProjectWizard";
import { createClient } from "@/lib/supabase/server";

export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return (<>
    <Nav />
    <ProjectWizard defaultEmail={user?.email ?? ""} />
    <Footer />
  </>);
}
```

Note: project submission is open to anonymous users — they fill `client_name` and `email` themselves. If logged in, prefill.

- [ ] **Step 3: Confirmation page with matches**

```tsx
// src/app/[locale]/projets/[id]/confirmation/page.tsx
import { createServiceClient } from "@/lib/supabase/service";
import { getLocale, getTranslations } from "next-intl/server";
import { Nav } from "@/components/shared/Nav";
import { Footer } from "@/components/landing/Footer";
import Image from "next/image";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await getTranslations("wizardClient");
  const service = createServiceClient();
  const { data: project } = await service.from("client_projects").select("*").eq("id", id).single();
  const { data: matches } = await service
    .from("match_results")
    .select("score, reasons, architect_id, architect_profiles!inner(*)")
    .eq("project_id", id)
    .order("score", { ascending: false });

  return (<>
    <Nav />
    <section className="page-edge py-32 max-w-[1080px] mx-auto">
      <p className="eyebrow">{t("thanks.eyebrow")}</p>
      <h1 className="font-light text-[clamp(40px,5vw,72px)] leading-[1.05] mt-6">{t("thanks.title")}</h1>
      <p className="text-concrete-1 mt-6 max-w-[60ch]">{t("thanks.body")}</p>
      <p className="eyebrow mt-12">{t("thanks.matches", { n: matches?.length ?? 0 })}</p>
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-[var(--gutter)]">
        {(matches ?? []).map((m: any) => (
          <article key={m.architect_id} className="border border-[var(--hairline)] p-6 flex gap-6">
            <div className="relative w-24 h-32 bg-paper-2 flex-shrink-0">{m.architect_profiles.photo_url && <Image src={m.architect_profiles.photo_url} alt="" fill className="object-cover" sizes="96px" />}</div>
            <div className="flex-1">
              <div className="flex items-baseline justify-between"><h3 className="font-medium">{m.architect_profiles.full_name}</h3><span className="mono text-[11px] tracking-[0.18em] text-green">{Math.round(m.score/90*100)}% {t("match")}</span></div>
              <p className="eyebrow mt-1">{m.architect_profiles.city}</p>
              <p className="text-[12px] text-concrete-1 mt-2">{m.architect_profiles.specialties.join(" · ")}</p>
              <ul className="mt-3 space-y-1 text-[12px] mono text-concrete-2">
                {m.reasons.map((r: any, i: number) => <li key={i}>· {r.kind === "specialty" ? `Spécialité: ${r.items.join(", ")}` : r.kind === "project_type" ? `Type: ${r.item}` : r.kind === "availability" ? "Disponible" : r.kind === "experience" ? `${r.years} ans d'expérience` : r.kind === "location" ? `Localisation: ${r.city}` : `Note ${r.value}★`} (+{r.weight})</li>)}
              </ul>
            </div>
          </article>
        ))}
      </div>
    </section>
    <Footer />
  </>);
}
```

- [ ] **Step 4: Strings** — `wizardClient` namespace with `eyebrow,next,back,submit,titles.{1..5},fields.*,thanks.{eyebrow,title,body,matches,cta},match`.

- [ ] **Step 5: Test end-to-end**

`npm run dev`. Visit `/fr/projets/initier` (anonymous). Fill the 5 steps with a residential project located in "Bingerville". Submit. Expected: redirected to `/fr/projets/<uuid>/confirmation` showing 3-5 ranked architects with score % and reasons. Verify the DB:

```bash
docker compose exec db psql -U postgres -d postgres -c "select project_id, score, jsonb_array_length(reasons) from match_results order by score desc limit 10;"
```

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: client project wizard + auto-matching + confirmation with reasons"
```

---

# Phase 5 — Dashboards (client & architect, minimal)

### Task 36: Dashboard layout (sidebar shell)

**Files:** `src/app/[locale]/dashboard/layout.tsx`, `src/components/shared/DashboardShell.tsx`

- [ ] **Step 1: Implement**

```tsx
// src/app/[locale]/dashboard/layout.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { Nav } from "@/components/shared/Nav";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const locale = await getLocale();
  if (!user) redirect(`/${locale}/auth/login`);
  return (<><Nav /><main className="pt-24">{children}</main></>);
}
```

Commit.

---

### Task 37: Client dashboard

**Files:** `src/app/[locale]/dashboard/client/page.tsx`

- [ ] **Step 1: Implement**

```tsx
import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";

export default async function ClientDash() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: projects } = await supabase
    .from("client_projects").select("id, project_type, project_location, status, created_at")
    .order("created_at", { ascending: false });
  return (
    <section className="page-edge py-16">
      <p className="eyebrow">Espace client</p>
      <h1 className="font-light text-5xl mt-4">Mes projets.</h1>
      <table className="w-full mt-12 text-sm">
        <thead className="text-left eyebrow"><tr><th className="py-3 border-b border-[var(--hairline)]">Type</th><th>Lieu</th><th>Statut</th><th></th></tr></thead>
        <tbody>
          {(projects ?? []).map(p => (
            <tr key={p.id} className="border-b border-[var(--hairline-soft)]"><td className="py-4">{p.project_type}</td><td>{p.project_location}</td><td>{p.status}</td><td className="text-right"><a className="underline" href={`/fr/projets/${p.id}/confirmation`}>Voir →</a></td></tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
```

Commit.

---

### Task 38: Architect dashboard

**Files:** `src/app/[locale]/dashboard/architecte/page.tsx`

- [ ] **Step 1: Implement (shows own profile + incoming matches via RLS)**

```tsx
import { createClient } from "@/lib/supabase/server";
export default async function ArchDash() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("architect_profiles").select("*").eq("user_id", user.id).single();
  // Thanks to RLS, this only returns matches where the architect is the user
  const { data: matches } = await supabase
    .from("match_results")
    .select("score, reasons, client_projects!inner(id, project_type, project_location, project_description, created_at)")
    .order("score", { ascending: false });
  return (
    <section className="page-edge py-16">
      <p className="eyebrow">Espace architecte</p>
      <h1 className="font-light text-5xl mt-4">{profile?.full_name ?? "Bienvenue"}</h1>
      <p className="text-concrete-1 mt-2">Statut : <span className="mono uppercase">{profile?.status ?? "—"}</span></p>
      <h2 className="font-light text-3xl mt-16">Projets entrants</h2>
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-[var(--gutter)]">
        {(matches ?? []).map((m: any) => (
          <article key={m.client_projects.id} className="border border-[var(--hairline)] p-6">
            <div className="flex justify-between"><span className="eyebrow">{m.client_projects.project_type}</span><span className="mono text-green">{Math.round(m.score/90*100)}%</span></div>
            <p className="mt-3 text-sm">{m.client_projects.project_description}</p>
            <p className="eyebrow mt-3">{m.client_projects.project_location}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
```

Commit.

---

# Phase 6 — Admin dashboard

### Task 39: Admin guard layout + overview

**Files:** `src/app/[locale]/admin/layout.tsx`, `src/app/[locale]/admin/page.tsx`, `src/components/admin/AdminShell.tsx`

- [ ] **Step 1: Layout enforcing admin role**

```tsx
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { Nav } from "@/components/shared/Nav";
import { AdminShell } from "@/components/admin/AdminShell";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const locale = await getLocale();
  if (!user) redirect(`/${locale}/auth/login?next=/${locale}/admin`);
  const { data: prof } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (prof?.role !== "admin") notFound();
  return (<><Nav /><main className="pt-24"><AdminShell>{children}</AdminShell></main></>);
}
```

- [ ] **Step 2: AdminShell with sidebar tabs**

```tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/fr/admin", label: "Vue d'ensemble" },
  { href: "/fr/admin/architectes", label: "Architectes" },
  { href: "/fr/admin/projets", label: "Projets" },
  { href: "/fr/admin/matches", label: "Matches" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const p = usePathname();
  return (
    <div className="page-edge py-12 grid grid-cols-12 gap-[var(--gutter)]">
      <aside className="col-span-12 md:col-span-3">
        <nav className="space-y-2">
          {TABS.map(t => (
            <Link key={t.href} href={t.href} className={`block py-2 text-sm border-l-2 pl-3 ${p===t.href ? "border-green text-ink" : "border-transparent text-concrete-1 hover:text-ink"}`}>{t.label}</Link>
          ))}
        </nav>
      </aside>
      <section className="col-span-12 md:col-span-9">{children}</section>
    </div>
  );
}
```

- [ ] **Step 3: Overview page**

```tsx
import { createServiceClient } from "@/lib/supabase/service";

export default async function AdminOverview() {
  const s = createServiceClient();
  const [a, p, m] = await Promise.all([
    s.from("architect_profiles").select("status", { count: "exact" }),
    s.from("client_projects").select("status", { count: "exact" }),
    s.from("match_results").select("id", { count: "exact" }),
  ]);
  const archByStatus = (a.data ?? []).reduce((acc: Record<string, number>, x: any) => (acc[x.status] = (acc[x.status] ?? 0) + 1, acc), {});
  const projByStatus = (p.data ?? []).reduce((acc: Record<string, number>, x: any) => (acc[x.status] = (acc[x.status] ?? 0) + 1, acc), {});
  return (
    <>
      <p className="eyebrow">Admin · Vue d'ensemble</p>
      <h1 className="font-light text-5xl mt-4">Reliote · MVP</h1>
      <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6">
        <Card title="Architectes total" value={a.count ?? 0} />
        <Card title="Vérifiés" value={archByStatus.verified ?? 0} />
        <Card title="En attente" value={archByStatus.pending ?? 0} />
        <Card title="Refusés" value={archByStatus.rejected ?? 0} />
        <Card title="Projets total" value={p.count ?? 0} />
        <Card title="Nouveaux" value={projByStatus.new ?? 0} />
        <Card title="Matchés" value={projByStatus.matched ?? 0} />
        <Card title="Matches" value={m.count ?? 0} />
      </div>
    </>
  );
}
function Card({ title, value }: { title: string; value: number }) {
  return <div className="border-t border-[var(--hairline)] pt-4"><span className="font-display text-5xl">{value}</span><p className="eyebrow mt-2">{title}</p></div>;
}
```

- [ ] **Step 4: Test**

Log in as `admin@reliote.test`. Visit `/fr/admin`. Expected: 8 counters reflecting seed data + your test architect.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(admin): guarded shell + overview with live counters"
```

---

### Task 40: Architects admin table + status actions

**Files:** `src/app/[locale]/admin/architectes/page.tsx`, `src/app/[locale]/admin/architectes/actions.ts`

- [ ] **Step 1: Actions**

```ts
"use server";
import { createServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";

export async function setArchitectStatus(id: string, status: "pending"|"verified"|"rejected"|"paused") {
  const s = createServiceClient();
  await s.from("architect_profiles").update({ status }).eq("id", id);
  revalidatePath("/fr/admin/architectes");
  revalidatePath("/en/admin/architectes");
  revalidatePath("/fr/architectes");
  revalidatePath("/en/architectes");
}
```

- [ ] **Step 2: Table**

```tsx
import { createServiceClient } from "@/lib/supabase/service";
import { setArchitectStatus } from "./actions";

export default async function AdminArchitects() {
  const s = createServiceClient();
  const { data } = await s.from("architect_profiles").select("id, full_name, city, status, created_at, rating, years_experience").order("created_at", { ascending: false });
  return (
    <>
      <p className="eyebrow">Admin · Architectes</p>
      <h1 className="font-light text-4xl mt-4">{data?.length ?? 0} architectes</h1>
      <table className="w-full mt-10 text-sm">
        <thead className="text-left eyebrow"><tr><th className="py-3 border-b border-[var(--hairline)]">Nom</th><th>Ville</th><th>Statut</th><th>Note</th><th>Exp.</th><th>Actions</th></tr></thead>
        <tbody>
          {(data ?? []).map(a => (
            <tr key={a.id} className="border-b border-[var(--hairline-soft)]">
              <td className="py-4">{a.full_name}</td><td>{a.city}</td>
              <td><span className={`mono uppercase text-[11px] tracking-[0.18em] ${a.status==="verified" ? "text-green" : a.status==="pending" ? "text-brass" : "text-concrete-2"}`}>{a.status}</span></td>
              <td>{a.rating?.toFixed(1) ?? "—"}</td><td>{a.years_experience} ans</td>
              <td className="space-x-2">
                <form action={setArchitectStatus.bind(null, a.id, "verified")} className="inline"><button className="underline text-green">Valider</button></form>
                <form action={setArchitectStatus.bind(null, a.id, "rejected")} className="inline"><button className="underline text-concrete-1">Refuser</button></form>
                <form action={setArchitectStatus.bind(null, a.id, "paused")} className="inline"><button className="underline text-concrete-1">Pause</button></form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
```

- [ ] **Step 3: Test**

Log in as admin, change the pending architect (the one you registered earlier) to `verified`. Visit `/fr/architectes` → architect appears in the public index. Visit `/fr` → architect appears in the landing index. Stop.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat(admin): architects table with status actions + revalidation"
```

---

### Task 41: Projects admin table

**Files:** `src/app/[locale]/admin/projets/page.tsx`

- [ ] **Step 1: Implement**

```tsx
import { createServiceClient } from "@/lib/supabase/service";

export default async function AdminProjects() {
  const s = createServiceClient();
  const { data } = await s.from("client_projects").select("id, client_name, project_type, project_location, status, created_at").order("created_at", { ascending: false });
  return (
    <>
      <p className="eyebrow">Admin · Projets</p>
      <h1 className="font-light text-4xl mt-4">{data?.length ?? 0} projets</h1>
      <table className="w-full mt-10 text-sm">
        <thead className="text-left eyebrow"><tr><th className="py-3 border-b border-[var(--hairline)]">Client</th><th>Type</th><th>Lieu</th><th>Statut</th><th></th></tr></thead>
        <tbody>
          {(data ?? []).map(p => (
            <tr key={p.id} className="border-b border-[var(--hairline-soft)]">
              <td className="py-4">{p.client_name}</td><td>{p.project_type}</td><td>{p.project_location}</td><td>{p.status}</td>
              <td className="text-right"><a className="underline" href={`/fr/projets/${p.id}/confirmation`}>Détails →</a></td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
```

Commit.

---

### Task 42: Matches view + recalculate button

**Files:** `src/app/[locale]/admin/matches/page.tsx`, `src/app/api/admin/match/recalculate/route.ts`

- [ ] **Step 1: Route handler for recalculation**

```ts
// src/app/api/admin/match/recalculate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { rankArchitects } from "@/lib/matching/score";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauth" }, { status: 401 });
  const { data: prof } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (prof?.role !== "admin") return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const projectId = req.nextUrl.searchParams.get("projectId");
  if (!projectId) return NextResponse.json({ error: "missing projectId" }, { status: 400 });

  const s = createServiceClient();
  const { data: project } = await s.from("client_projects").select("id, project_type, required_specialties, project_location, budget_range").eq("id", projectId).single();
  if (!project) return NextResponse.json({ error: "not found" }, { status: 404 });
  const { data: architects } = await s.from("architect_profiles").select("id, city, specialties, project_types, years_experience, availability, rating, status");
  const matches = rankArchitects(project as any, (architects ?? []) as any, 5);
  await s.from("match_results").delete().eq("project_id", projectId);
  if (matches.length > 0) {
    await s.from("match_results").insert(matches.map(m => ({ project_id: projectId, architect_id: m.architectId, score: m.score, reasons: m.reasons })));
    await s.from("client_projects").update({ status: "matched" }).eq("id", projectId);
  }
  return NextResponse.json({ ok: true, count: matches.length });
}
```

- [ ] **Step 2: Matches view**

```tsx
"use client";
// src/app/[locale]/admin/matches/page.tsx
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AdminMatches() {
  const [projects, setProjects] = useState<any[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  useEffect(() => { (async () => {
    const s = createClient();
    const { data } = await s.from("client_projects").select("id, client_name, project_type, project_location").order("created_at", { ascending: false });
    setProjects(data ?? []);
    if (data?.[0]) setSelected(data[0].id);
  })(); }, []);
  useEffect(() => { (async () => {
    if (!selected) return;
    const s = createClient();
    const { data } = await s.from("match_results").select("score, reasons, architect_profiles!inner(full_name, city, specialties)").eq("project_id", selected).order("score", { ascending: false });
    setMatches(data ?? []);
  })(); }, [selected]);

  async function recalc() {
    if (!selected) return;
    setBusy(true);
    await fetch(`/api/admin/match/recalculate?projectId=${selected}`, { method: "POST" });
    setBusy(false);
    // re-fetch
    setSelected(s => (s ? `${s}` : s)); // trigger
  }

  return (
    <>
      <p className="eyebrow">Admin · Matches</p>
      <h1 className="font-light text-4xl mt-4">Mises en relation</h1>
      <div className="mt-10 grid grid-cols-12 gap-6">
        <ul className="col-span-4 space-y-2">
          {projects.map(p => (<li key={p.id}><button onClick={() => setSelected(p.id)} className={`text-left text-sm w-full py-2 border-l-2 pl-3 ${selected===p.id ? "border-green text-ink" : "border-transparent text-concrete-1 hover:text-ink"}`}>{p.client_name} — {p.project_type}<br /><span className="eyebrow">{p.project_location}</span></button></li>))}
        </ul>
        <div className="col-span-8">
          <button onClick={recalc} disabled={busy || !selected} className="px-4 py-2 bg-ink text-paper text-sm disabled:opacity-50">{busy ? "…" : "Re-calculer"}</button>
          <div className="mt-6 space-y-4">
            {matches.map((m: any, i: number) => (
              <article key={i} className="border border-[var(--hairline)] p-5">
                <div className="flex justify-between"><h3 className="font-medium">{m.architect_profiles.full_name}</h3><span className="mono text-green">{Math.round(m.score/90*100)}%</span></div>
                <p className="eyebrow mt-1">{m.architect_profiles.city}</p>
                <ul className="mt-3 space-y-1 text-[12px] mono text-concrete-2">
                  {(m.reasons as any[]).map((r,j) => <li key={j}>· {r.kind} (+{r.weight})</li>)}
                </ul>
              </article>
            ))}
            {matches.length === 0 && <p className="text-concrete-1 text-sm">Aucun match pour ce projet.</p>}
          </div>
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 3: Test**

As admin, visit `/fr/admin/matches`. Pick the project you submitted earlier. Click "Re-calculer" → list refreshes. Verify it works against the seeded project too.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat(admin): matches view + POST /api/admin/match/recalculate"
```

---

# Phase 7 — Public architect pages

### Task 43: `/architectes` public index

**Files:** `src/app/[locale]/architectes/page.tsx`

- [ ] **Step 1: Implement (reuse `ArchitectGrid`)**

```tsx
import { Nav } from "@/components/shared/Nav";
import { Footer } from "@/components/landing/Footer";
import { ArchitectIndex } from "@/components/landing/ArchitectIndex";

export default function Page() {
  return (<><Nav /><div className="pt-24"><ArchitectIndex /></div><Footer /></>);
}
```

Commit.

---

### Task 44: `/architectes/[id]` public profile (SEO)

**Files:** `src/app/[locale]/architectes/[id]/page.tsx`

- [ ] **Step 1: Implement**

```tsx
import { Nav } from "@/components/shared/Nav";
import { Footer } from "@/components/landing/Footer";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Image from "next/image";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("architect_profiles").select("full_name, city").eq("id", id).single();
  return { title: data ? `${data.full_name} — Reliote` : "Reliote" };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: a } = await supabase.from("architect_profiles").select("*").eq("id", id).single();
  if (!a || a.status !== "verified") notFound();
  return (<>
    <Nav />
    <main className="pt-24 page-edge py-16 grid grid-cols-12 gap-[var(--gutter)]">
      <aside className="col-span-12 md:col-span-5">
        {a.photo_url && <div className="relative aspect-[4/5]"><Image src={a.photo_url} alt={a.full_name} fill className="object-cover" sizes="(min-width: 768px) 40vw, 100vw" /></div>}
      </aside>
      <section className="col-span-12 md:col-span-7">
        <p className="eyebrow">{a.city}</p>
        <h1 className="font-light text-6xl mt-2 leading-tight">{a.full_name}</h1>
        <p className="text-concrete-1 mt-4">{a.specialties.join(" · ")}</p>
        <p className="mt-8">{a.description}</p>
        <dl className="mt-10 grid grid-cols-2 gap-4 text-sm">
          <div><dt className="eyebrow">Expérience</dt><dd>{a.years_experience} ans</dd></div>
          <div><dt className="eyebrow">Note</dt><dd>{a.rating?.toFixed(1)}★</dd></div>
          <div><dt className="eyebrow">Langues</dt><dd>{a.languages.join(", ")}</dd></div>
          <div><dt className="eyebrow">Honoraires</dt><dd>{a.fee_from ?? "—"}</dd></div>
          <div><dt className="eyebrow">Portfolio</dt><dd>{a.portfolio_url ? <a className="underline" href={a.portfolio_url} target="_blank">{a.portfolio_url}</a> : "—"}</dd></div>
        </dl>
      </section>
    </main>
    <Footer />
  </>);
}
```

Commit.

---

# Phase 8 — Polish, Dockerfile, README

### Task 45: Responsive sweep

- [ ] **Step 1: Resize the browser at 360 / 768 / 1024 / 1440 px and walk every page.**

Fix anything that overflows. Common fixes:
- Hero headline `text-balance` already on; cap line breaks at md.
- Pillars: stack vertically below `md`.
- Architect grid: `grid-cols-2` below `md`.
- Wizard: max-width 720 px, single column inputs below md.

Commit each fix individually with `git commit -m "fix(responsive): …"`.

---

### Task 46: Dockerfile for Next.js production

**Files:** Create `Dockerfile`, `.dockerignore`

- [ ] **Step 1: Dockerfile**

```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
```

In `next.config.ts` add `output: "standalone"`.

- [ ] **Step 2: `.dockerignore`**

```
node_modules
.next
.git
.env.local
supabase/volumes
_design-reference
docs
```

- [ ] **Step 3: Verify build**

```bash
docker build -t reliote-web .
```

Expected: image built successfully.

- [ ] **Step 4: Commit**

```bash
git add Dockerfile .dockerignore next.config.ts && git commit -m "chore: production Dockerfile (standalone Next.js)"
```

---

### Task 47: README — full setup guide

**Files:** Create `README.md`

- [ ] **Step 1: Write it**

```md
# Reliote — MVP

Premium platform connecting French project owners with verified architects in Côte d'Ivoire.

## Quick start (local)

```bash
# 1) Boot Supabase self-hosted
cd supabase
cp .env.example .env   # fill secrets (POSTGRES_PASSWORD, JWT_SECRET, ANON_KEY, SERVICE_ROLE_KEY, DASHBOARD_*)
docker compose up -d
# Studio at http://localhost:54323

# 2) Apply migrations + seed (auto on first boot via /docker-entrypoint-initdb.d)
#    Manual re-run:
docker compose exec db psql -U postgres -d postgres -f /docker-entrypoint-initdb.d/migrations/0001_schema.sql
docker compose exec db psql -U postgres -d postgres -f /docker-entrypoint-initdb.d/migrations/0002_rls.sql
docker compose exec db psql -U postgres -d postgres -f /docker-entrypoint-initdb.d/migrations/0003_triggers.sql
docker compose exec db psql -U postgres -d postgres -f /docker-entrypoint-initdb.d/seed.sql

# 3) Run the Next.js app
cd ..
cp .env.example .env.local   # paste ANON_KEY + SERVICE_ROLE_KEY from supabase/.env
npm install
npm run dev    # http://localhost:3000
```

## Seeded accounts

- Admin — `admin@reliote.test` / `ReliotePass2026!`
- 8 architects pre-loaded (status `verified`)
- 3 demo client projects

## Running tests

```bash
npm test                 # vitest run
npm run test:watch       # vitest interactive
```

## Tech

Next.js 15 · TypeScript · Tailwind v4 · shadcn/ui · Framer Motion · next-intl · React Hook Form · Zod · Supabase self-hosted · Postgres 15.

## Architecture

See `docs/superpowers/specs/2026-06-01-reliote-mvp-design.md`.

## Deploy on VPS

1. Provision a VPS with Docker.
2. Copy `supabase/` and fill `supabase/.env` with production secrets.
3. `cd supabase && docker compose up -d`.
4. Build the web image: `docker build -t reliote-web .`.
5. Run it with the right env vars pointing at the Supabase URL on the VPS.
6. Front with nginx + Let's Encrypt.
```

- [ ] **Step 2: Commit**

```bash
git add README.md && git commit -m "docs: full README setup + deploy guide"
```

---

### Task 48: Acceptance walkthrough

Run through the 7 acceptance criteria from the spec § 14:

- [ ] **AC1**: visit `/fr` → all 10 sections render.
- [ ] **AC2**: click LangSwitch → `/en`, full page in English.
- [ ] **AC3**: register architect, fill 6 steps, submit → row in `architect_profiles` with `status='pending'`.
- [ ] **AC4**: register/anonymous client, fill 5 steps, submit → confirmation page with ≥1 ranked architect.
- [ ] **AC5**: admin log in → counters reflect real data → validate the pending architect → public profile reachable.
- [ ] **AC6**: close browser, reopen → still logged in. Log out → cookie cleared.
- [ ] **AC7**: from the architect's account, fetch `client_projects` → returns only matched ones (RLS).

For each, capture a one-liner confirmation. If any fails, file an inline bug fix task and commit.

- [ ] **Final commit**

```bash
git commit --allow-empty -m "chore: MVP acceptance walkthrough complete"
```

---

## Self-review (writer's check)

- **Spec coverage** — every spec section is implemented:
  - §3 Architecture: Task 1-3, 11
  - §4 Design system: Task 2, 13-15
  - §5 Routes & flows: Tasks 18 (auth), 28 (landing), 31 (architect), 35 (client), 36-38 (dashboards), 39-42 (admin), 43-44 (public architect pages)
  - §6 DB schema + RLS: Tasks 5-7
  - §7 Matching engine: Task 33
  - §8 Auth & roles: Tasks 11-12, 18, 36, 39
  - §9 LangSwitch: Task 15
  - §10 Project structure: matches Task 1 + components/lib creation order
  - §11 Setup & deployment: Tasks 4, 46-47
  - §12 Quality gates: Task 33 (tests), 45 (responsive)
  - §14 Acceptance criteria: Task 48
- **Placeholders** — Strings tasks (13, 19-step2, 22-step5, etc.) reference `data.jsx` rather than enumerating every line; this is intentional because the strings are mechanical copy-port and inlining all of them inflates the plan ~3×. The executor must open `_design-reference/reliote/project/data.jsx` and port verbatim. This is the only "copy from source" reference in the plan and is unavoidable.
- **Type consistency** — `ArchitectInput`, `ProjectInput`, `MatchReason`, `scoreArchitect`, `rankArchitects` names are stable across tasks 29, 32, 33, 35.
- **Cross-task references** — Task 31's server action filename `actions.ts` lives at `src/app/[locale]/architectes/rejoindre/actions.ts`, imported in Task 30 by `ArchitectWizard`. Same for Task 35 / Task 34. Verified.

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-06-01-reliote-mvp.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints.

**Which approach?**
