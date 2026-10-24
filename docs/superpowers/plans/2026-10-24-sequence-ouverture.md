# Séquence d'ouverture de la landing — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Jouer une séquence d'ouverture de ~8 s sur la landing — deux crochets métal en spirale qui se verrouillent en logo, ELIOTE qui s'écrit, un plan d'architecte qui se dessine, puis la hero qui grandit et prend l'écran — une fois par onglet, sans coûter de référencement.

**Architecture :** La landing est rendue normalement et peinte à l'heure ; l'intro est un calque `position: fixed` posé par-dessus. Toute la logique décidable (porte d'entrée, minutage, composition responsive, signal « prêt ») vit dans `src/lib/intro/` en fonctions pures testées sous vitest ; les composants React et la scène WebGL se vérifient au navigateur. La hero finale n'est pas dupliquée : le contenu réel de la page est enveloppé dans un conteneur mis à l'échelle.

**Tech Stack :** Next.js 16 (Turbopack), React, next-intl, Three.js (`SVGLoader`, `ExtrudeGeometry`, `PMREMGenerator`, `RoomEnvironment`), GSAP, vitest.

**Spec :** `docs/superpowers/specs/2026-10-24-sequence-ouverture-design.md`

## Global Constraints

- **Next.js 16 / Turbopack.** `AGENTS.md` impose de lire `node_modules/next/dist/docs/` avant d'écrire du code. Déjà vérifié et contraignant pour ce plan : `ssr: false` avec `next/dynamic` **n'est autorisé que dans un Client Component** (erreur en Server Component) ; `next/script` en `beforeInteractive` **ne bloque pas l'hydratation**, donc le script anti-scintillement est un `<script dangerouslySetInnerHTML>` inline.
- **Tests :** vitest en `environment: "node"`, `include: ["src/**/*.test.ts"]`. Pas de jsdom, pas de `.test.tsx`, aucun test de composant dans ce dépôt. **Ne pas introduire de framework de test de composants** : la logique testable va dans `src/lib/intro/`, les composants se vérifient au navigateur.
- **Poids :** JavaScript ajouté ≤ **220 Ko gzip**, chargé après la première peinture, jamais bloquant.
- **LCP :** ≤ **2,5 s** sur la landing, mesure mobile bridée au Lighthouse. Au-dessus, on ne livre pas.
- **Périmètre :** `/[locale]` uniquement. Aucune autre route.
- **Interrupteur :** `NEXT_PUBLIC_INTRO=0` et `?intro=0` coupent l'intro sans redéploiement.
- **Minutage (montage court, 8,15 s) :** mains 0 → 2,0 ; assemblage 2,0 → 3,2 ; eliote 3,2 → 4,4 ; construction 4,4 → 6,6 ; hero 6,6 → 8,15.
- **Plafond de boucle acte 1 :** 5 s. La vidéo ne fait pas partie du signal « prêt ».
- **Matière :** métal (`metalness: 1`, `roughness: 0.2`, `RoomEnvironment`). **Mouvement :** spirale, 1,45 tour, rayon 400 → 0.
- **Langues :** fr et en. Toute chaîne visible passe par `next-intl` (`src/messages/{fr,en}.json`).

## Review Focus

Classes d'entrée que la spec implique sans qu'aucune tâche ne les exerce spontanément. Chaque ligne a son test rattaché à la tâche qui possède le code.

1. **`sessionStorage` inaccessible** (navigation privée, cookies bloqués, iframe) — l'accès jette, la porte doit décider quand même et ne pas faire tomber la page. → Tâche 1.
2. **Le signal « prêt » n'arrive jamais** (asset en 404, réseau coupé) — le plafond de 5 s doit sortir de la boucle malgré tout. → Tâche 4.
3. **Le viewport change pendant l'intro** (rotation du téléphone, fenêtre redimensionnée) — la composition doit se recalculer sans casser le verrouillage du logo. → Tâche 3.
4. **`?intro=0` et `?intro=1` face à un drapeau déjà posé** — la query tranche, dans les deux sens, et `?intro=1` est ce qui permet de rejouer l'intro en développement sans ouvrir un onglet neuf. → Tâche 1.
5. **La vidéo ne charge pas du tout** — l'acte 4 est sauté et la séquence passe d'ELIOTE à la hero, pas d'écran noir. → Tâche 4.

---

## Structure des fichiers

| Fichier | Responsabilité |
|---|---|
| `src/lib/intro/gate.ts` | Décide si l'intro joue. Pur. |
| `src/lib/intro/timeline.ts` | Bornes des actes, durées, position dans la vidéo. Pur. |
| `src/lib/intro/layout.ts` | Loi ratio du viewport → distance caméra et mise en page du lockup. Pur. |
| `src/lib/intro/readiness.ts` | Signal « prêt », plafond, inclusion de l'acte 4. Pur. |
| `src/components/landing/intro/IntroOverlay.tsx` | Client. Orchestration, bouton passer, Escape, `inert`. |
| `src/components/landing/intro/MonogramScene.tsx` | Client, `ssr: false`. Three.js + GSAP. |
| `src/components/landing/intro/IntroWordmark.tsx` | Le mot ELIOTE en DOM. |
| `src/components/landing/intro/geometry.ts` | Extrusion des tracés du monogramme. |
| `src/components/landing/intro/IntroGate.tsx` | Client. Monte `IntroOverlay` si la porte est ouverte. |
| `src/styles/intro.css` | Styles du calque. |
| `scripts/encode-intro-video.mjs` | Ré-encodage ×2,2 + variante mobile + poster. |

---

## Task 1 : La porte d'entrée

**Files:**
- Create: `src/lib/intro/gate.ts`, `src/lib/intro/gate.test.ts`
- Modify: `src/app/[locale]/layout.tsx`, `src/messages/fr.json`, `src/messages/en.json`

**Interfaces:**
- Consumes: rien.
- Produces: `INTRO_SESSION_KEY: string`, `type IntroGateInput`, `shouldPlayIntro(i: IntroGateInput): boolean`.

- [ ] **Step 1: Write the failing tests** dans `src/lib/intro/gate.test.ts`

```ts
const base: IntroGateInput = {
  enabled: true, queryIntro: null, seenThisTab: false,
  reducedMotion: false, webglOk: true,
};

test("joue sur une première visite d'onglet", () => {
  expect(shouldPlayIntro(base)).toBe(true);
});
test("ne joue pas si l'onglet l'a déjà vue", () => {
  expect(shouldPlayIntro({ ...base, seenThisTab: true })).toBe(false);
});
test("?intro=0 coupe même une première visite", () => {
  expect(shouldPlayIntro({ ...base, queryIntro: "0" })).toBe(false);
});
test("?intro=1 rejoue malgré le drapeau d'onglet", () => {
  expect(shouldPlayIntro({ ...base, seenThisTab: true, queryIntro: "1" })).toBe(true);
});
test("?intro=1 ne force rien contre reduced-motion ni sans WebGL", () => {
  expect(shouldPlayIntro({ ...base, queryIntro: "1", reducedMotion: true })).toBe(false);
  expect(shouldPlayIntro({ ...base, queryIntro: "1", webglOk: false })).toBe(false);
});
test("NEXT_PUBLIC_INTRO=0 coupe tout", () => {
  expect(shouldPlayIntro({ ...base, enabled: false })).toBe(false);
});
test("reduced-motion et absence de WebGL coupent", () => {
  expect(shouldPlayIntro({ ...base, reducedMotion: true })).toBe(false);
  expect(shouldPlayIntro({ ...base, webglOk: false })).toBe(false);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/intro/gate.test.ts`
Expected: FAIL — `shouldPlayIntro` introuvable.

- [ ] **Step 3: Implement `shouldPlayIntro(i: IntroGateInput): boolean` dans `src/lib/intro/gate.ts`**

Ordre de priorité : `reducedMotion` ou `!webglOk` → `false` (rien ne les force) ; `queryIntro === "0"` → `false` ; `!enabled` → `false` ; `queryIntro === "1"` → `true` ; `seenThisTab` → `false` ; sinon `true`.
Exporter `INTRO_SESSION_KEY = "reliote:intro-seen"`.

- [ ] **Step 4: Write the failing test for the storage reader** (Review Focus #1)

```ts
test("hasSeenThisTab renvoie false quand sessionStorage jette", () => {
  const boom = { getItem() { throw new DOMException("denied"); } } as unknown as Storage;
  expect(hasSeenThisTab(boom)).toBe(false);
});
test("hasSeenThisTab lit le drapeau", () => {
  const store = new Map<string, string>([[INTRO_SESSION_KEY, "1"]]);
  const fake = { getItem: (k: string) => store.get(k) ?? null } as unknown as Storage;
  expect(hasSeenThisTab(fake)).toBe(true);
});
test("markSeenThisTab n'explose pas quand l'écriture est refusée", () => {
  const boom = { setItem() { throw new DOMException("denied"); } } as unknown as Storage;
  expect(() => markSeenThisTab(boom)).not.toThrow();
});
```

- [ ] **Step 5: Implement `hasSeenThisTab(s: Storage | null): boolean` et `markSeenThisTab(s: Storage | null): void`** dans `src/lib/intro/gate.ts`

Chaque accès dans un `try/catch`. `null` ou exception → considéré non vu, écriture silencieuse.

- [ ] **Step 6: Run tests to verify they pass**

Run: `npx vitest run src/lib/intro/gate.test.ts`
Expected: PASS, 10 tests.

- [ ] **Step 7: Add the anti-flicker script and the strings**

Dans `src/app/[locale]/layout.tsx`, juste avant `{children}` dans `<body>`, un `<script dangerouslySetInnerHTML>` inline qui lit `sessionStorage` dans un `try/catch` et pose `document.documentElement.dataset.introSeen = "1"` si le drapeau existe. Pas `next/script` : `beforeInteractive` ne bloque pas l'hydratation.

Dans `src/messages/fr.json` et `en.json`, namespace `intro` : `skip` (« Passer l'intro » / « Skip intro »), `label` (« Animation d'ouverture Reliote » / « Reliote opening animation »).

- [ ] **Step 8: Commit**

```bash
git add src/lib/intro/gate.ts src/lib/intro/gate.test.ts "src/app/[locale]/layout.tsx" src/messages/fr.json src/messages/en.json
git commit -m "feat(intro): porte d'entrée de la séquence d'ouverture"
```

---

## Task 2 : Le minutage

**Files:**
- Create: `src/lib/intro/timeline.ts`, `src/lib/intro/timeline.test.ts`

**Interfaces:**
- Consumes: rien.
- Produces: `type ActKey = "mains" | "assemblage" | "eliote" | "construction" | "hero"`, `INTRO_ACTS: ReadonlyArray<{ key: ActKey; start: number; end: number }>`, `INTRO_DURATION: number`, `VIDEO_DURATION: number`, `actAt(t: number): ActKey`, `videoTimeAt(t: number): number`.

- [ ] **Step 1: Write the failing tests** dans `src/lib/intro/timeline.test.ts`

```ts
test("les bornes des actes suivent la spec", () => {
  expect(INTRO_ACTS.map(a => [a.key, a.start, a.end])).toEqual([
    ["mains", 0, 2.0], ["assemblage", 2.0, 3.2], ["eliote", 3.2, 4.4],
    ["construction", 4.4, 6.6], ["hero", 6.6, 8.15],
  ]);
  expect(INTRO_DURATION).toBe(8.15);
});
test("actAt situe un instant dans le bon acte", () => {
  expect(actAt(0)).toBe("mains");
  expect(actAt(1.99)).toBe("mains");
  expect(actAt(2.0)).toBe("assemblage");
  expect(actAt(6.6)).toBe("hero");
  expect(actAt(99)).toBe("hero");
});
test("la vidéo démarre à l'acte 4 et se borne à sa durée", () => {
  expect(videoTimeAt(0)).toBe(0);
  expect(videoTimeAt(4.4)).toBe(0);
  expect(videoTimeAt(5.4)).toBeCloseTo(1.0, 3);
  expect(videoTimeAt(99)).toBe(VIDEO_DURATION);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/intro/timeline.test.ts`
Expected: FAIL — module introuvable.

- [ ] **Step 3: Implement `src/lib/intro/timeline.ts`**

`VIDEO_DURATION = 2.77` (6,083 s ÷ 2,2 — la vidéo est **ré-encodée** à la vitesse cible, cf. tâche 5 ; aucun `playbackRate` à la lecture). `videoTimeAt(t) = clamp(t - 4.4, 0, VIDEO_DURATION)`. `actAt` renvoie le dernier acte dont `start <= t`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/intro/timeline.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/intro/timeline.ts src/lib/intro/timeline.test.ts
git commit -m "feat(intro): minutage des cinq actes"
```

---

## Task 3 : La composition responsive

**Files:**
- Create: `src/lib/intro/layout.ts`, `src/lib/intro/layout.test.ts`

**Interfaces:**
- Consumes: rien.
- Produces: `type LockupMode = "ligne" | "empile"`, `type IntroLayout = { cameraZ: number; lockup: LockupMode; monogramScale: number }`, `introLayout(aspect: number): IntroLayout`, `BASE_CAMERA_Z: number`.

- [ ] **Step 1: Write the failing tests** dans `src/lib/intro/layout.test.ts`

```ts
test("le 16:9 est la référence : caméra au repos, lockup en ligne", () => {
  const l = introLayout(16 / 9);
  expect(l.cameraZ).toBe(BASE_CAMERA_Z);
  expect(l.lockup).toBe("ligne");
});
test("plus large que 16:9 : la hauteur reste la contrainte, caméra inchangée", () => {
  expect(introLayout(2.4).cameraZ).toBe(BASE_CAMERA_Z);
});
test("plus étroit : la caméra recule proportionnellement", () => {
  expect(introLayout(16 / 9 / 2).cameraZ).toBeCloseTo(BASE_CAMERA_Z * 2, 3);
});
test("le portrait empile le lockup", () => {
  expect(introLayout(0.46).lockup).toBe("empile");
  expect(introLayout(1.2).lockup).toBe("ligne");
});
test("le recul est plafonné pour que le logo reste lisible", () => {
  expect(introLayout(0.2).cameraZ).toBeLessThanOrEqual(1800);
});
test("un ratio absurde ne produit jamais NaN ni zéro", () => {   // Review Focus #3
  for (const a of [0, -1, NaN, Infinity]) {
    const l = introLayout(a);
    expect(Number.isFinite(l.cameraZ)).toBe(true);
    expect(l.cameraZ).toBeGreaterThan(0);
  }
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/intro/layout.test.ts`
Expected: FAIL — module introuvable.

- [ ] **Step 3: Implement `introLayout(aspect: number): IntroLayout`**

`BASE_CAMERA_Z = 620`, ratio de référence `16/9`. Un `aspect` non fini ou ≤ 0 retombe sur `16/9`. `cameraZ = min(1800, BASE_CAMERA_Z * max(1, (16/9) / aspect))` — la caméra ne recule que quand la largeur devient la contrainte. `lockup = aspect < 0.9 ? "empile" : "ligne"`. `monogramScale = lockup === "empile" ? 0.78 : 0.62`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/intro/layout.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/intro/layout.ts src/lib/intro/layout.test.ts
git commit -m "feat(intro): loi de composition selon le ratio du viewport"
```

---

## Task 4 : Le signal « prêt » et le plafond

**Files:**
- Create: `src/lib/intro/readiness.ts`, `src/lib/intro/readiness.test.ts`

**Interfaces:**
- Consumes: rien.
- Produces: `LOOP_CAP: number`, `type ReadyInput = { coreReady: boolean; videoReady: boolean; elapsed: number }`, `type ReadyVerdict = { leaveLoop: boolean; includeVideoAct: boolean }`, `readyVerdict(i: ReadyInput): ReadyVerdict`.

- [ ] **Step 1: Write the failing tests** dans `src/lib/intro/readiness.test.ts`

```ts
test("on reste dans la boucle tant que le cœur n'est pas prêt", () => {
  expect(readyVerdict({ coreReady: false, videoReady: true, elapsed: 1 }).leaveLoop).toBe(false);
});
test("on sort dès que le cœur est prêt", () => {
  expect(readyVerdict({ coreReady: true, videoReady: true, elapsed: 0.3 }).leaveLoop).toBe(true);
});
test("le plafond de 5 s sort de la boucle même sans signal", () => {   // Review Focus #2
  expect(LOOP_CAP).toBe(5);
  expect(readyVerdict({ coreReady: false, videoReady: false, elapsed: 5 }).leaveLoop).toBe(true);
});
test("la vidéo ne fait pas partie du signal « prêt »", () => {
  expect(readyVerdict({ coreReady: true, videoReady: false, elapsed: 1 }).leaveLoop).toBe(true);
});
test("vidéo absente : l'acte 4 est sauté, pas d'écran noir", () => {   // Review Focus #5
  expect(readyVerdict({ coreReady: true, videoReady: false, elapsed: 1 }).includeVideoAct).toBe(false);
  expect(readyVerdict({ coreReady: true, videoReady: true, elapsed: 1 }).includeVideoAct).toBe(true);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/intro/readiness.test.ts`
Expected: FAIL — module introuvable.

- [ ] **Step 3: Implement `readyVerdict(i: ReadyInput): ReadyVerdict`**

`LOOP_CAP = 5`. `leaveLoop = i.coreReady || i.elapsed >= LOOP_CAP`. `includeVideoAct = i.videoReady`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/intro/readiness.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/intro/readiness.ts src/lib/intro/readiness.test.ts
git commit -m "feat(intro): signal prêt, plafond de boucle, acte vidéo optionnel"
```

---

## Task 5 : Les assets vidéo

**Files:**
- Create: `scripts/encode-intro-video.mjs`
- Create (sortie) : `public/assets/intro-construction.mp4`, `public/assets/intro-construction-mobile.mp4`, `public/assets/intro-construction.jpg`

**Interfaces:**
- Consumes: la source, hors dépôt : `C:\Users\gseyr\Documents\ChatGPT\Reliote\RELIOTE-construction-fluide-v2.mp4` (1928×1072, 6,083 s). Chemin passé en argument, pas codé en dur.
- Produces: les trois fichiers ci-dessus. `VIDEO_DURATION` de la tâche 2 doit correspondre à la durée réelle du fichier produit.

- [ ] **Step 1: Write `scripts/encode-intro-video.mjs`**

Prend le chemin source en `process.argv[2]`. Produit, via `ffmpeg` :
- desktop : `setpts=PTS/2.2`, largeur 1920, `libx264 -crf 20 -pix_fmt yuv420p -movflags +faststart`, sans piste audio ;
- mobile : même accélération, largeur 960, `-crf 26` ;
- poster : la dernière image, en JPEG qualité 4, largeur 1920.

- [ ] **Step 2: Run it**

Run: `node scripts/encode-intro-video.mjs "C:/Users/gseyr/Documents/ChatGPT/Reliote/RELIOTE-construction-fluide-v2.mp4"`

- [ ] **Step 3: Verify the output matches the timeline**

Run: `ffprobe -v error -show_entries format=duration -show_entries stream=width,height -of default=noprint_wrappers=1 public/assets/intro-construction.mp4`
Expected: `width=1920`, durée **2,76–2,78 s**. Si la durée sort de cette fourchette, corriger `VIDEO_DURATION` dans `src/lib/intro/timeline.ts` et son test.

Run: `ls -l public/assets/intro-construction-mobile.mp4`
Expected: nettement sous 1 Mo.

- [ ] **Step 4: Commit**

```bash
git add scripts/encode-intro-video.mjs public/assets/intro-construction.mp4 public/assets/intro-construction-mobile.mp4 public/assets/intro-construction.jpg
git commit -m "feat(intro): vidéo de construction ré-encodée à la vitesse cible"
```

---

## Task 6 : La scène 3D

**Files:**
- Create: `src/components/landing/intro/geometry.ts`, `src/components/landing/intro/MonogramScene.tsx`
- Modify: `package.json` (ajouter `three`, `@types/three`, `gsap`)

**Interfaces:**
- Consumes: `LOGO_P_PATH`, `LOGO_R_PATH`, `LOGO_R_STOPS` de `src/components/shared/Logo.tsx` ; `introLayout` (tâche 3) ; `INTRO_ACTS` (tâche 2).
- Produces: `buildMonogramGeometry(d: string): { geo: THREE.ExtrudeGeometry; lock: THREE.Vector3 }` dans `geometry.ts` ; le composant `MonogramScene` avec les props `{ progress: number; aspect: number; onReady: () => void }` — `progress` est le temps en secondes dans la séquence, piloté par le parent.

- [ ] **Step 1: Install the dependencies**

Run: `npm install three gsap && npm install -D @types/three`
Épingler les versions exactes installées dans `package.json`. Vérifier le démarrage sous Turbopack avant d'aller plus loin — précédent `maplibre-gl` v6 qui bloquait.

- [ ] **Step 2: Implement `buildMonogramGeometry`**

Construire un SVG `viewBox="0 0 299 314"` autour du `d`, `new SVGLoader().parse(...)`, `toShapes(true)`, `ExtrudeGeometry` avec `{ depth: 26, bevelEnabled: true, bevelThickness: 3.2, bevelSize: 2.4, bevelSegments: 4, curveSegments: 26 }`.
Puis, **dans cet ordre** : `geo.scale(1, -1, 1)` (le SVG descend en Y), `computeVertexNormals()`, `computeBoundingBox()`, centrer sur le centre de la boîte et renvoyer ce centre comme `lock`. Les matériaux doivent utiliser `side: THREE.DoubleSide`, sinon l'éclairage s'inverse sur la géométrie retournée.

- [ ] **Step 3: Implement `MonogramScene.tsx`**

Client component. Renderer WebGL alpha, `ACESFilmicToneMapping`. Environnement : `PMREMGenerator` + `RoomEnvironment` (aucun HDR externe). Matière métal : `MeshPhysicalMaterial { metalness: 1, roughness: 0.2, side: DoubleSide }`, le R recevant une texture de dégradé `LOGO_R_STOPS` dont les UV sont **ramenés sur la boîte du R** — `repeat.set(1/225, 1/224)`, `offset.set(-81/225, -90/224)` — sinon le dégradé ne se voit pas.
Spirale : décalage appliqué par-dessus la position verrouillée, `offsetP = (cos a, sin a · 0.45, 0) · r`, `offsetR` au même angle décalé de π ; `a` de `-0.4π` à `2π · 1.45`, `r` de `400` à `0` sur `[0, 3.02]` s. À `r = 0` les deux crochets sont exactement verrouillés. Rotation propre `z = ±a · 0.3 · (r/400)`, qui se déroule donc à zéro.
La caméra prend `introLayout(aspect).cameraZ`. Appeler `onReady()` une fois la géométrie construite et l'environnement compilé.
**Piège GSAP :** si une timeline GSAP pilote la spirale par `onUpdate`, tout déplacement manuel doit passer `tl.pause(t, false)` — `pause(t)` supprime les callbacks et la spirale reste figée. Recalculer la spirale dans la boucle de rendu est le filet de sécurité.

- [ ] **Step 4: Verify in the browser**

Monter temporairement la scène sur une page de test ou via `?intro=1`. Démarrer `preview_start` (`reliote-dev`), puis vérifier dans l'ordre :
- `read_console_messages` : aucune erreur ;
- capture à `progress = 1.5` : les deux crochets séparés, métal, reflets visibles ;
- capture à `progress = 3.05` : le monogramme **exactement** reconstitué, pas de décalage entre les deux formes ;
- capture après `resize_window` en `mobile` : la caméra a reculé, le logo tient dans le cadre.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json src/components/landing/intro/geometry.ts src/components/landing/intro/MonogramScene.tsx
git commit -m "feat(intro): scène 3D métal et spirale d'assemblage"
```

---

## Task 7 : Le calque d'intro

**Files:**
- Create: `src/components/landing/intro/IntroWordmark.tsx`, `src/components/landing/intro/IntroOverlay.tsx`, `src/components/landing/intro/IntroGate.tsx`, `src/styles/intro.css`
- Modify: `src/app/[locale]/layout.tsx` (importer `intro.css`)

**Interfaces:**
- Consumes: tâches 1 à 4 et `MonogramScene` (tâche 6).
- Produces: `<IntroGate />`, un composant client sans props, à poser par la page.

- [ ] **Step 1: Implement `IntroWordmark.tsx`**

Les six lettres `E L I O T E` en TT Ramillas (`var(--font-display)`), révélées par `clip-path: inset(0 0 100% 0)` → `inset(0 0 0% 0)` en cascade. Un emplacement réservé à gauche tient la place du monogramme 3D. En mode `empile`, le mot passe sous le monogramme.
**Le monogramme doit avoir libéré sa place avant que les lettres arrivent** : le glissé vers la gauche part dès le « clac » (2,0 s + 85 % de l'acte 2), les lettres ne commencent qu'à `eliote + 45 %` de l'acte 3. Sinon le E s'écrit par-dessus la queue du R.

- [ ] **Step 2: Implement `IntroOverlay.tsx`**

Client. `position: fixed; inset: 0; z-index: 100`, fond `#0c2a17`, plus une grille blueprint à 5,5 % d'opacité qui assure le raccord invisible avec la première image de la vidéo.
Horloge en `requestAnimationFrame` ; tant que `readyVerdict(...).leaveLoop` est faux, le temps reboucle dans l'acte 1 ; ensuite il avance jusqu'à `INTRO_DURATION`. Si `includeVideoAct` est faux, sauter l'acte 4.
`MonogramScene` importé par `next/dynamic` avec `{ ssr: false }` — **autorisé uniquement ici, dans un Client Component**.
Source de l'acte 4 : `intro-construction-mobile.mp4` quand `introLayout(aspect).lockup === "empile"` ou que la largeur du viewport est sous 768 px, `intro-construction.mp4` sinon ; `poster` dans les deux cas. Le `videoReady` passé à `readyVerdict` est l'événement `canplaythrough` de la source retenue, et son échec (`error`, ou absence d'événement) vaut `false`.
Bouton « passer » : apparaît à 1,2 s, libellé `t("intro.skip")`. **Escape actif dès 0 s**, avant l'apparition du bouton. `inert` sur le contenu de la page pendant l'intro. À la fin comme au skip : `markSeenThisTab(window.sessionStorage)` puis démontage.

- [ ] **Step 3: Implement `IntroGate.tsx`**

Client. Au montage, calcule `shouldPlayIntro` à partir de : `process.env.NEXT_PUBLIC_INTRO !== "0"`, `new URLSearchParams(location.search).get("intro")`, `hasSeenThisTab(window.sessionStorage)`, `matchMedia("(prefers-reduced-motion: reduce)").matches`, et un test de contexte WebGL. Ne rend `IntroOverlay` que si vrai. **Ne rien rendre au premier passage serveur** : l'état initial est « pas d'intro », décidé après montage, pour ne pas désynchroniser l'hydratation.

- [ ] **Step 4: Verify in the browser** (Review Focus #3)

- `?intro=1` rejoue l'intro dans un onglet qui l'a déjà vue ; `?intro=0` la coupe.
- Rechargement simple : pas d'intro, **et pas de scintillement** au chargement.
- Pendant l'intro, `resize_window` de `desktop` à `mobile` : la composition se recalcule, le logo reste entier, le verrouillage n'est pas cassé.
- Escape pendant la première seconde ferme bien l'intro.
- `read_console_messages` : aucune erreur.

- [ ] **Step 5: Commit**

```bash
git add src/components/landing/intro src/styles/intro.css "src/app/[locale]/layout.tsx"
git commit -m "feat(intro): calque d'ouverture, mot ELIOTE, porte et bouton passer"
```

---

## Task 8 : Le raccord avec la hero, et la mesure qui décide

**Files:**
- Modify: `src/app/[locale]/page.tsx`, `src/styles/intro.css`

**Interfaces:**
- Consumes: `<IntroGate />` (tâche 7).
- Produces: la landing complète avec son intro.

- [ ] **Step 1: Wrap the page content and mount the gate**

Dans `src/app/[locale]/page.tsx`, envelopper `<main>` et `<Footer>` dans `<div id="page-zoom">`, et poser `<IntroGate />` en frère. **Ne pas dupliquer la hero** : le carré qui grandit est ce conteneur, mis à l'échelle depuis ~24 % par `transform: scale()` + `translateZ()` jusqu'à 1 sur l'acte 5. La hero réelle, sa vidéo de fond et son parallax continuent de tourner pendant la montée.

- [ ] **Step 2: Verify the handoff in the browser**

Capture à `progress = 7.0` : la page réduite au centre sur fond vert, bords visibles. Capture après la fin : la landing en place, **aucun saut de position ni de taille** au moment du démontage du calque, le texte de la hero net. `read_console_messages` vide.

- [ ] **Step 3: Measure — this step decides whether the feature ships**

Run: `npm run build && npm run start`
Puis Lighthouse en mobile bridé sur `/fr`, avec `NEXT_PUBLIC_INTRO=0` puis sans.
Expected: **LCP ≤ 2,5 s dans les deux cas**, et JavaScript ajouté ≤ 220 Ko gzip (comparer les deux rapports de build).
Si l'un des deux seuils est dépassé : **ne pas livrer en l'état**, laisser `NEXT_PUBLIC_INTRO=0` par défaut et remonter les chiffres. C'est le cas prévu par la spec, pas un échec du plan.

- [ ] **Step 4: Full check**

Run: `npm test && npm run lint && npm run build`
Expected: tout passe.

- [ ] **Step 5: Commit**

```bash
git add "src/app/[locale]/page.tsx" src/styles/intro.css
git commit -m "feat(intro): raccord avec la hero et montage sur la landing"
```

---

## Nettoyage

Une fois la tâche 8 livrée, supprimer le prototype jetable `.superpowers/brainstorm/` (35 Mo d'images extraites) et retirer la ligne `.superpowers/` de `.gitignore` si plus rien ne l'utilise.
