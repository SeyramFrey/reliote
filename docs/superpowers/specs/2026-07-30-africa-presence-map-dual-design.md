# Carte de présence Afrique — spike comparatif (Version A / Version B)

**Date:** 2026-07-30
**Ancre:** `#territoire` (bloc landing, `src/components/landing/`)
**Statut:** spec approuvée — implémentation double, choix après visualisation navigateur.

## Objectif

Remplacer la carte décorative « corridor Monde ⇄ Afrique » (`MapTerritoire.tsx`, SVG
purement esthétique) par une **vraie carte du continent africain** qui met en évidence
les pays où Reliote a **déjà des architectes vérifiés**.

Donnée réelle (vérifiée via MCP `supabase-reliote`) : **8 architectes vérifiés, tous en
Côte d'Ivoire** → **1 seul pays allumé** au lancement. Le rendu doit être propre avec un
seul pays (et gérer 0 et N proprement).

## Approche : double implémentation à comparer

On construit **les deux rendus de carte** et on les **empile dans la page**, chacun dans un
bloc labellisé « VERSION A » / « VERSION B », **avec le même panneau droit refait (vraies
données)** pour ne comparer que la carte. Après visualisation, l'utilisateur tranche ; on
**supprime la version non retenue** (composant + artefact géométrique + dépendance) avant le
merge (voir § Cleanup).

- **Version A — SVG inline (zéro dépendance).** Un `<path data-iso2>` par pays dans un seul
  `<svg viewBox>`. Géométrie pré-générée depuis Natural Earth, committée en statique
  (`src/lib/countries/africaGeo.ts`, cible **< 80 KB**). Contrôle total du style laiton/vert,
  aucun risque de compat avec ce Next 16 / React 19 custom.
- **Version B — MapLibre GL JS (`maplibre-gl` v6).** Carte WebGL vectorielle montée
  impérativement (`useEffect` + `ref`) dans un composant client. **Aucune tuile externe,
  aucune clé API** : style offline (background + source GeoJSON locale + couche `fill` colorée
  par expression data-driven sur `iso2`). `maplibre-gl` n'a **aucune peer-dependency React** →
  compatible React 19. (react-simple-maps stable 3.0.0 plafonne à React 18 → écarté ;
  react-map-gl envisageable comme wrapper mais ajoute une couche — on prend MapLibre direct.)

## Données & confidentialité (identique aux deux versions)

Modèle de révélation progressive : **jamais** de ligne architecte individuelle côté client.

- `MapTerritoire.tsx` devient un **composant serveur async** qui, via `createServiceClient()`
  (bypass RLS, `SERVICE_ROLE_KEY` server-only), sélectionne **uniquement** la colonne
  `country` sur `architect_profiles` où `status = 'verified'`.
- Agrégation en mémoire → **comptes uniquement**. Aucune donnée nominative ne traverse.
- Payload passé aux vues :
  `{ lit: { iso2, name, count }[]; totalCountries: number; totalArchitects: number }`.

### Mapping `country` → `iso2`

`architect_profiles.country` stocke le **nom français** (`"Côte d'Ivoire"`), identique au champ
`name` de `src/lib/countries/africa.ts`. Match sur `name` exact, fallback normalisé
(trim + casefold + suppression d'accents) pour robustesse. Pays inconnu → ignoré silencieusement.

### Logique agrégation (pure, testée)

Extraite dans `src/lib/countries/presence.ts` :

```ts
export type PresenceRow = { country: string | null };
export type Presence = {
  lit: { iso2: string; name: string; count: number }[];
  totalCountries: number;
  totalArchitects: number;
};
export function aggregatePresence(rows: PresenceRow[]): Presence;
```

`lit` trié par `count` desc puis `name` (fr). Tests vitest : cas nominal (CI ×8), plusieurs
pays, pays inconnu ignoré, liste vide → totaux 0.

## Géométrie (générée une fois, script jetable)

Script scratchpad (npx, **rien ajouté à `package.json`** pour la génération) :
1. Fetch Natural Earth **110m admin_0** GeoJSON (contient `ISO_A2_EH`, noms) depuis CDN.
2. Filtrer aux 54 `iso2` de `africa.ts`. Vérifier chaque match ; corriger à la main tout
   `ISO_A2 = "-99"` éventuel.
3. Simplifier (résolution 110m suffit pour un locator), **arrondir les coords** (1 déc. en
   espace projeté pour A) pour tenir le budget de taille.
4. Émettre deux artefacts depuis la **même** source :
   - **Version A** → `src/lib/countries/africaGeo.ts` :
     `export const AFRICA_VIEWBOX = "0 0 W H"` +
     `export const AFRICA_GEO: { iso2: string; d: string; cx: number; cy: number }[]`
     (`d` = path projeté dans le viewBox ; `cx/cy` = centroïde projeté pour placer le label).
     Projection : d3-geo `geoMercator().fitSize([W,H], africaFeatureCollection)`. **Cible < 80 KB.**
   - **Version B** → `src/lib/countries/africa.features.json` : `FeatureCollection` en lon/lat,
     chaque feature `properties: { iso2 }` (MapLibre projette lui-même). Simplifiée de même.

Fallback si CDN/npx indisponible : extraire les paths d'un SVG Afrique domaine public keyé par ISO.

## Rendu carte

### Version A — `MapAfricaSvg.tsx` (`"use client"`)
- Un `<path data-iso2>` par pays depuis `AFRICA_GEO`.
- **Allumé** (iso2 ∈ `lit`) : `fill` laiton (`--accent-brass`) + halo doux. **Éteint** : contour
  `--paper` très faible sur fond `--water`.
- Label/épingle au centroïde (`cx/cy`) de chaque pays allumé, réutilisant le motif `.t-pin`
  existant : nom + compte. Tooltip au survol : « N architectes vérifiés » (pluriel ICU).

### Version B — `MapAfricaMaplibre.tsx` (`"use client"`)
- `maplibre-gl` importé **dynamiquement dans `useEffect`** (évite tout accès `window`/WebGL en
  SSR). CSS `maplibre-gl/dist/maplibre-gl.css` importé en tête du composant client.
- Style offline : `{ version: 8, sources: {}, layers: [background] }` + source GeoJSON locale +
  couche `fill` + couche `line`. `fill-color` via expression (`match`/`case` sur `iso2`, liste
  `lit` injectée) : allumés laiton, éteints faible. `map.fitBounds(bboxAfrique)`, interactions
  légères (drag/zoom optionnels), pas de contrôle par défaut sauf attribution.
- Popup MapLibre au survol/clic d'un pays allumé : nom + « N architectes vérifiés ».
- ⚠️ Consulter `node_modules/next/dist/docs/` (client components, dynamic import, import CSS)
  avant de coder — ce Next est custom (cf. AGENTS.md).

## Panneau droit refait — `PresencePanel.tsx` (partagé, vraies données)

Composant présentation pur (rendu serveur ou client), **identique** pour A et B :
- **Présence** : stat « **X pays · Y architectes vérifiés** » + légende (pastille laiton = pays
  avec architectes ; pastille faible = 54 pays éligibles).
- **Pays actifs** : liste réelle des pays allumés + compte (`Côte d'Ivoire · 8`), remplace le
  faux feed « corridor en direct ».
- **Meter** : honnête **X / 54** (« Pays avec architectes »), barre = X/54 (≈ 1/54 aujourd'hui),
  remplace le faux « 54 pays couverts / 100% ».

## Layout du spike (page)

Deux blocs `.territoire-sect` empilés, chacun avec un badge « VERSION A — SVG inline » /
« VERSION B — MapLibre GL » (labels dev, non traduits, retirés au cleanup). Grille
`.territoire-frame` (8fr carte / 4fr panneau) réutilisée. Ancre `#territoire` sur le conteneur.

## i18n (`landing.territoire`, fr + en)

Retirer **toute** copie fictive / spécifique à une ville (`Paris → Abidjan`, `Dakar`, `Accra`,
`Atelier Faïdhèrbe`, `offices`, `feed`, `84 studios`, `54 pays couverts`, `liveCorridor`…) —
règle pan-africaine. Ajouter : `legendLit`, `legendEligible`, `presence`, `activeCountries`,
`statCountries`, `statArchitects`, `meterLabel`, `tooltipArchitects` (pluriel ICU), état vide
`soon`. Titre/kicker recentrés « présence / couverture » (plus « corridor route »). Les noms de
pays allumés viennent de la donnée réelle, pas de copie codée en dur.

## Styles (`landing.css`)

Réutiliser `.territoire-*`, `.t-pin`, `.t-panel`, `.t-feed`, `.t-meter`. Ajouter : styles des
`<path>` pays (allumé/éteint/hover, Version A), badge « VERSION x », conteneur MapLibre
(hauteur via `aspect-ratio` du `.territoire-map`), overrides sobres du popup MapLibre pour
coller au fond sombre/laiton.

## Cleanup (après le choix)

- **Si A retenue** : supprimer `MapAfricaMaplibre.tsx`, `africa.features.json`,
  `npm uninstall maplibre-gl`, retirer l'import CSS MapLibre.
- **Si B retenue** : supprimer `MapAfricaSvg.tsx`, `africaGeo.ts`.
- Dans les deux cas : retirer les badges « VERSION x », collapse `MapTerritoire.tsx` sur une
  seule carte + un seul `PresencePanel`, renommer proprement.

## Fichiers

**Nouveaux :** `src/lib/countries/presence.ts` (+ `presence.test.ts`),
`src/lib/countries/africaGeo.ts` (A), `src/lib/countries/africa.features.json` (B),
`src/components/landing/MapAfricaSvg.tsx` (A), `src/components/landing/MapAfricaMaplibre.tsx` (B),
`src/components/landing/PresencePanel.tsx` (partagé).
**Modifiés :** `MapTerritoire.tsx` (serveur async, rend A + B), `src/messages/fr.json`,
`src/messages/en.json`, `src/styles/landing.css`, `package.json` (+`maplibre-gl` temporaire).
**Inchangé :** `src/app/[locale]/page.tsx`. **Aucune migration DB** (lecture seule).

## Vérification

`npx tsc --noEmit` · `npx eslint <fichiers touchés>` · `npx vitest run` (couvre `presence.ts`) ·
preview navigateur (dev server) → screenshot des deux blocs + check console. Confirmer que
`africaGeo.ts` < 80 KB.

## Notes d'implémentation (spike réalisé — 2026-07-30)

- `africaGeo.ts` généré = **27 KB** (viewBox `0 0 680 649`, 49 polygones + 5 points îles). OK.
- **MapLibre épinglé `maplibre-gl@^4.7`.** La v6 (dernière) livre un Web Worker GeoJSON qui
  ne répond **jamais** sous Next 16 / Turbopack dev (`isSourceLoaded` reste `false`, aucune
  erreur émise → la carte ne s'affiche pas). La v4 fonctionne. Si B est retenue, valider aussi
  en build de prod avant de conclure.
- Version B : la couche `circle` MapLibre dessine un point à **chaque sommet** de toute
  géométrie → il faut `filter: ["==", ["geometry-type"], "Point"]` pour ne garder que les îles.
- Version A ne dépend ni de WebGL ni d'un worker → rend même quand l'onglet n'est pas composité.
- **Décision en attente** : l'utilisateur garde les DEUX versions empilées pour l'instant
  (choix reporté). Cleanup (§ ci-dessus) à exécuter une fois A ou B tranchée.
- Vérifs au vert : `tsc` 0 · `eslint` 0 · `vitest` 49/49.
