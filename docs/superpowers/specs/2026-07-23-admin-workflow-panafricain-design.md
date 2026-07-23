# Reliote — Admin, Workflow RDV & Pivot pan-africain — Design Specification

**Date :** 2026-07-23
**Owner :** Fabrice Geoffrey (fabricegeoffrey@gmail.com)
**Status :** En attente de relecture

---

## 1. Contexte & évolution

Deux évolutions majeures par rapport au MVP :

1. **Pivot géographique.** Reliote ne relie plus « clients France ↔ architectes Côte d'Ivoire ».
   Le modèle devient : **architectes africains** (tout le continent) ↔ **porteurs de projet du monde entier**.
   Le **chantier est toujours situé dans un pays africain** ; le client (diaspora, investisseur, particulier)
   peut être n'importe où. L'architecte opère dans le pays du chantier.

2. **Parcours piloté par l'admin.** Le cœur de cette itération est la partie Admin, qui orchestre :
   les demandes des porteurs de projet, la sélection des architectes, l'organisation des rendez-vous,
   et la gestion du contenu éditorial du site (projets mis en lumière, médias/journal).

Ce qui existe déjà et qu'on **réutilise** (ne pas réinventer) :
- Algorithme de matching déterministe explicable (`src/lib/matching/score.ts`).
- Système de révélation progressive : vue anonymisée `architect_profiles_anon` (Niveau 2),
  table `client_engagements` + charte de non-contournement (Niveau 3), relais d'adresses.
- Zone admin embryonnaire (`/admin` : vue d'ensemble, architectes, projets, matches).
- Bibliothèque des 54 pays africains (`src/lib/countries/africa.ts`) + `CountrySelectField`.

## 2. Périmètre

### Inclus (5 blocs)

- **A. Pivot géographique** — ouvrir tous les pays africains ; select pays sur le formulaire projet ;
  `ordre_number` obligatoire pour tous les architectes ; poids « pays » dans le matching.
- **B. Workflow demande → sélection → RDV** — matching auto à la soumission, sélection admin,
  organisation du rendez-vous (créneau + lien visio), notifications e-mail, confirmation + charte,
  révélation des identités via la mécanique existante.
- **C. UI Admin** — fiche projet détaillée, onglet RDV, garde-fou de sécurité `role = admin`.
- **D. Gestion de contenu** — CRUD admin (base de données + Supabase Storage) pour les
  **projets mis en lumière** (`FeaturedCase`) et les **médias/journal** (`Journal`).
- **E. Transversal** — migrations idempotentes, RLS des nouvelles tables, e-mails transactionnels.

### Hors périmètre (plus tard)

- Matching par IA (l'algorithme déterministe suffit ; l'admin tranche de toute façon).
- Intégration d'un outil de réservation type Cal.com/Calendly (l'admin propose un créneau à la main).
- Messagerie interne temps réel (les relais e-mail existants suffisent au démarrage).
- Paiements.
- Système de disponibilités/calendrier maison.

## 3. Décisions d'architecture

| Décision | Choix | Rationale |
|---|---|---|
| Matching | Algorithme déterministe amélioré (pas d'IA) | Gratuit, instantané, explicable ; peu d'architectes au départ ; l'admin décide. |
| Déclenchement matching | **Automatique à la soumission** du projet | L'admin voit les propositions immédiatement ; recalcul manuel conservé en secours. |
| Mécanique RDV | Admin saisit **1 créneau + lien visio** | Zéro dépendance externe ; simple formulaire + e-mail ; adapté au faible volume initial. |
| Révélation | Le **meeting = la révélation** ; charte acceptée à la confirmation du RDV | Réutilise `client_engagements` + charte ; parcours client minimal. |
| Sélection architecte | Admin choisit **1** architecte par défaut ; **fallback multi-proposition** | Cf. bloc B. Réutilise `client_engagements (status='proposed')` + vue anonymisée. |
| E-mail | **Resend** | Standard avec Next.js. ⚠️ compte + clé API à ajouter dans l'`.env`. |
| Numéro d'ordre | **Obligatoire pour tous les pays** | Chaque pays a son ordre des architectes ; gage de confiance uniforme. |
| Pays ouverts | **Les 54** en `available: true` | Cohérent avec le positionnement pan-africain ; le flag reste dispo au cas par cas. |
| Contenu éditorial | Tables DB + Supabase Storage, lecture publique / écriture admin | Autonomie de l'admin sans toucher au code. |

## 4. Bloc A — Pivot géographique

### 4.1 `src/lib/countries/africa.ts`
- Tous les pays passent `available: true`.
- Le mécanisme « Bientôt » (`available: false`) reste dans le code pour désactiver un pays au cas par cas.

### 4.2 Formulaire projet (`ProjectWizard`, étapes `Project*`)
- Le lieu du chantier, aujourd'hui **texte libre** (`client_projects.project_location`), devient :
  - **`project_country`** (nouveau) : select pays africains (réutilise `CountrySelectField`, à généraliser
    hors du namespace `wizardArchitect` — cf. note i18n).
  - **`project_location`** : conservé pour la **ville / localité / site précis** (texte libre).
- Validation Zod (`src/lib/validation/project.schema.ts`) : `project_country` requis, valeur ∈ pays africains actifs.

### 4.3 Formulaire architecte (`ArchitectWizard`)
- Le select pays existe déjà ; retirer le défaut « Côte d'Ivoire », tous pays sélectionnables.
- **`ordre_number` devient requis** (champ, validation, schéma). Libellé générique :
  « Numéro d'ordre national des architectes ».

### 4.4 Matching (`src/lib/matching/score.ts`)
- Nouveau critère **`country`** : `project.project_country === architect.country` → **+25**.
- Rétrograder le critère ville (`location`) de **10 → 5**.
- Nouveau barème (MAX = 110) : spécialités 30 · **pays 25** · type 20 · disponibilité 15 · expérience 10 · ville 5 · note 5.
- Ajouter `country` à `ProjectForMatch` / `ArchitectForMatch` et à la requête de `recalculate`.
- Mettre à jour `score.test.ts` et l'affichage des pourcentages (`/90` → `/110`).

## 5. Bloc B — Workflow demande → sélection → RDV

### 5.1 Parcours nominal (1 architecte)

```
1. Porteur soumet le projet (pays + ville du chantier).
2. Matching auto → top-3 (avec poids pays) persisté dans match_results ; projet → 'matched'.
3. Admin ouvre la fiche projet → voit le top-3 + justifications lisibles.
4. Admin choisit 1 architecte → client_engagement (status='proposed') ; projet → 'selected'.
5. Admin planifie le RDV : date/heure + lien visio → meeting (status='proposed') ;
   projet → 'meeting_proposed' ; e-mails aux 3 parties.
6. Porteur ouvre le lien → confirme + accepte la charte.
   → meeting.status='confirmed', meeting.charter_accepted=true
   → client_engagement.status='engaged' (trigger existant : relais générés + identités révélées)
   → projet → 'meeting_confirmed'.
7. Après le meeting : admin marque 'completed' → projet 'in_review' puis 'closed'.
```

### 5.2 Parcours de secours (multi-proposition)

Si le premier architecte ne convient pas (décline, ou le porteur n'est pas convaincu) :
- L'admin **propose plusieurs architectes** → une ligne `client_engagement (status='proposed')` par architecte.
- Le porteur les voit **anonymisés** via la vue `architect_profiles_anon` (déjà en place) dans son dashboard.
- Il en **choisit un** → charte → `engaged` → révélation.
- Le RDV est ensuite planifié pour l'architecte retenu (même table `meetings`).

> Le modèle de données ne change pas entre les deux parcours : `meetings` porte toujours l'architecte
> finalement retenu ; `client_engagements` porte l'état `proposed`/`engaged`.

### 5.3 Nouvelle table `meetings`

| Colonne | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `project_id` | uuid FK → client_projects | |
| `architect_id` | uuid FK → architect_profiles | |
| `scheduled_at` | timestamptz | créneau proposé |
| `video_url` | text | lien visio (Meet/Zoom) |
| `status` | enum `meeting_status` | proposed / confirmed / declined / rescheduled / completed / cancelled |
| `charter_accepted` | boolean default false | accepté à la confirmation |
| `proposed_by` | uuid | admin qui a planifié |
| `notes` | text | |
| `created_at` / `updated_at` | timestamptz | |

- Trigger : quand `meetings.status → 'confirmed'` **et** `charter_accepted = true`,
  passer le `client_engagement` correspondant `(project_id, architect_id)` à `engaged`
  (ce qui déclenche à son tour le trigger existant de génération des relais + ouverture RLS).

### 5.4 Statuts projet étendus

`project_status` : `new → matched → selected → meeting_proposed → meeting_confirmed → in_review → closed`
(ajouter `selected`, `meeting_proposed`, `meeting_confirmed` à l'enum).

## 6. Bloc — E-mails (Resend)

- Fournisseur **Resend** ; clé API dans `.env` (`RESEND_API_KEY`), expéditeur vérifié (domaine Reliote).
- Helper `src/lib/email/` (client + templates), envoi depuis les server actions / route handlers.
- E-mails transactionnels **bilingues (fr/en)** selon le `locale` du destinataire :
  1. Accusé de réception du projet (au porteur).
  2. Proposition de RDV (au porteur + à l'architecte ; admin en copie).
  3. Confirmation de RDV (aux 3 parties).
  4. (Optionnel) Rappel avant le RDV.
- Templates React Email ou HTML simple, dans le ton éditorial de la marque.

## 7. Bloc C — UI Admin

- **Onglets** (`AdminShell`) : Vue d'ensemble · Architectes · **Projets** · **RDV** · **Médias** · **Mis en lumière**.
- **Fiche projet** (`/admin/projets/[id]`, nouveau) :
  - Détail du brief + pays/ville du chantier.
  - Top-3 architectes avec justifications lisibles (traduire les `reasons` en phrases, pas `kind (+30)`).
  - Bouton « Choisir cet architecte » (→ `proposed`) ou « Proposer plusieurs ».
  - Formulaire de planification RDV (date/heure + lien visio).
- **Onglet RDV** (`/admin/rdv`, nouveau) : liste des meetings + statut + actions (confirmer/replanifier/annuler/terminer).
- 🔒 **Correctif sécurité — garde-fou admin.** Aujourd'hui les pages `/admin/*` lisent via `service_role`
  **sans vérifier le rôle** de l'utilisateur (seule `/api/admin/match/recalculate` le fait).
  Ajouter la vérification `profiles.role = 'admin'` dans `src/app/[locale]/admin/layout.tsx`
  (redirection sinon). À corriger dans cette itération.

## 8. Bloc D — Gestion de contenu

**Bilinguisme du contenu.** Décision : **colonnes bilingues suffixées `_fr` / `_en`** pour les textes
(cohérent avec la landing fr/en, et plus simple qu'une ligne par locale). Le rendu choisit la colonne
selon le `locale` courant.

### 8.1 Table `featured_projects` (projets mis en lumière → `FeaturedCase`)
Champs : `id`, `title_fr`/`title_en`, `location`, `coordinates`, `slides` (images), `stats` (jsonb),
`hotspots` (jsonb : bilingue), `quote_fr`/`quote_en`, `cite`, `rows` (jsonb : client/arch/programme/site/durée/budget, bilingue),
`published` (bool), `sort_order` (int), `created_at`.

### 8.2 Table `media_items` (médias/journal → `Journal`)
Champs : `id`, `title_fr`/`title_en`, `excerpt_fr`/`excerpt_en`, `image_url`, `read_time`, `date`, `url`,
`published` (bool), `sort_order` (int), `created_at`.

### 8.3 Storage
- Bucket Supabase Storage pour les images (réutiliser le pattern de `0006_storage_architect_photos.sql`).

### 8.4 UI + rendu
- Onglets admin CRUD : créer / éditer / réordonner (`sort_order`) / publier (`published`).
- `FeaturedCase` et `Journal` lisent la base ; **fallback** sur le contenu actuel (i18n) si la table est vide,
  pour ne pas casser la landing pendant la transition.

## 9. Récapitulatif des migrations (idempotentes, suite de `0008`)

- `0009_geo_panafrican.sql` — `client_projects.project_country` ; `ordre_number` NOT NULL
  (retirer `architect_ordre_required_for_ci`) ; enum `project_status` étendu.
- `0010_meetings.sql` — enum `meeting_status`, table `meetings`, triggers, RLS.
- `0011_content_management.sql` — `featured_projects`, `media_items`, RLS, bucket Storage.
- `africa.ts` : `available: true` partout (code, pas migration).

## 10. RLS & sécurité

- `meetings` : lecture par l'admin, l'architecte concerné et le porteur du projet ; écriture admin
  (le porteur peut passer à `confirmed` pour son propre meeting).
- `featured_projects` / `media_items` : **lecture publique** (`anon` + `authenticated`), **écriture admin** (`is_admin()`).
- Garde-fou `role = admin` dans le layout admin (cf. §7).
- Aucune donnée sensible exposée : le porteur ne voit l'identité de l'architecte qu'après `engaged` (inchangé).

## 11. Points tranchés

1. `ordre_number` **obligatoire pour tous** les pays.
2. E-mail via **Resend**.
3. Admin choisit **1** architecte par défaut ; **multi-proposition** possible en secours (réutilise l'existant).
4. Tous les pays africains **ouverts**.
5. Construction **toujours en Afrique** ; clients du monde entier.
6. Matching : **algorithme amélioré** (poids pays), pas d'IA.
7. RDV : admin **propose 1 créneau + lien visio**.
8. Meeting = **révélation** ; charte à la confirmation.

## 12. Note i18n

Le `CountrySelectField` utilise aujourd'hui le namespace `wizardArchitect`. Le généraliser (prop de
namespace ou clés partagées) pour le réutiliser sur le formulaire projet sans dupliquer le composant.

## 13. Ordre de mise en œuvre suggéré

1. Bloc A (géo + matching) — fondation, contenu et testable isolément.
2. Correctif sécurité admin (§7) — rapide, à faire tôt.
3. Bloc B (workflow RDV) — le cœur : table `meetings`, statuts, sélection, e-mails Resend.
4. Bloc C (UI admin : fiche projet + onglet RDV).
5. Bloc D (gestion de contenu) — indépendant, en dernier.
