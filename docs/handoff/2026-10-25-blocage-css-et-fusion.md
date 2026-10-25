# Reprise — débloquer le LCP, puis fusionner `feat/intro-sequence`

État au 2026-10-25. Branche `feat/intro-sequence`, 18 commits, arbre propre,
rien de fusionné. 267 tests au vert, lint, types et build de production propres.

---

## Ce qui est en place

**Séquence d'ouverture** (`src/components/landing/intro/`, `src/lib/intro/`) —
8,15 s : deux crochets du monogramme en spirale métal → verrouillage en logo →
ELIOTE s'écrit → plan d'architecte → la landing grandit depuis le fond. Épinglée
par-dessus la page réelle, qui est peinte normalement dessous.
Cadrage : `docs/superpowers/specs/2026-10-24-sequence-ouverture-design.md`.
Plan : `docs/superpowers/plans/2026-10-24-sequence-ouverture.md`.

**Elle est livrée ÉTEINTE** — `IntroGate.tsx` exige `NEXT_PUBLIC_INTRO === "1"`.
`?intro=1` la force quel que soit l'environnement. Une fois par onglet
(`sessionStorage`).

**Piliers** (`Pillars.tsx`) — section épinglée, un principe à l'écran, les
voisins à `blur(4px)` / opacité 0,5. Arc de numéros à gauche, le courant à
mi-hauteur. D'après orionix.framer.website.

**Anneau de partenaires** (`PartnersOrbit.tsx`) — ellipse inclinée de 14,5°,
aplatie à 0,46, un tour en 19 s. Échelle 0,70→1,00, opacité 0,10→1,00, et le
z-index bascule à mi-course : la moitié proche passe devant le titre.
**Les 14 pastilles sont vides**, elles attendent de vrais logos. D'après la
section `.uod` de kononenkogroup.com.

---

## 1. La tâche : le blocage CSS et fontes

### Le chiffre qui bloque

Mesuré le 2026-10-24 sur un build de production, `/fr`, mobile bridé
(**4× CPU, Slow 4G, 412×915**) :

| | LCP |
|---|---|
| avec l'intro | **2 581 ms** |
| sans l'intro | **2 367 ms** |
| seuil fixé par le plan | 2 500 ms |

Non bridé : 514 ms avec, 407 ms sans. CLS 0,00 partout.

**L'intro n'est pas le problème** : elle n'ajoute que ~214 ms, et son chunk
Three.js (149 Ko gzip, chargé à la demande) tient largement sous le budget de
220 Ko. La landing était déjà à 2 367 ms toute seule. Le décomposé LCP donne
218 ms de TTFB pour **2 363 ms de render delay**.

### Les deux pistes, chiffrées par l'outil

- **RenderBlocking** : ~2 438 ms récupérables sur FCP et LCP.
- **FontDisplay** : ~1 545 ms récupérables sur FCP.

### Suspects à vérifier en premier

1. **La feuille Adobe Typekit** — `src/app/adobe-fonts.tsx`, kit `aya2svh`,
   `https://use.typekit.net/aya2svh.css`. Feuille externe et bloquante : c'est
   le candidat le plus probable pour les deux insights à la fois.
2. **TT Ramillas** — `src/app/fonts.ts`, `next/font/local`. Vérifier l'option
   `display` des `@font-face` générées.
3. La page est dynamique (`src/app/[locale]/page.tsx` fait deux requêtes
   Supabase par visite, pas de cache de page) — ça pèse sur le TTFB, pas sur le
   render delay, mais c'est bon à avoir en tête.

### Objectif

LCP **≤ 2 500 ms** en mobile bridé, sans l'intro **et** avec. Une fois atteint,
l'intro peut être rallumée par défaut (basculer `IntroGate.tsx` sur
`!== "0"`, et retirer le commentaire qui explique pourquoi elle était éteinte).

### Comment mesurer (reproduire exactement)

```bash
NEXT_DIST_DIR=.next-build npx next build
NEXT_PUBLIC_INTRO=1 NEXT_DIST_DIR=.next-build npx next start -p 3002
```

Puis, avec les outils chrome-devtools : `emulate` en `cpuThrottlingRate: 4`,
`networkConditions: "Slow 4G"`, `viewport: "412x915x2.6,mobile,touch"`, puis
`performance_start_trace` avec `reload: true` et `ignoreCache: true`.

`next.config.ts` accepte `NEXT_DIST_DIR` pour builder à côté d'un serveur de
dév sans écraser son `.next`.

---

## 2. Ensuite : fusionner dans `main`

La branche s'appelle `feat/intro-sequence` mais couvre deux chantiers (la
séquence d'ouverture **et** les deux animations de la landing). À renommer ou à
découper avant de fusionner, au choix.

Avant de fusionner : `npm test && npm run lint && npx next build`.

---

## Pièges rencontrés — ne pas les repayer

- **Le panneau navigateur de l'app rend des captures fausses** : page réduite
  dans un coin, ou entièrement vide, alors que le DOM est correct. Vérifié trois
  fois. Pour juger un rendu, passer par les outils **chrome-devtools**, qui eux
  rendent juste. Et `requestAnimationFrame` ne se déclenche **jamais** dans une
  page en arrière-plan (mesuré : 0 image en 45 s) — toute animation paraît
  figée si la session n'est pas ouverte dans une fenêtre.
- **Ne jamais supprimer `.next-build` pendant qu'un serveur le sert** : il
  continue de répondre en servant une page sans aucun CSS. C'est arrivé, et ça
  ressemble à un bug du site.
- **Un serveur de dév qui tourne depuis des heures finit par perdre ses chunks
  CSS** sous Turbopack (`No link element found for chunk`). Symptôme : tout le
  texte devient noir, y compris le titre de la hero, parce que les tokens
  `--color-*` deviennent vides. Redémarrer, ce n'est pas le code.
- **Fast Refresh ne réexécute pas l'effet de la scène 3D** (canvas impératif) :
  recharger la page, sinon on juge du code périmé.
- Le site utilise **Lenis** : `window.scrollTo` ne pilote pas le défilement
  lissé sur les sites qui l'emploient.
- **`@property --i` doit être `inherits: true`** : le point doré de l'arc des
  piliers est un enfant qui lit `--i` ; sans héritage il repartait à 0 et
  restait invisible, alors que l'opacité du parent, elle, marchait.
- **`ssr: false` avec `next/dynamic` n'est autorisé que dans un Client
  Component.** `next/script` en `beforeInteractive` ne bloque pas l'hydratation.
- `AGENTS.md` impose de lire `node_modules/next/dist/docs/` avant d'écrire du
  code : cette version de Next diffère de ce qu'on croit savoir.
- Ce dépôt **n'a pas de tests de composants** : vitest tourne en
  `environment: "node"` et n'inclut que `src/**/*.test.ts`. Toute logique
  décidable va dans `src/lib/`, le reste se vérifie au navigateur.

---

## Laissé de côté sciemment

- `videoTimeAt` et `actAt` (`src/lib/intro/timeline.ts`) sont exportés, testés,
  jamais appelés.
- Le calque d'intro capte les clics ~0,85 s après être devenu invisible.
- `IntroOverlay` et `IntroWordmark` sont dans le bundle principal alors que la
  porte renvoie `false` ; seul Three.js est différé.
- `src/styles/intro.css` se charge sur toutes les routes `[locale]`.
- `.superpowers/brainstorm/` (35 Mo de prototype jetable) n'est pas supprimé.
