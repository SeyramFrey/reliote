# Reliote — Séquence d'ouverture de la landing — Design

**Date :** 2026-10-24
**Owner :** Sey (Fabrice Geoffrey)
**Statut :** décisions validées par Sey en séance, sur prototype jouable.
Document relu par un constructeur frais, questions résolues (§8). **En attente de
la lecture de Sey, puis du plan d'implémentation.**
Prototype jetable : `.superpowers/brainstorm/22526-1792851161/content/sequence-v2.html`
(non versionné, à jeter une fois l'implémentation faite).

---

## 1. But

Raconter Reliote en huit secondes, sans un mot, à qui arrive sur la page d'accueil.

Trois temps, trois idées :

1. **Les deux crochets du monogramme tournent l'un autour de l'autre et se
   verrouillent en logo** → c'est une plateforme de mise en relation. Les deux
   crochets *sont* les mains qui se serrent.
2. **Un plan d'architecte se dessine** (vidéo existante) → après la mise en
   relation, quelque chose se construit.
3. **Un carré au fond grandit et prend tout l'écran** → c'est Reliote qui permet
   tout ça. Le carré est la hero de la page.

L'enchaînement est conçu pour que le raccord 2→3 soit invisible : la vidéo
démarre sur un fond vert quasi vide avec une grille de blueprint, et la scène 3D
est calée sur ce même vert avec la même grille.

## 2. Décisions (Sey, 2026-10-24)

| Sujet | Décision |
|---|---|
| Matière des crochets | **Métal** (métalness 1, rugosité ~0,2, carte d'environnement) |
| Mouvement d'approche | **Spirale** : les deux crochets tournent l'un autour de l'autre, 1,45 tour, rayon se resserrant jusqu'à zéro. Écarté : la dérive libre, et la bascule sur l'axe horizontal |
| Montage | **Court, ~8,2 s**. Tracé du plan accéléré ×2,2 pour montrer la construction en entier |
| Déclenchement | **Une fois par onglet.** Nouvel onglet → séquence. Rechargement du même onglet → pas de séquence |
| Bouton « Passer l'intro » | **Toujours**, apparaît à 1,2 s |
| Périmètre | **Landing seulement** (`/[locale]`). Aucune autre page n'est couverte |
| Cadrage hors 16:9 | **S'adapte au viewport.** Plein écran dans tous les formats : la caméra recule ou avance selon le ratio, le lockup R+ELIOTE se réorganise. Écarté : les bandes 16:9 et le recadrage |
| Mobile portrait | **La séquence joue, recomposée** : monogramme centré, ELIOTE dessous, acte 4 allégé |

### Découpage retenu (montage court)

| Acte | Début | Durée | Contenu |
|---|---|---|---|
| 1 · Les mains | 0 s | 2,0 s | Spirale, les crochets se rejoignent |
| 2 · L'assemblage | 2,0 s | 1,2 s | Verrouillage (« clac »), le logo glisse à gauche |
| 3 · ELIOTE | 3,2 s | 1,2 s | Les lettres se construisent à droite du monogramme |
| 4 · La construction | 4,4 s | 2,2 s | La vidéo du plan, en fondu |
| 5 · La hero | 6,6 s | 1,5 s | Le carré grandit et prend l'écran |

La spirale couvre d'un seul geste l'acte 1 **et** la descente de l'acte 2 :
l'assemblage est l'aboutissement du mouvement, pas une correction de trajectoire
ajoutée après coup. Quand le rayon atteint zéro, les deux crochets sont
exactement aux positions du logo.

De même, le monogramme libère la place **avant** que les lettres arrivent : il
part dès le « clac ». Sinon le E s'écrit par-dessus la queue du R.

## 3. Décisions prises par moi (à vérifier, pas validées par Sey)

Ces choix ne sont pas sortis de la séance. Ils sont défendables, ils sont
signalés comme miens, et ils peuvent être renversés.

**L'intro est un calque au-dessus de la vraie landing, pas une route séparée.**
C'est le point qui décide si cette séquence coûte du référencement. Si la hero
n'apparaît qu'à la 8ᵉ seconde, le LCP est mesuré à ~8 s là où la cible Google est
sous 2,5 s. La parade : la landing est rendue normalement dans le DOM, le
navigateur la peint à l'heure, et le calque d'intro est posé par-dessus. À
**mesurer au Lighthouse avant/après**, pas à supposer : les sources publiques sur
ce point précis sont faibles, c'est un raisonnement sur le mécanisme du LCP.

**L'acte 1 boucle jusqu'à ce que les assets soient réellement prêts.** Sur une
connexion rapide la spirale fait son tour et demi et enchaîne ; sur une connexion
lente elle continue de tourner. L'intro ne se termine jamais avant que le site
soit prêt, et jamais longtemps après. C'est ce qui distingue une vraie intro de
chargement d'un minuteur décoratif.

**`prefers-reduced-motion` → logo fixe puis hero directe.** Accessibilité, non
négociable.

**Three.js et GSAP chargés dynamiquement**, hors du bundle principal.

**Le carré final EST le composant `Hero` réel, mis à l'échelle.** Le prototype
contient une recopie à la main de la hero (titre, sous-titre, boutons, en français
en dur) — c'était une commodité de maquette, et j'avais d'abord inscrit ici qu'on
garderait ce calque. C'est une erreur : la hero est localisée fr/en et sa copie
bougera, donc une seconde hero à maintenir en parallèle casserait le raccord au
premier changement de texte. La vraie hero est rendue à sa place, enveloppée dans
un conteneur qui part à ~24 % en `transform: scale()` + `translateZ()` et revient
à 1. Pas de remontage, pas de duplication, le parallax et la vidéo de fond
continuent de tourner. Le texte est illisible tant que le carré est petit — c'est
voulu, c'est une maquette qui grandit.

**Pas de WebGL, ou GPU trop faible → hero directe, sans intro.** Même traitement
que `prefers-reduced-motion`. Pas de version dégradée de la séquence : en
fabriquer une (sprite ou vidéo pré-rendue) doublerait le travail de direction
artistique et rajouterait du poids exactement là où on n'en veut pas. Dans la zone
visée ce cas n'est pas marginal, et c'est précisément pourquoi le repli doit être
rapide plutôt que joli.

**Plafond de la boucle de l'acte 1 : 5 secondes.** Au-delà, on enchaîne quoi qu'il
arrive. **La vidéo ne fait pas partie du signal « prêt »** : elle se charge en
parallèle, et si elle n'est pas disponible quand l'acte 4 devrait commencer, on
saute l'acte 4 et on passe d'ELIOTE à la hero qui grandit. Le signal « prêt »
couvre : le module Three.js, la carte d'environnement construite, les fontes, et
la première peinture de la landing.

**Seuils de livraison, chiffrés.** On ne livre pas si le LCP de la landing dépasse
**2,5 s** (mesure mobile bridée, Lighthouse, avant/après). Le JavaScript ajouté
reste sous **220 Ko gzip**, chargé après la première peinture, jamais bloquant.

**Un interrupteur pour couper l'intro sans redéployer :** `NEXT_PUBLIC_INTRO=0`,
et `?intro=0` en query. À construire **en premier**, avec la mesure — pas à la
fin.

**Échappement clavier dès 0 s** (avant même que le bouton apparaisse à 1,2 s), et
`inert` sur la landing pendant l'intro pour que le focus n'aille pas se perdre
dessous.

**Lecture du `sessionStorage` par un script bloquant en `<head>`**, comme pour un
thème, afin d'éviter le scintillement de l'intro au rechargement dans un onglet
qui l'a déjà vue.

## 4. Contraintes

- **Next.js 16 / Turbopack.** `AGENTS.md` l'impose : lire la doc dans
  `node_modules/next/dist/docs/` avant d'écrire du code. Les APIs et conventions
  diffèrent de ce qu'on croit savoir.
- **Aucune dépendance d'animation 3D aujourd'hui.** Le projet n'a que
  `framer-motion`. Il faut ajouter `three` et `gsap` — un coût de bundle payé
  exactement au moment où l'on bloque l'écran. C'est la tension centrale de cette
  feature.
- **Précédent à connaître :** `maplibre-gl` v6 bloque sous Next 16 / Turbopack
  (worker GeoJSON), v4 épinglée. Les libs lourdes à workers sont à tester tôt.
- **Les tracés du monogramme** sont dans `src/components/shared/Logo.tsx`
  (`LOGO_P_PATH`, `LOGO_R_PATH`, `LOGO_R_STOPS`). Ils sont extrudés en 3D via
  `SVGLoader` + `ExtrudeGeometry`. La géométrie est retournée en Y
  (`scale(1,-1,1)`) avec `side: DoubleSide`, sinon l'éclairage s'inverse.
- **Dégradé du R :** `ExtrudeGeometry` pose les UV aux coordonnées brutes de la
  forme. Il faut les ramener sur la boîte du R (x 81→306, y 90→314) pour que le
  dégradé coure du haut de la boucle au bout de la queue.
- **Typo :** TT Ramillas (local, `src/app/fonts/ramillas/`) pour ELIOTE.
- **Vidéo.** Fichier canonique, validé par Sey le 2026-10-24 :
  `C:\Users\gseyr\Documents\ChatGPT\Reliote\RELIOTE-construction-fluide-v2.mp4`
  (1928×1072, 6,08 s, 2,7 Mo). Il n'est **pas** dans le dépôt : à copier dans
  `public/assets/`. La copie présente dans le dossier brainstorm
  (`content/construction.mp4`) est le même fichier, et les 367 JPEG de
  `content/vf/` n'ont servi qu'à l'export MP4 — tout ce dossier est jetable.
  Pas de master de meilleure qualité : c'est une génération, ce fichier est la
  source.
  **Ré-encoder à la vitesse cible plutôt que jouer à `playbackRate = 2.2`** :
  l'accélération à la lecture est coûteuse et saccadée sur mobile. Prévoir aussi
  une variante plus légère pour le mobile.
- **Piège GSAP rencontré :** `tl.pause(t)` supprime les callbacks par défaut.
  Toute animation qui s'appuie sur `onUpdate` (la spirale) reste figée au scrub
  et à l'export. Passer `tl.pause(t, false)`, ou recalculer dans la boucle de
  rendu.

## 5. Hors périmètre

- Les pages autres que la landing.
- Le son.
- Des mains anatomiques modélisées. Les crochets du logo *sont* les mains. Blender
  n'est pas nécessaire et n'a pas été utilisé.
- Remplacer le composant `Hero` existant. La séquence lui passe la main.

## 6. Ce qui ferait échouer la feature, même si elle fonctionne

- Le visiteur attend devant une page déjà prête : du théâtre par-dessus un site
  chargé.
- Le LCP de la hero mesuré à la 8ᵉ seconde, et le référencement qui en pâtit.
- La séquence qui se rejoue à chaque rechargement du même onglet.
- Les crochets qui se lisent comme un bug d'affichage plutôt que comme deux mains.
- Un visiteur qui n'a aucun moyen de passer.

## 7. Laissé au constructeur

- L'implémentation du signal « prêt » (son contenu est fixé en §3, pas sa forme).
- La mécanique exacte de passage de main entre le calque d'intro et la hero mise
  à l'échelle.
- Le point de bascule entre la mise en page large et la mise en page portrait, et
  la loi qui relie le ratio du viewport à la distance caméra.
- L'encodage de la variante mobile de la vidéo, et le seuil en dessous duquel
  l'acte 4 devient une image fixe.
- L'image d'attente (poster) de la vidéo.
- La détection de « GPU trop faible » (le simple test de disponibilité WebGL est
  insuffisant ; à calibrer).
- Le découpage en composants et l'emplacement des fichiers.
- Les tests.

## 8. Relecture

Document relu le 2026-10-24 par un constructeur sans contexte de la séance.
Six points soulevés : le cadrage hors 16:9 et le portrait (tranchés par Sey,
§2) ; le repli sans WebGL, le plafond de la boucle, les seuils chiffrés et le
statut du carré final (tranchés en §3) ; le fichier vidéo canonique (§4).
La relecture a corrigé une erreur de ma part sur le carré final — voir §3.
