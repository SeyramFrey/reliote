# Parcours complet — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Un porteur de projet, un architecte et l'admin peuvent aller de bout en bout — dépôt du projet → sélection → rendez-vous → révélation → clôture — sans impasse, dans les deux langues.

**Architecture:** Next.js 16 App Router (server components + server actions), Supabase Cloud (RLS durcie par 0014 ; toute écriture métier passe par des server actions qui vérifient l'appelant puis utilisent la clé service). La logique pure (fuseaux, transitions de statut, résultat d'inscription) vit dans `src/lib/**` avec des tests Vitest ; les pages restent minces.

**Tech Stack:** Next.js 16.2, React 19, next-intl, react-hook-form + Zod, Supabase (`@supabase/ssr`), Vitest, Resend (REST, best-effort).

**Spec:** `docs/superpowers/specs/2026-07-23-admin-workflow-panafricain-design.md` (§5 workflow, §6 e-mails, §7 UI admin) + `docs/superpowers/specs/2026-06-01-reliote-mvp-design.md` (§5 routes, §8 auth). Décisions produit du 2026-10-10 (prioritaires sur la spec) :
1. **Compte obligatoire pour déposer un projet, créé dans le même formulaire** que le projet.
2. **Révélation au RDV confirmé** (le porteur confirme + signe la charte → identités révélées des deux côtés). En multi-proposition, le porteur *choisit* parmi des profils anonymes — choisir ne révèle rien.
3. **Coordonnées du porteur masquées pour l'architecte jusqu'au RDV confirmé.**
4. **Fuseau** : l'admin choisit le fuseau à la saisie (Europe/Paris par défaut) ; e-mails et espaces affichent l'heure dans le fuseau du pays du chantier **et** en heure de Paris, fuseau toujours libellé.

## Global Constraints

- Toute nouvelle chaîne visible passe par `src/messages/fr.json` **et** `src/messages/en.json` (mêmes clés des deux côtés ; un test vérifie la parité).
- Aucune écriture métier depuis le navigateur : server actions uniquement, chacune revérifie l'utilisateur (`supabase.auth.getUser()`) et son droit sur la ligne avant d'utiliser `createServiceClient()`.
- Actions admin : `await requireAdmin()` en première ligne.
- Migrations SQL postérieures à 0014 : helpers dans `private.*` (jamais `public.is_admin()`).
- Redirections construites avec `safeLocale()` / `safeRedirectPath()` (`src/lib/auth/safeRedirect.ts`).
- E-mails : best-effort, ne font jamais échouer l'action ; bilingues selon `profiles.locale`.
- Pas de nouvelle dépendance npm sans raison écrite dans le commit.
- `npx tsc --noEmit`, `npx vitest run`, `npm run build` verts à chaque commit ; lint sans erreur sur les fichiers touchés.

## Review Focus

1. **E-mail déjà inscrit** au dépôt de projet : message clair + lien « se connecter » qui ramène au formulaire **sans perdre la saisie** (brouillon `sessionStorage`). Testé en Task 5.
2. **Confirmation d'e-mail activée** sur Supabase (pas de session après `signUp`) : le projet est quand même enregistré sous le bon `user_id`, l'utilisateur voit « vérifiez votre boîte », et retrouve le projet après connexion. Testé en Task 3 (`signUpOutcome`) et Task 5.
3. **Changement d'heure** (Paris passe de CEST à CET le 25/10/2026) : un RDV saisi à 10:00 Europe/Paris le 26/10 doit valoir 09:00 UTC, pas 08:00. Testé en Task 1.
4. **Relance / annulation après révélation** : annuler un RDV confirmé ne doit ni « dé-révéler » ni bloquer une replanification ; le projet revient à un état actionnable (`selected` si plus aucun RDV actif). Testé en Task 8 (`projectStatusAfter`).
5. **Re-proposer un architecte décliné/annulé** : l'admin doit pouvoir le reproposer (l'engagement repasse `proposed`), et la confirmation du RDV ne doit pas échouer en silence. Testé en Task 7.

---

## File Structure

| Fichier | Responsabilité |
|---|---|
| `src/lib/countries/africa.ts` (mod.) | + champ `tz` (IANA) par pays |
| `src/lib/time/meetingTime.ts` (new) | `zonedWallTimeToUtc`, `formatMeetingTime` (double fuseau), `TIMEZONE_CHOICES` |
| `src/lib/workflow/status.ts` (new) | Transitions pures projet/RDV : `projectStatusAfter(event, ctx)` |
| `src/lib/auth/signUpOutcome.ts` (new) | Interprète le retour de `supabase.auth.signUp` (créé+session / créé sans session / déjà inscrit) |
| `src/lib/auth/roles.ts` (new) | `dashboardPathFor(role, locale)` |
| `src/lib/email/templates.ts` (mod.) | Double fuseau + 8 nouveaux modèles |
| `src/proxy.ts` (renommé depuis `middleware.ts`) | Session + gardes de rôle |
| `src/app/[locale]/auth/*` (mod. + new `reset`, `verifier`) | Mot de passe oublié complet, messages, vérification e-mail |
| `src/app/[locale]/dashboard/page.tsx` (new) | Aiguillage par rôle |
| `src/components/shared/Nav.tsx` (+ `NavAccount.tsx` new) | Connexion / Mon espace / Déconnexion |
| `src/components/forms/ProjectWizard.tsx`, `steps/Project3-5.tsx`, `src/lib/validation/project.schema.ts` | Compte créé au dépôt, pays explicite, brouillon |
| `src/app/[locale]/projets/initier/actions.ts` | Création de compte + projet |
| `src/components/forms/ArchitectWizard.tsx`, `fields/FeeField.tsx`, `fields/PhoneField.tsx`, `src/lib/validation/architect.schema.ts` | Plus de défaut CI, honoraires réparés |
| `src/app/[locale]/admin/projets/actions.ts`, `[id]/page.tsx`, `src/app/api/admin/match/recalculate/route.ts` | Propositions, multi-proposition, cycle RDV, clôture, recalcul sans régression |
| `src/app/[locale]/admin/rdv/page.tsx` | Actions RDV complètes, double fuseau |
| `src/app/[locale]/dashboard/client/*` | Espace porteur bilingue : propositions, choix, RDV, révélation |
| `src/app/[locale]/architectes/page.tsx` | Redirige vers l'espace porteur |
| `src/components/forms/EngagementCharter.tsx` | Action injectée (`onAccept`) au lieu de `submitEngagement` |
| `src/app/[locale]/dashboard/architecte/page.tsx` | Identité masquée jusqu'au RDV, RDV listés, /110 |
| `src/app/[locale]/admin/architectes/*` (+ `[id]/page.tsx` new) | Fiche de vérification, filtre, e-mails de statut |
| `src/app/[locale]/admin/matches/page.tsx`, `admin/page.tsx` | Raisons lisibles, compteurs à jour |
| `src/types/database.ts` | Régénéré depuis Supabase Cloud |

---

### Task 0: Socle — types à jour et banc d'essai local

**Files:**
- Modify: `src/types/database.ts` (régénéré)
- Test: `src/messages/messages.test.ts` (new)

- [ ] **Step 1:** Régénérer les types depuis le Cloud (MCP `supabase-account` → `generate_typescript_types`, projet `kjaadikzxlunhdbgsbte`) et remplacer `src/types/database.ts`. Vérifier que `client_projects.project_country` et `legal_pages` y figurent et que `architect_profiles.ordre_number` est non nullable.
- [ ] **Step 2:** Écrire le test de parité i18n :

```ts
// src/messages/messages.test.ts
import { describe, it, expect } from "vitest";
import fr from "./fr.json";
import en from "./en.json";

function keys(o: unknown, p = ""): string[] {
  if (o && typeof o === "object" && !Array.isArray(o)) {
    return Object.entries(o as Record<string, unknown>).flatMap(([k, v]) =>
      keys(v, p ? `${p}.${k}` : k),
    );
  }
  return [p];
}

describe("messages", () => {
  it("fr and en expose the same keys", () => {
    expect(keys(en).sort()).toEqual(keys(fr).sort());
  });
});
```

- [ ] **Step 3:** `npx vitest run src/messages` → PASS. `npx tsc --noEmit` → corriger les erreurs de typage révélées par les nouveaux types (les `as any` existants restent tolérés).
- [ ] **Step 4:** Démarrer la pile locale (`cd supabase && docker compose up -d`), vérifier que `reliote-auth` est sain (`docker compose ps`) ; si GoTrue boucle, lire `docker logs reliote-auth --tail 50` et corriger la config locale (pas la prod). Appliquer `RELIOTE_DEV_ADMIN_PASSWORD=... ./supabase/apply-migrations.sh`.
- [ ] **Step 5:** Commit `chore: regenerate Supabase types, i18n parity test`.

---

### Task 1: Fuseaux horaires des RDV

**Files:**
- Modify: `src/lib/countries/africa.ts`
- Create: `src/lib/time/meetingTime.ts`, `src/lib/time/meetingTime.test.ts`

**Interfaces — Produces:**
- `AfricanCountry.tz: string` (IANA, fuseau de la capitale)
- `countryTimeZone(countryName: string): string` (défaut `"Africa/Abidjan"` si inconnu)
- `zonedWallTimeToUtc(local: string /* "YYYY-MM-DDTHH:mm" */, timeZone: string): Date`
- `formatMeetingTime(iso: string, opts: { locale: "fr" | "en"; projectTimeZone: string }): string` → FR quand les heures diffèrent : `« lundi 26 octobre 2026, 09:00 (heure de Dakar) · 10:00 heure de Paris »` ; quand elles coïncident, l'heure n'apparaît qu'une fois avec les deux libellés : `« mercredi 1 juillet 2026, 10:00 (heure de Johannesburg et de Paris) »`.
- `TIMEZONE_CHOICES: { value: string; label: string }[]` — Europe/Paris en tête, puis les fuseaux distincts des 54 pays.

- [ ] **Step 1: Tests qui échouent**

```ts
// src/lib/time/meetingTime.test.ts
import { describe, it, expect } from "vitest";
import { zonedWallTimeToUtc, formatMeetingTime, countryTimeZone, TIMEZONE_CHOICES } from "./meetingTime";

describe("zonedWallTimeToUtc", () => {
  it("converts Paris summer time (UTC+2)", () => {
    expect(zonedWallTimeToUtc("2026-10-20T10:00", "Europe/Paris").toISOString()).toBe("2026-10-20T08:00:00.000Z");
  });
  it("converts Paris winter time across the DST change (UTC+1)", () => {
    expect(zonedWallTimeToUtc("2026-10-26T10:00", "Europe/Paris").toISOString()).toBe("2026-10-26T09:00:00.000Z");
  });
  it("converts a UTC+0 African zone", () => {
    expect(zonedWallTimeToUtc("2026-10-26T10:00", "Africa/Abidjan").toISOString()).toBe("2026-10-26T10:00:00.000Z");
  });
  it("converts a UTC+3 African zone", () => {
    expect(zonedWallTimeToUtc("2026-10-26T10:00", "Africa/Nairobi").toISOString()).toBe("2026-10-26T07:00:00.000Z");
  });
  it("rejects malformed input", () => {
    expect(() => zonedWallTimeToUtc("26/10/2026 10h", "Europe/Paris")).toThrow();
  });
});

describe("formatMeetingTime", () => {
  it("shows project-country time and Paris time when they differ", () => {
    const s = formatMeetingTime("2026-10-26T09:00:00.000Z", { locale: "fr", projectTimeZone: "Africa/Dakar" });
    expect(s).toContain("09:00");
    expect(s).toContain("10:00");
    expect(s).toMatch(/Paris/);
  });
  it("shows a single time when both zones agree", () => {
    // Johannesburg is UTC+2 all year, like Paris in summer.
    const same = formatMeetingTime("2026-07-01T08:00:00.000Z", { locale: "en", projectTimeZone: "Africa/Johannesburg" });
    expect(same.match(/10:00/g)?.length).toBe(1);
    expect(same).toMatch(/Paris/);
    expect(same).toMatch(/Johannesburg/);
  });
});

describe("country time zones", () => {
  it("maps known countries and falls back", () => {
    expect(countryTimeZone("Sénégal")).toBe("Africa/Dakar");
    expect(countryTimeZone("Kenya")).toBe("Africa/Nairobi");
    expect(countryTimeZone("Atlantide")).toBe("Africa/Abidjan");
  });
  it("lists Paris first", () => {
    expect(TIMEZONE_CHOICES[0].value).toBe("Europe/Paris");
  });
});
```

- [ ] **Step 2:** `npx vitest run src/lib/time` → FAIL (module absent).
- [ ] **Step 3:** Ajouter `tz` aux 54 entrées de `africa.ts` (fuseau de la capitale ; RDC → `Africa/Kinshasa`) et implémenter `meetingTime.ts` sans dépendance : `zonedWallTimeToUtc` valide le format `^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$`, part de `Date.UTC(...)` comme estimation, calcule l'offset du fuseau à cet instant via `Intl.DateTimeFormat(..., { timeZone, hourCycle: "h23", year, month, day, hour, minute, second })`, corrige, puis recalcule une fois (cas des bascules d'heure). `formatMeetingTime` utilise `Intl.DateTimeFormat(locale === "en" ? "en-GB" : "fr-FR", { dateStyle: "full", timeStyle: "short", timeZone })` et un libellé de ville tiré du nom IANA (`Africa/Dakar` → `Dakar`).
- [ ] **Step 4:** `npx vitest run src/lib/time` → PASS.
- [ ] **Step 5:** Commit `feat(time): meeting time zones with dual display`.

---

### Task 2: E-mails — double fuseau et nouveaux modèles

**Files:**
- Modify: `src/lib/email/templates.ts`, `src/lib/email/templates.test.ts`

**Interfaces:**
- Consumes: `formatMeetingTime` (Task 1).
- Produces (tous `→ { subject: string; html: string }`, `loc0: string` en premier argument) :
  - `meetingProposedEmail(loc0, recipient, { scheduledAt, projectTimeZone, videoUrl?, projectLabel, ctaUrl?, rescheduled?: boolean })`
  - `meetingConfirmedEmail(loc0, recipient, { scheduledAt, projectTimeZone, videoUrl?, ctaUrl? })`
  - `meetingCancelledEmail(loc0, recipient: "client" | "architect", { scheduledAt, projectTimeZone, projectLabel })`
  - `meetingDeclinedAdminEmail({ clientName, scheduledAt, projectTimeZone, adminUrl })` (FR, destinataire admin)
  - `newProjectAdminEmail({ clientName, projectType, projectCountry, projectLocation, matchCount, adminUrl })` (FR)
  - `proposalsReadyEmail(loc0, { count, ctaUrl })` (au porteur : « choisissez votre architecte »)
  - `clientChoseAdminEmail({ clientName, architectHandle, adminUrl })` (FR)
  - `architectApplicationReceivedEmail(loc0, { firstName })`
  - `architectStatusEmail(loc0, { firstName, status: "verified" | "rejected" | "paused", ctaUrl? })`

- [ ] **Step 1:** Étendre `templates.test.ts` : pour chaque nouveau modèle, un test FR et un EN qui vérifient le sujet attendu et l'échappement HTML (`clientName: "<b>x</b>"` ne doit jamais apparaître brut) ; pour les modèles de RDV, que le HTML contient `"Paris"` et l'heure du pays du chantier (ex. `scheduledAt: "2026-10-26T09:00:00.000Z"`, `projectTimeZone: "Africa/Dakar"` → contient `09:00` et `10:00`).
- [ ] **Step 2:** `npx vitest run src/lib/email` → FAIL.
- [ ] **Step 3:** Implémenter : remplacer `fmtDate` par `formatMeetingTime` dans les modèles de RDV, ajouter les modèles. Les e-mails admin restent en français (l'admin est francophone) mais passent par `esc()`.
- [ ] **Step 4:** PASS, puis mettre à jour les appelants existants (`admin/projets/actions.ts`, `dashboard/client/actions.ts`) pour passer `projectTimeZone: countryTimeZone(project.project_country)` — `tsc` guide.
- [ ] **Step 5:** Commit `feat(email): dual time zone + lifecycle templates`.

---

### Task 3: Authentification complète

**Files:**
- Create: `src/lib/auth/signUpOutcome.ts` (+ test), `src/lib/auth/roles.ts` (+ test), `src/app/[locale]/auth/reset/page.tsx`, `src/app/[locale]/auth/verifier/page.tsx`, `src/app/[locale]/dashboard/page.tsx`
- Modify: `src/app/[locale]/auth/actions.ts`, `auth/callback/route.ts`, `auth/login/page.tsx`, `dashboard/layout.tsx`, `src/middleware.ts` → `src/proxy.ts`, messages fr/en (`auth.*`)

**Interfaces — Produces:**
- `type SignUpOutcome = { kind: "signed_in"; userId: string } | { kind: "needs_confirmation"; userId: string } | { kind: "already_registered" } | { kind: "error"; message: string }`
- `signUpOutcome(res: { data: { user: { id: string; identities?: unknown[] | null } | null; session: unknown | null }; error: { message: string; code?: string } | null }): SignUpOutcome` — `identities` vide ⇒ `already_registered` (Supabase masque les comptes existants ainsi) ; code `user_already_exists` ⇒ idem.
- `dashboardPathFor(role: string | null | undefined, locale: Locale): string` — admin → `/{l}/admin`, architect → `/{l}/dashboard/architecte`, sinon `/{l}/dashboard/client`.
- Server action `updatePassword(formData)` dans `auth/actions.ts`.

- [ ] **Step 1: Tests**

```ts
// src/lib/auth/signUpOutcome.test.ts
import { describe, it, expect } from "vitest";
import { signUpOutcome } from "./signUpOutcome";

const user = (identities: unknown[] | null = [{}]) => ({ id: "u1", identities });

describe("signUpOutcome", () => {
  it("signed in when a session comes back", () => {
    expect(signUpOutcome({ data: { user: user(), session: {} }, error: null })).toEqual({ kind: "signed_in", userId: "u1" });
  });
  it("needs confirmation when no session", () => {
    expect(signUpOutcome({ data: { user: user(), session: null }, error: null })).toEqual({ kind: "needs_confirmation", userId: "u1" });
  });
  it("already registered when identities is empty", () => {
    expect(signUpOutcome({ data: { user: user([]), session: null }, error: null })).toEqual({ kind: "already_registered" });
  });
  it("already registered on explicit error code", () => {
    expect(signUpOutcome({ data: { user: null, session: null }, error: { message: "x", code: "user_already_exists" } })).toEqual({ kind: "already_registered" });
  });
  it("passes other errors through", () => {
    expect(signUpOutcome({ data: { user: null, session: null }, error: { message: "weak password" } })).toEqual({ kind: "error", message: "weak password" });
  });
});
```

```ts
// src/lib/auth/roles.test.ts
import { describe, it, expect } from "vitest";
import { dashboardPathFor } from "./roles";

describe("dashboardPathFor", () => {
  it("routes each role", () => {
    expect(dashboardPathFor("admin", "fr")).toBe("/fr/admin");
    expect(dashboardPathFor("architect", "en")).toBe("/en/dashboard/architecte");
    expect(dashboardPathFor("client", "fr")).toBe("/fr/dashboard/client");
    expect(dashboardPathFor(null, "fr")).toBe("/fr/dashboard/client");
  });
});
```

- [ ] **Step 2:** FAIL → implémenter les deux modules → PASS.
- [ ] **Step 3: Callback** — `auth/callback/route.ts` : `exchangeCodeForSession` ; en cas d'erreur → `/{l}/auth/login?error=link`. Si `type=recovery` → `/{l}/auth/reset`. Sinon → `safeRedirectPath(next, dashboardPathFor(role, l))` (lire le rôle après échange).
- [ ] **Step 4: Reset** — page `auth/reset` (formulaire nouveau mot de passe ×2, min 8) → `updatePassword` : `supabase.auth.updateUser({ password })`, erreurs renvoyées en `?error=`, succès → `dashboardPathFor`. Sans session → renvoi vers `auth/forgot?error=expired`.
- [ ] **Step 5: Login** — afficher `error` (message traduit ; `link`, `expired`, et message Supabase brut sinon, échappé) et `sent=1` (« un lien vous a été envoyé »). Après connexion : `next` sûr, sinon `dashboardPathFor(role)`.
- [ ] **Step 6: Inscription** — `signUp` utilise `signUpOutcome` : `signed_in` → architecte `/{l}/architectes/rejoindre`, client `/{l}/projets/initier` ; `needs_confirmation` → `/{l}/auth/verifier?email=…` (page : « vérifiez votre boîte », bouton renvoyer = `supabase.auth.resend({ type: "signup", email })` via action) ; `already_registered` → `/{l}/auth/login?error=exists`. `emailRedirectTo` = `${SITE_URL}/{l}/auth/callback?next=` + chemin de reprise (`/architectes/rejoindre` ou `/projets/initier`).
- [ ] **Step 7: Proxy** — renommer `src/middleware.ts` en `src/proxy.ts` (export `proxy` au lieu de `middleware`, même `config`). Ajouter la garde de rôle : lire `profiles.role` via le client de `updateSession` uniquement pour `/admin`, `/dashboard/*` ; mauvais rôle → `dashboardPathFor(role)`. `/dashboard` seul → `dashboardPathFor`.
- [ ] **Step 8:** `dashboard/layout.tsx` : redirection non connecté vers `/{l}/auth/login?next=/{l}/dashboard`. Nouvelle page `dashboard/page.tsx` = redirect `dashboardPathFor`.
- [ ] **Step 9:** `npm run build` (plus d'avertissement `middleware` déprécié), commit `feat(auth): password reset, email verification, role routing`.

---

### Task 4: Nav — connexion, espace, déconnexion

**Files:**
- Create: `src/components/shared/NavAccount.tsx`
- Modify: `src/components/shared/Nav.tsx`, messages (`nav.signIn`, `nav.mySpace`, `nav.signOut`)

**Interfaces:**
- Consumes: `signOut(locale)` (`auth/actions.ts`), `createClient` navigateur (`src/lib/supabase/client.ts`).
- Produces: `<NavAccount dark?: boolean />`.

- [ ] **Step 1:** `NavAccount` (client) : au montage, `supabase.auth.getUser()` ; écoute `onAuthStateChange`. Non connecté → lien « Se connecter » (`/{l}/auth/login`). Connecté → lien « Mon espace » (`/{l}/dashboard`) + bouton « Déconnexion » (`<form action={signOut.bind(null, locale)}>`). Rien n'est rendu tant que l'état n'est pas connu (pas de clignotement).
- [ ] **Step 2:** L'insérer dans `Nav` à gauche du CTA ; masqué sous `md` dans la barre, mais présent dans le menu mobile s'il existe (sinon garder visible en version compacte).
- [ ] **Step 3:** Vérification manuelle (pile locale) : connexion → « Mon espace » mène au bon espace selon le rôle ; déconnexion → retour accueil, session vidée.
- [ ] **Step 4:** Commit `feat(nav): account menu`.

---

### Task 5: Dépôt de projet avec création de compte

**Files:**
- Modify: `src/lib/validation/project.schema.ts` (+ test), `src/components/forms/ProjectWizard.tsx`, `steps/Project3.tsx`, `steps/Project4.tsx`, `steps/Project5.tsx`, `src/app/[locale]/projets/initier/page.tsx`, `initier/actions.ts`, messages (`wizardClient.*`)

**Interfaces:**
- Consumes: `signUpOutcome` (Task 3), `newProjectAdminEmail` (Task 2).
- Produces: `projectSchemaFor(mode: "guest" | "member")` — en `guest`, ajoute `first_name`, `last_name` (min 1), `password` (min 8) ; `client_name` est dérivé (`first + last`) côté serveur. `submitProject(input, mode)` renvoie `{ error } | { needsConfirmation: true; email } | redirect`.

- [ ] **Step 1: Tests du schéma** — `project.schema.test.ts` : `guest` refuse un mot de passe de 7 caractères ; `member` n'exige pas de mot de passe ; `project_country: ""` est refusé avec le message « Pays du chantier requis » ; un pays africain valide passe.
- [ ] **Step 2:** FAIL → implémenter → PASS.
- [ ] **Step 3: Pays explicite** — `CountrySelectField` reçoit une option vide `placeholder` (« Choisir un pays ») sélectionnée par défaut ; `ProjectWizard` met `project_country` dans `STEP_FIELDS[2]` et `defaultValues.project_country = ""`. Placeholder de localité neutre (« Ville, quartier ou site »). Retirer le texte « Bientôt » codé en dur au profit d'une clé de traduction.
- [ ] **Step 4: Étape 4 « Coordonnées & compte »** — la page passe `member: boolean` (+ prénom/nom/e-mail pré-remplis depuis le profil si connecté). Mode invité : prénom, nom, e-mail, téléphone, mot de passe, et un lien « Déjà un compte ? Se connecter » vers `/{l}/auth/login?next=/{l}/projets/initier`. Mode membre : e-mail en lecture seule, téléphone.
- [ ] **Step 5: Brouillon** — `ProjectWizard` sauvegarde `form.watch()` (sans `password`) dans `sessionStorage["reliote.projectDraft"]` (try/catch) et le restaure au montage ; effacé après envoi réussi.
- [ ] **Step 6: Action** — `submitProject(input, mode)` :
  1. valide avec `projectSchemaFor(mode)` ;
  2. si utilisateur connecté → `userId = user.id` (et refuse si son rôle est `architect` : message dédié) ;
  3. sinon `signUp({ email, password, options: { data: { role: "client", first_name, last_name, locale }, emailRedirectTo: `${SITE_URL}/${l}/auth/callback?next=/${l}/dashboard/client` } })` → `signUpOutcome` : `already_registered` → `{ error: "exists" }` (l'UI affiche le lien de connexion), `error` → message, sinon `userId` ;
  4. insère le projet (clé service) avec `user_id = userId`, `client_name = first + " " + last` (invité) ou profil (membre) ;
  5. matching + `match_results` comme aujourd'hui (top 5) ; projet `matched` si ≥ 1 ;
  6. e-mails : accusé au porteur + `newProjectAdminEmail` à `adminEmail()` ;
  7. `needs_confirmation` → `{ needsConfirmation: true, email }` : l'UI affiche « Projet enregistré — confirmez votre e-mail pour suivre son avancement » ; sinon redirect confirmation.
- [ ] **Step 7:** Vérification sur pile locale : invité → compte + projet liés (`select user_id from client_projects order by created_at desc limit 1` = id du nouvel utilisateur) ; e-mail existant → message + lien, saisie conservée après connexion ; membre → pas de mot de passe demandé.
- [ ] **Step 8:** Commit `feat(project): create the client account with the project`.

---

### Task 6: Formulaire architecte — pays et honoraires

**Files:**
- Modify: `src/lib/validation/architect.schema.ts` (+ test), `src/components/forms/ArchitectWizard.tsx`, `fields/FeeField.tsx`, `fields/PhoneField.tsx`, `steps/Architect2.tsx`

- [ ] **Step 1: Tests** — `architect.schema.test.ts` : `fee_amount: ""` et `fee_currency: ""` ensemble passent (honoraires facultatifs) ; `fee_amount: "48000"` sans devise → erreur rattachée à `fee_currency` ; `country: ""` → erreur « Pays requis ».
- [ ] **Step 2:** FAIL → corriger le schéma (`z.preprocess(v => v === "" || v == null ? undefined : v, z.coerce.number().int().positive().optional())`, `fee_currency` idem) → PASS.
- [ ] **Step 3:** `ArchitectWizard` : `country: ""` par défaut ; `PhoneField` prend `defaultCountry` = iso2 du pays choisi (via `AFRICAN_COUNTRIES`) et se met à jour s'il change ; `FeeField` : devise par défaut = devise du pays (`XOF` / `XAF` / sinon `EUR`), affiche réellement la valeur stockée (plus d'EUR visuel avec champ vide) et rend les erreurs `fee_amount` / `fee_currency`.
- [ ] **Step 4:** Vérification pile locale : étape 5 sans honoraires → passe ; avec montant → devise pré-remplie, envoi OK.
- [ ] **Step 5:** Commit `fix(architect-wizard): no default country, optional fees that validate`.

---

### Task 7: Admin — propositions, multi-proposition, recalcul

**Files:**
- Modify: `src/app/[locale]/admin/projets/actions.ts`, `admin/projets/[id]/page.tsx`, `src/app/api/admin/match/recalculate/route.ts`
- Create: `src/lib/workflow/status.ts` (+ test) — partagé avec Task 8

**Interfaces — Produces:**
- `type ProjectStatus = "new" | "matched" | "selected" | "meeting_proposed" | "meeting_confirmed" | "in_review" | "closed"`
- `projectStatusAfter(event: WorkflowEvent, ctx: { current: ProjectStatus; activeMeetings: number; activeProposals: number }): ProjectStatus`
  avec `WorkflowEvent = "matched" | "proposed" | "meeting_scheduled" | "meeting_confirmed" | "meeting_cancelled" | "meeting_declined" | "meeting_completed" | "closed" | "rematched"`.
  Règles : jamais de retour en arrière depuis `closed` ; `rematched` ne change le statut que s'il est `new`/`matched` ; `meeting_cancelled`/`meeting_declined` → `selected` si `activeMeetings === 0` et `activeProposals > 0`, `matched` si plus aucune proposition, sinon inchangé ; `meeting_completed` → `in_review` ; `closed` → `closed`.
- Actions : `proposeArchitect(formData)` (remplace `selectArchitect`), `withdrawProposal(formData)`, `askClientToChoose(formData)`.

- [ ] **Step 1: Tests** de `projectStatusAfter` couvrant chaque règle ci-dessus, dont : `rematched` depuis `meeting_confirmed` → inchangé ; `meeting_cancelled` avec un autre RDV actif → inchangé ; `closed` puis n'importe quel événement → `closed`.
- [ ] **Step 2:** FAIL → implémenter → PASS.
- [ ] **Step 3: proposeArchitect** — si un engagement existe en `declined`/`cancelled`/`expired` → le repasser `proposed` (reset `engaged_at`, `charter_accepted=false`) ; s'il est `engaged`/`proposed` → ne rien faire ; sinon insérer. Statut projet via `projectStatusAfter("proposed", …)`.
- [ ] **Step 4: withdrawProposal** — engagement `proposed` → `cancelled` ; refusé si un RDV actif (`proposed`/`rescheduled`/`confirmed`) existe pour ce couple.
- [ ] **Step 5: askClientToChoose** — exige ≥ 2 engagements `proposed` sans RDV actif ; envoie `proposalsReadyEmail` au porteur (lien `/{l}/dashboard/client`). Aucune colonne d'état supplémentaire : « en attente du choix du porteur » se déduit de « ≥ 2 propositions et aucun RDV actif ».
- [ ] **Step 6: Recalcul** — ne supprime plus les `match_results` des architectes ayant un engagement `proposed`/`engaged` ; statut via `projectStatusAfter("rematched", …)`.
- [ ] **Step 7: Fiche projet** — par correspondance : « Proposer » / « Retirer la proposition » ; bloc « Propositions en cours » (handle anonyme + nom réel pour l'admin) avec bouton « Demander au porteur de choisir » (si ≥ 2) ; formulaire de RDV seulement pour une proposition sans RDV actif (Task 8 le complète).
- [ ] **Step 8:** Vérification pile locale (admin) : proposer 2 architectes → demander au porteur → l'e-mail est journalisé (`[email] … no-op` en local) ; retirer une proposition ; recalcul sur un projet `meeting_proposed` → statut inchangé, propositions toujours visibles.
- [ ] **Step 9:** Commit `feat(admin): proposals, client choice, safe re-matching`.

---

### Task 8: Admin — cycle de vie des RDV

**Files:**
- Modify: `src/app/[locale]/admin/projets/actions.ts`, `admin/projets/[id]/page.tsx`, `admin/rdv/page.tsx`

**Interfaces:**
- Consumes: `zonedWallTimeToUtc`, `formatMeetingTime`, `TIMEZONE_CHOICES`, `countryTimeZone` (Task 1) ; modèles Task 2 ; `projectStatusAfter` (Task 7).
- Produces: `scheduleMeeting(formData)` (champs `scheduledAt`, `timeZone`, `videoUrl`), `rescheduleMeeting(formData)` (`meetingId`, `scheduledAt`, `timeZone`, `videoUrl`), `setMeetingStatus(formData)` (`completed` | `cancelled`), `closeProject(formData)`.

- [ ] **Step 1:** `scheduleMeeting` : refuse si l'architecte n'a pas d'engagement `proposed`/`engaged` ou si un RDV actif existe déjà pour le projet ; convertit avec `zonedWallTimeToUtc` ; refuse une date passée ; e-mails avec `projectTimeZone`.
- [ ] **Step 2:** `rescheduleMeeting` : RDV `proposed`/`rescheduled`/`confirmed` → nouvelle date, `status = "rescheduled"`, `charter_accepted` conservé ; e-mails `meetingProposedEmail(..., { rescheduled: true })` aux deux parties. (Un RDV confirmé replanifié doit être reconfirmé par le porteur ; la révélation déjà faite reste acquise.)
- [ ] **Step 3:** `setMeetingStatus` : `cancelled` → statut projet via `projectStatusAfter("meeting_cancelled", …)` + `meetingCancelledEmail` aux deux parties ; `completed` (uniquement depuis `confirmed`) → `in_review`.
- [ ] **Step 4:** `closeProject` : depuis `in_review` (ou tout état sauf `closed`, avec confirmation `confirm` dans le formulaire) → `closed` ; annule les RDV encore actifs.
- [ ] **Step 5:** UI : sélecteur de fuseau (défaut `Europe/Paris`) à côté du `datetime-local` ; toutes les heures affichées via `formatMeetingTime` avec le fuseau du pays du chantier ; `/admin/rdv` : actions Replanifier (formulaire repliable), Terminer (si confirmé), Annuler ; bouton « Clôturer le projet » sur la fiche.
- [ ] **Step 6:** Vérification pile locale : planifier le 26/10/2026 à 10:00 Europe/Paris pour un chantier au Sénégal → l'admin, le porteur et l'architecte voient « 09:00 (heure de Dakar) · 10:00 heure de Paris » ; replanifier ; annuler → projet `selected` ; terminer → `in_review` ; clôturer → `closed`.
- [ ] **Step 7:** Commit `feat(admin): full meeting lifecycle with time zones`.

---

### Task 9: Espace porteur

**Files:**
- Modify: `src/app/[locale]/dashboard/client/page.tsx`, `dashboard/client/actions.ts`, `src/components/forms/EngagementCharter.tsx`, `src/components/landing/EngagementGrid.tsx`, `src/app/[locale]/architectes/page.tsx`, `src/app/[locale]/architectes/engager/actions.ts` (supprimé), `src/app/[locale]/projets/[id]/confirmation/page.tsx`, messages (`dashboardClient.*`)

**Interfaces:**
- Consumes: modèles Task 2, `formatMeetingTime`, `countryTimeZone`, `projectStatusAfter`.
- Produces: actions `chooseProposal(formData)` (`projectId`, `architectId`), `declineProposal(formData)`, `respondToMeeting(formData)` (existant, enrichi). `EngagementCharter` prend `onAccept: () => Promise<{ ok: true } | { error: string }>` au lieu d'appeler `submitEngagement`.

- [ ] **Step 1:** Supprimer `architectes/engager/actions.ts` (plus aucune révélation hors RDV) ; `architectes/page.tsx` → `redirect(/{l}/dashboard/client)` ; le lien de la page de confirmation pointe vers `/{l}/dashboard/client`.
- [ ] **Step 2:** `chooseProposal` : vérifie que l'utilisateur possède le projet, que l'engagement est `proposed`, qu'aucun RDV actif n'existe ; passe les autres `proposed` du projet à `declined` ; e-mail `clientChoseAdminEmail`. `declineProposal` : `proposed` → `declined` ; si plus aucune proposition → e-mail admin.
- [ ] **Step 3:** `respondToMeeting` : confirmer → si l'update échoue (erreur du trigger « No active proposal… »), afficher un message au lieu d'échouer en silence (`redirect(?error=...)` lu par la page) ; décliner → statut projet via `projectStatusAfter("meeting_declined", …)` + `meetingDeclinedAdminEmail`.
- [ ] **Step 4:** Page (entièrement traduite) :
  - **Projets** : type traduit, pays, statut traduit (libellé lisible par statut), date.
  - **Propositions** (≥ 2 `proposed`, aucun RDV actif) : cartes anonymes (`ArchitectAnonCard` : handle, expérience en tranche, région, spécialités, langues, diplôme) avec « Choisir » / « Décliner ».
  - **Rendez-vous** : heure via `formatMeetingTime`, lien visio ; `proposed`/`rescheduled` → « Confirmer » ouvre `EngagementCharter` (articles de la charte + case) dont `onAccept` appelle `respondToMeeting(confirm)` ; « Décliner ».
  - **Votre architecte** (engagement `engaged`) : nom, structure, ville/pays, photo, e-mail, téléphone, adresse relais `client_relay` si présente.
- [ ] **Step 5:** Vérification pile locale du parcours porteur complet : dépôt → admin propose 2 → choix → RDV proposé → confirmation avec charte → carte architecte révélée ; et la variante décliner.
- [ ] **Step 6:** Commit `feat(client): proposals, choice, meetings and reveal in the client space`.

---

### Task 10: Espace architecte

**Files:**
- Modify: `src/app/[locale]/dashboard/architecte/page.tsx`, messages (`dashboardArchitect.*`)

- [ ] **Step 1:** Projets entrants (clé service, inchangé pour la lecture) : type, pays, localité, budget, échéance, description, score `/ MAX_SCORE` ; **aucune identité** (nom, e-mail, téléphone) tant que l'engagement n'est pas `engaged`. Après `engaged` : nom, e-mail, téléphone du porteur + `architect_relay`.
- [ ] **Step 2:** Section **Rendez-vous** : RDV de l'architecte (`meetings.architect_id`), heure via `formatMeetingTime` (fuseau du pays du chantier), statut traduit, lien visio.
- [ ] **Step 3:** Statut du dossier traduit et expliqué (`pending` → « en cours de vérification », `rejected`, `paused`).
- [ ] **Step 4:** Test d'interface minimal via vérification pile locale : avant RDV confirmé, la page ne contient ni l'e-mail ni le téléphone du porteur (rechercher la chaîne dans le HTML rendu) ; après, oui.
- [ ] **Step 5:** Commit `feat(architect): meetings, identity hidden until confirmed`.

---

### Task 11: Admin — vérification des architectes

**Files:**
- Create: `src/app/[locale]/admin/architectes/[id]/page.tsx`
- Modify: `admin/architectes/page.tsx`, `admin/architectes/actions.ts`, `src/app/[locale]/architectes/rejoindre/actions.ts`

- [ ] **Step 1:** Liste : filtre par statut (`?status=`), lien « Dossier → » par ligne, pays affiché.
- [ ] **Step 2:** Fiche `[id]` : photo, identité, structure, e-mail, téléphone, pays/ville, numéro d'ordre, diplôme, années, spécialités, types, langues, honoraires, portfolio (lien externe `rel="noopener noreferrer"`), description, charte signée (version + date), date de dépôt ; boutons Valider / Refuser / Pause.
- [ ] **Step 3:** `setArchitectStatus` envoie `architectStatusEmail` (langue du profil) quand le statut change vers `verified`/`rejected`/`paused`. `submitArchitect` envoie `architectApplicationReceivedEmail` à l'architecte et un e-mail admin.
- [ ] **Step 4:** Commit `feat(admin): architect verification view and status emails`.

---

### Task 12: Admin — matches lisibles et vue d'ensemble

**Files:**
- Modify: `src/app/[locale]/admin/matches/page.tsx`, `src/app/[locale]/admin/page.tsx`

- [ ] **Step 1:** `/admin/matches` : `describeReasons` au lieu de `kind (+weight)` ; corriger l'erreur lint `react-hooks/set-state-in-effect` (`matches/page.tsx:41`).
- [ ] **Step 2:** Vue d'ensemble : compteurs architectes par statut, projets par statut (7 statuts), RDV à venir (7 jours), « à traiter » : architectes `pending`, projets `matched` sans proposition, porteurs en attente de choix, RDV déclinés.
- [ ] **Step 3:** Commit `feat(admin): readable matches, actionable overview`.

---

### Task 13: Vérification de bout en bout et livraison

- [ ] **Step 1:** `npx tsc --noEmit`, `npx vitest run`, `npm run lint` (corriger les 2 erreurs restantes dans `src/` : `EngagementCharter.tsx:43` si toujours présente, exclure `_design-reference/**` et `scripts/gen-landing-css.cjs` du lint), `npm run build`.
- [ ] **Step 2:** Parcours complet dans le navigateur sur la pile locale, en FR puis EN, sur 1440 px et 375 px : porteur invité → admin (vérifie un architecte, propose 2, demande le choix) → porteur choisit → admin planifie → architecte voit le RDV sans identité → porteur confirme + charte → les deux voient l'identité → admin termine puis clôture. Variante : déclin + replanification. Mot de passe oublié → reset → connexion.
- [ ] **Step 3:** Revue complète de la branche (agent de revue) ; corriger les points bloquants.
- [ ] **Step 4:** Commit final, push, contrôler le déploiement Vercel (en-têtes + routes clés).

---

## Hors périmètre (noté pour la suite)

- Édition du profil par l'architecte (retour en vérification ? à décider en phase « fonctionnalités »).
- Rappel automatique avant RDV (nécessite une tâche planifiée).
- Transfert réel des adresses relais (service d'e-mail entrant).
- Landing : chiffres inventés, restes Paris/Abidjan, carte en double — phase « crédibilité ».
- SMTP, domaine, plan Supabase — phase production.
