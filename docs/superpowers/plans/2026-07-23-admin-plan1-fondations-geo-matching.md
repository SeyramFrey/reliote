# Plan 1 — Fondations : pivot géo + matching + sécurité — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ouvrir la plateforme à tous les pays africains, ajouter le pays du chantier au formulaire projet et au matching, rendre le numéro d'ordre obligatoire pour tous, et fermer la faille des server actions admin.

**Architecture:** Évolutions ciblées sur l'existant — pas de nouvelle brique. On étend la lib pays, le moteur de score déterministe, les schémas Zod et une migration Supabase idempotente. Un helper `requireAdmin()` garde les server actions admin.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Zod v4, react-hook-form, next-intl, Supabase (Postgres self-hosted via docker-compose), Vitest.

## Global Constraints

- Migrations **idempotentes** (patterns `if not exists` / `do $$`), ajoutées à `supabase/apply-migrations.sh` **avant** `seed.sql`.
- Le chantier est **toujours dans un pays africain** ; le client peut être n'importe où.
- `ordre_number` **obligatoire pour tous les pays** ; le **format strict `AAAA/NNN/NNN` reste vérifié uniquement pour la Côte d'Ivoire**.
- Barème de matching : spécialités 30 · **pays 25** · type 20 · disponibilité 15 · expérience 10 · ville 5 · note 5 → **MAX_SCORE = 110**.
- Commits fréquents sur la **branche courante** (pas de nouvelle branche — consigne utilisateur).
- Tests : `npm run test` (Vitest). Lint : `npm run lint`. Types : `npm run db:types`.

---

### Task 1: Ouvrir tous les pays africains

**Files:**
- Modify: `src/lib/countries/africa.ts`
- Test: `src/lib/countries/africa.test.ts` (create)

**Interfaces:**
- Consumes: rien.
- Produces: `AFRICAN_COUNTRIES` avec tous `available: true` ; `ACTIVE_COUNTRIES.length === 54`.

- [ ] **Step 1: Write the failing test**

Create `src/lib/countries/africa.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { AFRICAN_COUNTRIES, ACTIVE_COUNTRIES } from "./africa";

describe("africa countries", () => {
  it("lists the 54 sovereign African states", () => {
    expect(AFRICAN_COUNTRIES).toHaveLength(54);
  });

  it("has every country available (pan-African rollout)", () => {
    expect(AFRICAN_COUNTRIES.every((c) => c.available)).toBe(true);
    expect(ACTIVE_COUNTRIES).toHaveLength(54);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/countries/africa.test.ts`
Expected: FAIL — `ACTIVE_COUNTRIES` a 1 élément, `every available` est `false`.

- [ ] **Step 3: Make all countries available**

In `src/lib/countries/africa.ts`, set `available: true` on **every** entry of `AFRICAN_COUNTRIES` (the 53 currently `false` plus CI). Keep the `AfricanCountry` type and the `available` field — the flag stays available to disable a country later. Update the top comment:

```ts
// The 54 sovereign African states (UN member roster), with ISO-3166-1 alpha-2 codes.
// All countries are active (pan-African rollout). The `available` flag is kept so a
// single country can be disabled case-by-case ("Bientôt") if ever needed.
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/countries/africa.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/countries/africa.ts src/lib/countries/africa.test.ts
git commit -m "feat(geo): open all 54 African countries"
```

---

### Task 2: Matching — poids « pays du chantier »

**Files:**
- Modify: `src/lib/matching/score.ts`
- Test: `src/lib/matching/score.test.ts`

**Interfaces:**
- Consumes: rien.
- Produces:
  - `ProjectForMatch` gagne `project_country: string`.
  - `ArchitectForMatch` gagne `country: string`.
  - `MatchReason` gagne `{ kind: "country"; country: string; weight: 25 }` ; `location` passe à `weight: 5`.
  - `MAX_SCORE === 110`.

- [ ] **Step 1: Update the tests first (they must fail)**

In `src/lib/matching/score.test.ts`, replace the `project` and `baseArchitect` fixtures and add a country test. New content:

```ts
import { describe, it, expect } from "vitest";
import { scoreArchitect, MAX_SCORE } from "./score";

const project = {
  id: "p1",
  project_type: "residential" as const,
  required_specialties: ["Résidentiel", "Hospitalité"],
  project_country: "Côte d'Ivoire",
  project_location: "Bingerville",
  budget_range: "€500k–€800k",
};

const baseArchitect = {
  id: "a1",
  country: "Sénégal", // ne matche pas le pays du chantier
  city: "Cocody",
  specialties: ["Commercial"],
  project_types: ["commercial"] as const,
  years_experience: 2,
  availability: "available" as const,
  rating: 4.0,
  status: "verified" as const,
};

describe("scoreArchitect", () => {
  it("returns +15 for availability only when nothing else matches", () => {
    const r = scoreArchitect(project, baseArchitect);
    expect(r.score).toBe(15);
    expect(r.reasons.map((x) => x.kind)).toEqual(["availability"]);
  });

  it("awards +30 for specialty overlap", () => {
    const r = scoreArchitect(project, { ...baseArchitect, specialties: ["Résidentiel"] });
    expect(r.score).toBe(45);
    expect(r.reasons.some((x) => x.kind === "specialty")).toBe(true);
  });

  it("awards +25 when architect country matches the construction country", () => {
    const r = scoreArchitect(project, { ...baseArchitect, country: "Côte d'Ivoire" });
    expect(r.score).toBe(40);
    expect(r.reasons.some((x) => x.kind === "country")).toBe(true);
  });

  it("awards +20 for project_type match", () => {
    const r = scoreArchitect(project, { ...baseArchitect, project_types: ["residential"] });
    expect(r.score).toBe(35);
  });

  it("awards +10 for experience threshold (large budget)", () => {
    const r = scoreArchitect(project, { ...baseArchitect, years_experience: 12 });
    expect(r.score).toBe(25);
  });

  it("awards +5 for location (city) signal", () => {
    const r = scoreArchitect(project, { ...baseArchitect, city: "Bingerville" });
    expect(r.score).toBe(20);
  });

  it("awards +5 for high rating", () => {
    const r = scoreArchitect(project, { ...baseArchitect, rating: 4.8 });
    expect(r.score).toBe(20);
  });

  it("returns max possible score", () => {
    const r = scoreArchitect(project, {
      ...baseArchitect,
      country: "Côte d'Ivoire",
      specialties: ["Résidentiel", "Hospitalité"],
      project_types: ["residential"],
      years_experience: 15,
      city: "Bingerville",
      rating: 4.9,
    });
    expect(r.score).toBe(MAX_SCORE);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/matching/score.test.ts`
Expected: FAIL (type errors on `project_country`/`country`, wrong scores, no `country` reason).

- [ ] **Step 3: Update `score.ts`**

Replace the top of `src/lib/matching/score.ts` down to the end of `scoreArchitect`:

```ts
export const MAX_SCORE = 30 + 25 + 20 + 15 + 10 + 5 + 5; // 110

export type MatchReason =
  | { kind: "specialty"; items: string[]; weight: 30 }
  | { kind: "country"; country: string; weight: 25 }
  | { kind: "project_type"; item: string; weight: 20 }
  | { kind: "availability"; weight: 15 }
  | { kind: "experience"; years: number; weight: 10 }
  | { kind: "location"; city: string; weight: 5 }
  | { kind: "rating"; value: number; weight: 5 };

export type ProjectForMatch = {
  id: string;
  project_type: string;
  required_specialties: string[];
  project_country: string;
  project_location: string;
  budget_range: string | null | undefined;
};

export type ArchitectForMatch = {
  id: string;
  country: string;
  city: string;
  specialties: string[];
  project_types: readonly string[];
  years_experience: number;
  availability: "available" | "busy" | "unavailable";
  rating: number | null;
  status?: string;
};

function parseBudget(s?: string | null): number {
  if (!s) return 0;
  const m = s.match(/(\d+)\s*k/i);
  return m ? Number(m[1]) * 1000 : 0;
}

export function scoreArchitect(p: ProjectForMatch, a: ArchitectForMatch) {
  const reasons: MatchReason[] = [];
  let score = 0;

  const overlap = p.required_specialties.filter((s) => a.specialties.includes(s));
  if (overlap.length > 0) {
    score += 30;
    reasons.push({ kind: "specialty", items: overlap, weight: 30 });
  }

  if (a.country && p.project_country && a.country === p.project_country) {
    score += 25;
    reasons.push({ kind: "country", country: a.country, weight: 25 });
  }

  if (a.project_types.includes(p.project_type)) {
    score += 20;
    reasons.push({ kind: "project_type", item: p.project_type, weight: 20 });
  }

  if (a.availability === "available") {
    score += 15;
    reasons.push({ kind: "availability", weight: 15 });
  }

  const budget = parseBudget(p.budget_range);
  const expThreshold = budget < 50_000 ? 5 : 10;
  if (a.years_experience >= expThreshold) {
    score += 10;
    reasons.push({ kind: "experience", years: a.years_experience, weight: 10 });
  }

  if (a.city && p.project_location.toLowerCase().includes(a.city.toLowerCase())) {
    score += 5;
    reasons.push({ kind: "location", city: a.city, weight: 5 });
  }

  if ((a.rating ?? 0) >= 4.5) {
    score += 5;
    reasons.push({ kind: "rating", value: a.rating ?? 0, weight: 5 });
  }

  return { architectId: a.id, score, reasons };
}
```

Leave `rankArchitects` unchanged.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/matching/score.test.ts`
Expected: PASS (8 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/matching/score.ts src/lib/matching/score.test.ts
git commit -m "feat(matching): add construction-country weight (+25), MAX_SCORE 110"
```

---

### Task 3: Migration 0009 — pays du chantier + ordre_number requis

**Files:**
- Create: `supabase/migrations/0009_geo_panafrican.sql`
- Modify: `supabase/apply-migrations.sh`
- Modify: `src/types/database.ts` (via `npm run db:types`)

**Interfaces:**
- Produces: colonne `client_projects.project_country text not null` ; `architect_profiles.ordre_number` `not null` + non vide ; contrainte CI supprimée.

- [ ] **Step 1: Write the migration**

Create `supabase/migrations/0009_geo_panafrican.sql`:

```sql
-- 0009_geo_panafrican.sql
-- Pivot pan-africain :
--   1. Ajoute client_projects.project_country (pays du chantier, africain).
--   2. Rend architect_profiles.ordre_number obligatoire pour TOUS les pays
--      (retire la contrainte spécifique Côte d'Ivoire de 0005).
-- Idempotent.

-- ── 1. Pays du chantier ───────────────────────────────────────────────────
alter table public.client_projects
  add column if not exists project_country text;

-- Backfill : les projets MVP existants étaient en Côte d'Ivoire.
update public.client_projects
   set project_country = 'Côte d''Ivoire'
 where project_country is null;

alter table public.client_projects
  alter column project_country set not null;

-- ── 2. Numéro d'ordre obligatoire partout ─────────────────────────────────
-- Retire la contrainte conditionnelle CI de 0005.
alter table public.architect_profiles
  drop constraint if exists architect_ordre_required_for_ci;

-- Filet de sécurité pour d'éventuelles lignes historiques sans numéro.
update public.architect_profiles
   set ordre_number = 'N/A'
 where ordre_number is null or length(trim(ordre_number)) = 0;

alter table public.architect_profiles
  alter column ordre_number set not null;

alter table public.architect_profiles
  drop constraint if exists architect_ordre_not_blank;
alter table public.architect_profiles
  add constraint architect_ordre_not_blank
  check (length(trim(ordre_number)) > 0);
```

- [ ] **Step 2: Register the migration in the apply script**

In `supabase/apply-migrations.sh`, add the file to `SQL_FILES` **after** `0008_engagement_and_reveal.sql` and **before** `/reliote/seed.sql`:

```bash
  /reliote/migrations/0008_engagement_and_reveal.sql
  /reliote/migrations/0009_geo_panafrican.sql
  /reliote/seed.sql
```

- [ ] **Step 3: Apply migrations and verify**

Run: `bash supabase/apply-migrations.sh`
Expected: `Applying /reliote/migrations/0009_geo_panafrican.sql...` then `Reliote migrations + seed applied.` with no error.

Verify the column exists:

```bash
MSYS_NO_PATHCONV=1 docker compose -f supabase/docker-compose.yml exec -T db \
  psql -U supabase_admin -d postgres -c "\d public.client_projects" | grep project_country
```
Expected: a line showing `project_country | text | not null`.

- [ ] **Step 4: Regenerate DB types**

Run: `npm run db:types`
Expected: `src/types/database.ts` now lists `project_country: string` in `client_projects` Row/Insert/Update.

> Fallback if the stack/CLI is unavailable: hand-edit `src/types/database.ts` — in `client_projects`, add `project_country: string` to `Row`, `project_country: string` to `Insert`, and `project_country?: string` to `Update`.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/0009_geo_panafrican.sql supabase/apply-migrations.sh src/types/database.ts
git commit -m "feat(db): add project_country + require ordre_number for all countries"
```

---

### Task 4: Schéma projet — `project_country`

**Files:**
- Modify: `src/lib/validation/project.schema.ts`
- Test: `src/lib/validation/project.schema.test.ts`

**Interfaces:**
- Consumes: `AFRICAN_COUNTRIES` (Task 1).
- Produces: `ProjectInput` gagne `project_country: string` (doit être un nom de pays africain).

- [ ] **Step 1: Write the failing test**

Add to `src/lib/validation/project.schema.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { projectSchema } from "./project.schema";

const validBase = {
  project_type: "residential" as const,
  project_description: "x".repeat(100),
  required_specialties: ["Résidentiel" as const],
  project_country: "Côte d'Ivoire",
  project_location: "Bingerville",
  client_name: "Awa Koné",
  email: "awa@example.com",
};

describe("projectSchema — project_country", () => {
  it("accepts a valid African country", () => {
    expect(projectSchema.safeParse(validBase).success).toBe(true);
  });

  it("rejects a missing country", () => {
    const { project_country, ...noCountry } = validBase;
    void project_country;
    expect(projectSchema.safeParse(noCountry).success).toBe(false);
  });

  it("rejects a non-African country", () => {
    expect(projectSchema.safeParse({ ...validBase, project_country: "France" }).success).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/validation/project.schema.test.ts`
Expected: FAIL — `project_country` inconnu du schéma, "France" accepté.

- [ ] **Step 3: Add the field to the schema**

In `src/lib/validation/project.schema.ts`, add the import and the field:

```ts
import { z } from "zod";
import { SPECIALTIES, PROJECT_TYPES } from "./architect.schema";
import { AFRICAN_COUNTRIES } from "@/lib/countries/africa";

const AFRICAN_COUNTRY_NAMES = AFRICAN_COUNTRIES.map((c) => c.name);

export const projectSchema = z.object({
  project_type: z.enum(PROJECT_TYPES),
  project_description: z.string().min(100, "≥ 100 caractères"),
  required_specialties: z.array(z.enum(SPECIALTIES)).min(1),
  notes: z.string().optional(),
  project_country: z
    .string()
    .refine((v) => AFRICAN_COUNTRY_NAMES.includes(v), "Pays du chantier requis"),
  project_location: z.string().min(2),
  budget_range: z.string().optional(),
  timeline: z.string().optional(),
  client_name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
});

export type ProjectInput = z.infer<typeof projectSchema>;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/validation/project.schema.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/validation/project.schema.ts src/lib/validation/project.schema.test.ts
git commit -m "feat(project): validate construction country against African list"
```

---

### Task 5: Généraliser `CountrySelectField`

**Files:**
- Modify: `src/components/forms/fields/CountrySelectField.tsx`

**Interfaces:**
- Produces: `CountrySelectField` accepte `namespace?: string` (défaut `"wizardArchitect"`) et `labelKey?: string` (défaut `"fields.country"`). Le formulaire architecte reste inchangé (défauts).

- [ ] **Step 1: Add optional props (backward compatible)**

Replace `src/components/forms/fields/CountrySelectField.tsx` with:

```tsx
"use client";
import { useFormContext } from "react-hook-form";
import { useTranslations } from "next-intl";
import { AFRICAN_COUNTRIES_SORTED } from "@/lib/countries/africa";

// Native <select> styled like the wizard's other underlined inputs.
// Lists all 54 African countries; only those flagged `available: true` are selectable.
// `namespace`/`labelKey` let the same field serve both the architect and the project wizards.
export function CountrySelectField({
  name,
  namespace = "wizardArchitect",
  labelKey = "fields.country",
}: {
  name: string;
  namespace?: string;
  labelKey?: string;
}) {
  const { register, formState } = useFormContext();
  const t = useTranslations(namespace);
  const error = formState.errors[name];
  return (
    <label className="block">
      <span className="eyebrow">
        {t(labelKey)} <span className="text-brass">*</span>
      </span>
      <div className="relative mt-1">
        <select
          {...register(name)}
          className="w-full bg-transparent border-b border-[var(--hairline)] py-2 outline-none focus:border-green appearance-none pr-8 text-[16px]"
        >
          {AFRICAN_COUNTRIES_SORTED.map((c) => (
            <option key={c.iso2} value={c.name} disabled={!c.available}>
              {c.emoji} {c.name}
              {!c.available ? "  —  Bientôt" : ""}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 mono text-[11px] text-concrete-2">
          ▾
        </span>
      </div>
      {error && (
        <span className="text-xs text-red-700 block mt-1">
          {String(error.message)}
        </span>
      )}
    </label>
  );
}
```

- [ ] **Step 2: Verify nothing broke (typecheck + existing tests)**

Run: `npx tsc --noEmit`
Expected: no error.

Run: `npm run test`
Expected: all green (no regression).

- [ ] **Step 3: Commit**

```bash
git add src/components/forms/fields/CountrySelectField.tsx
git commit -m "refactor(forms): make CountrySelectField reusable across wizards"
```

---

### Task 6: Formulaire projet — select pays du chantier

**Files:**
- Modify: `src/components/forms/steps/Project3.tsx`
- Modify: `src/components/forms/steps/Project5.tsx`
- Modify: `src/messages/fr.json`
- Modify: `src/messages/en.json`

**Interfaces:**
- Consumes: `CountrySelectField` (Task 5), namespace `wizardProject`.
- Produces: le wizard projet écrit `project_country` dans le form state ; l'étape récap l'affiche.

- [ ] **Step 1: Add the country message keys**

In `src/messages/fr.json`, in the `wizardProject.fields` object, add `project_country` and relabel `project_location`:

```json
      "project_country": "Pays du chantier",
      "project_location": "Ville / localité du chantier",
```

In `src/messages/en.json`, same object, add:

```json
      "project_country": "Construction country",
      "project_location": "City / locality of the site",
```

> Keep the surrounding keys intact; only add `project_country` and edit the `project_location` value.

- [ ] **Step 2: Render the select in Project3**

In `src/components/forms/steps/Project3.tsx`, import the field and render it **above** the existing `project_location` input. Add at the top of the file:

```tsx
import { CountrySelectField } from "../fields/CountrySelectField";
```

Then, immediately inside the step's returned container, before the existing `project_location` `<label>`, insert:

```tsx
<div className="mb-6">
  <CountrySelectField
    name="project_country"
    namespace="wizardProject"
    labelKey="fields.project_country"
  />
</div>
```

- [ ] **Step 3: Show country in the recap (Project5)**

In `src/components/forms/steps/Project5.tsx`, in the rows array, add a line **before** the `project_location` row:

```tsx
[t("fields.project_country"), v.project_country ?? "—"],
```

- [ ] **Step 4: Verify the wizard builds and typechecks**

Run: `npx tsc --noEmit`
Expected: no error.

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 5: Manual smoke check**

Run: `npm run dev`, open `/fr/projets/initier`, go to the location step. Expected: a "Pays du chantier" select listing African countries appears above the city field; the recap step shows the chosen country.

- [ ] **Step 6: Commit**

```bash
git add src/components/forms/steps/Project3.tsx src/components/forms/steps/Project5.tsx src/messages/fr.json src/messages/en.json
git commit -m "feat(project): add construction-country select to the project wizard"
```

---

### Task 7: `submitProject` — passer le pays au matching

**Files:**
- Modify: `src/app/[locale]/projets/initier/actions.ts`

**Interfaces:**
- Consumes: `ProjectForMatch.project_country`, `ArchitectForMatch.country` (Task 2).
- Produces: le matching à la soumission tient compte du pays.

- [ ] **Step 1: Thread project_country + architect country through**

In `src/app/[locale]/projets/initier/actions.ts`:

1. Extend the `InsertedProject` type:

```ts
type InsertedProject = {
  id: string;
  project_type: string;
  required_specialties: string[];
  project_country: string;
  project_location: string;
  budget_range: string | null;
};
```

2. Add `project_country` to the insert `.select(...)`:

```ts
    .select("id, project_type, required_specialties, project_country, project_location, budget_range")
```

3. Add `country` to the architects `.select(...)`:

```ts
    .select("id, country, city, specialties, project_types, years_experience, availability, rating, status") as {
    data: ArchitectForMatch[] | null;
  };
```

4. Add `project_country` to `projectForMatch`:

```ts
  const projectForMatch: ProjectForMatch = {
    id: inserted.id,
    project_type: inserted.project_type,
    required_specialties: inserted.required_specialties,
    project_country: inserted.project_country,
    project_location: inserted.project_location,
    budget_range: inserted.budget_range,
  };
```

(The `insertRow` already spreads `parsed.data`, so `project_country` is inserted automatically.)

- [ ] **Step 2: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: no error.

- [ ] **Step 3: Manual end-to-end check**

Run: `npm run dev`, submit a project via `/fr/projets/initier` choosing an architect's country. Then as admin open `/fr/admin/matches`, select the project. Expected: architects in the matched country score higher; a "country" reason is present.

- [ ] **Step 4: Commit**

```bash
git add src/app/[locale]/projets/initier/actions.ts
git commit -m "feat(matching): include construction country in on-submit matching"
```

---

### Task 8: `ordre_number` obligatoire partout (schéma + UI)

**Files:**
- Modify: `src/lib/validation/architect.schema.ts`
- Modify: `src/components/forms/steps/Architect4.tsx`
- Test: `src/lib/validation/architect.schema.test.ts`

**Interfaces:**
- Produces: `architectSchema` rejette un `ordre_number` vide pour **tout** pays ; le format `AAAA/NNN/NNN` n'est exigé **que** pour la Côte d'Ivoire.

- [ ] **Step 1: Write the failing tests**

Add to `src/lib/validation/architect.schema.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { architectSchema } from "./architect.schema";

const validNonCI = {
  first_name: "Kofi",
  last_name: "Mensah",
  email: "kofi@example.com",
  country: "Ghana",
  city: "Accra",
  ordre_number: "GH-2021-0042",
  specialties: ["Résidentiel" as const],
  languages: ["FR"],
  project_types: ["residential" as const],
  years_experience: 8,
  description: "x".repeat(80),
  availability: "available" as const,
  terms: true as const,
};

describe("architectSchema — ordre_number required for all", () => {
  it("accepts a free-form ordre number outside Côte d'Ivoire", () => {
    expect(architectSchema.safeParse(validNonCI).success).toBe(true);
  });

  it("rejects an empty ordre number outside Côte d'Ivoire", () => {
    expect(architectSchema.safeParse({ ...validNonCI, ordre_number: "" }).success).toBe(false);
  });

  it("still enforces the CNOA format for Côte d'Ivoire", () => {
    const ci = { ...validNonCI, country: "Côte d'Ivoire" };
    expect(architectSchema.safeParse({ ...ci, ordre_number: "GH-2021-0042" }).success).toBe(false);
    expect(architectSchema.safeParse({ ...ci, ordre_number: "2014/418/132" }).success).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/validation/architect.schema.test.ts`
Expected: FAIL — empty ordre number currently accepted outside CI.

- [ ] **Step 3: Update the schema**

In `src/lib/validation/architect.schema.ts`, change the `ordre_number` field and its refine. Replace the field line:

```ts
    ordre_number: z.string().min(1, "Numéro d'ordre requis"),
```

Replace the CI refine block with (required-everywhere is now handled by `.min(1)`; keep the CI-only format check):

```ts
  // Le numéro d'ordre est requis pour tous (voir champ). Le format strict AAAA/NNN/NNN
  // (matricule CNOA) n'est exigé que pour la Côte d'Ivoire ; les autres pays sont libres.
  .refine(
    (d) => d.country !== "Côte d'Ivoire" || ORDRE_NUMBER_RE.test(d.ordre_number),
    { path: ["ordre_number"], message: "N° d'agrément CNOA requis (format AAAA/NNN/NNN)" }
  )
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/validation/architect.schema.test.ts`
Expected: PASS.

- [ ] **Step 5: Make the field always show as required in the UI**

In `src/components/forms/steps/Architect4.tsx`:

- Remove the now-unused country watch. Replace lines 12–13:

```tsx
  const ordreRequired = true;
```

- Remove `useWatch` from the import on line 2 (it is no longer used):

```tsx
import { useFormContext } from "react-hook-form";
```

- [ ] **Step 6: Verify typecheck + full test suite**

Run: `npx tsc --noEmit && npm run test`
Expected: no type error; all tests green.

- [ ] **Step 7: Commit**

```bash
git add src/lib/validation/architect.schema.ts src/lib/validation/architect.schema.test.ts src/components/forms/steps/Architect4.tsx
git commit -m "feat(architect): require ordre_number for every country (CNOA format CI-only)"
```

---

### Task 9: Sécurité — `requireAdmin()` sur les server actions

**Files:**
- Create: `src/lib/auth/requireAdmin.ts`
- Test: `src/lib/auth/requireAdmin.test.ts`
- Modify: `src/app/[locale]/admin/architectes/actions.ts`

**Interfaces:**
- Produces: `requireAdmin(): Promise<void>` — throws `"Unauthorized"` (pas de session) ou `"Forbidden"` (rôle ≠ admin), sinon résout. À appeler en tête de chaque server action / route handler admin.

- [ ] **Step 1: Write the failing test**

Create `src/lib/auth/requireAdmin.test.ts`:

```ts
import { vi, describe, it, expect, beforeEach } from "vitest";

const getUser = vi.fn();
const single = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser },
    from: () => ({ select: () => ({ eq: () => ({ single }) }) }),
  }),
}));

import { requireAdmin } from "./requireAdmin";

beforeEach(() => {
  getUser.mockReset();
  single.mockReset();
});

describe("requireAdmin", () => {
  it("throws Unauthorized when there is no session", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    await expect(requireAdmin()).rejects.toThrow("Unauthorized");
  });

  it("throws Forbidden for a non-admin", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    single.mockResolvedValue({ data: { role: "client" } });
    await expect(requireAdmin()).rejects.toThrow("Forbidden");
  });

  it("resolves for an admin", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    single.mockResolvedValue({ data: { role: "admin" } });
    await expect(requireAdmin()).resolves.toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/auth/requireAdmin.test.ts`
Expected: FAIL — module `./requireAdmin` not found.

- [ ] **Step 3: Implement the helper**

Create `src/lib/auth/requireAdmin.ts`:

```ts
import "server-only";
import { createClient } from "@/lib/supabase/server";

type ProfileRole = { role: string };

// Guards server actions and route handlers that mutate admin-only data.
// Pages under /admin are already gated by the admin layout, but server actions are
// independent POST endpoints — they must re-check the caller's role here.
export async function requireAdmin(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: prof } = (await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()) as { data: ProfileRole | null };

  if (prof?.role !== "admin") throw new Error("Forbidden");
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/auth/requireAdmin.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Guard `setArchitectStatus`**

In `src/app/[locale]/admin/architectes/actions.ts`, import and call the guard first:

```ts
"use server";
import { createServiceClient } from "@/lib/supabase/service";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { revalidatePath } from "next/cache";

type Status = "pending" | "verified" | "rejected" | "paused";

export async function setArchitectStatus(id: string, status: Status): Promise<void> {
  await requireAdmin();
  const s = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (s.from("architect_profiles") as any).update({ status }).eq("id", id);
  revalidatePath("/fr/admin/architectes");
  revalidatePath("/en/admin/architectes");
  revalidatePath("/fr/architectes");
  revalidatePath("/en/architectes");
}
```

- [ ] **Step 6: Verify typecheck + tests**

Run: `npx tsc --noEmit && npm run test`
Expected: no type error; all tests green.

- [ ] **Step 7: Commit**

```bash
git add src/lib/auth/requireAdmin.ts src/lib/auth/requireAdmin.test.ts src/app/[locale]/admin/architectes/actions.ts
git commit -m "fix(security): require admin role in admin server actions"
```

---

### Task 10: Affichage du score sur /110

**Files:**
- Modify: `src/app/[locale]/admin/matches/page.tsx`

**Interfaces:**
- Consumes: `MAX_SCORE` (Task 2).
- Produces: le pourcentage affiché reflète le nouveau maximum (110).

- [ ] **Step 1: Use MAX_SCORE instead of the hard-coded 90**

In `src/app/[locale]/admin/matches/page.tsx`:

- Add the import at the top:

```tsx
import { MAX_SCORE } from "@/lib/matching/score";
```

- Replace the percentage expression `Math.round((m.score / 90) * 100)` with:

```tsx
{Math.round((m.score / MAX_SCORE) * 100)}%
```

- [ ] **Step 2: Verify typecheck + build**

Run: `npx tsc --noEmit && npm run build`
Expected: no error; build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/app/[locale]/admin/matches/page.tsx
git commit -m "fix(admin): compute match percentage from MAX_SCORE (110)"
```

---

## Self-Review

**Spec coverage (Bloc A + correctif sécurité) :**
- 54 pays ouverts → Task 1. ✓
- Select pays sur formulaire projet → Tasks 4, 6. ✓
- `ordre_number` obligatoire partout, format CI-only → Tasks 3, 8. ✓
- Poids pays dans le matching → Tasks 2, 7. ✓
- Migration idempotente + enregistrée → Task 3. ✓
- Correctif sécurité server actions (`requireAdmin`) → Task 9. ✓
- (Hors périmètre Plan 1 : extension de l'enum `project_status`, table `meetings`, e-mails, UI fiche projet, contenu — traités dans les Plans 2 et 3.)

**Placeholder scan :** aucun TODO/TBD ; tout le code est fourni. ✓

**Type consistency :** `ProjectForMatch.project_country` et `ArchitectForMatch.country` (Task 2) sont consommés identiquement dans `actions.ts` (Task 7) ; `CountrySelectField` props `namespace`/`labelKey` (Task 5) réutilisés en Task 6 ; `requireAdmin` signature `(): Promise<void>` (Task 9) appelée sans argument. ✓

**Ordre d'exécution :** 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 (Task 4 dépend de 1 ; 6 dépend de 5 ; 7 dépend de 2+3 ; 10 dépend de 2).
