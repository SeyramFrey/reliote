import * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";

// Extrusion des deux tracés du monogramme (src/components/shared/Logo.tsx) en
// volumes 3D. Rien n'est modélisé à la main : les crochets du logo SONT les
// mains qui se serrent, et c'est leur propre géométrie qui tourne.

const VIEWBOX = "0 0 299 314";

const EXTRUDE: THREE.ExtrudeGeometryOptions = {
  depth: 26,
  bevelEnabled: true,
  bevelThickness: 3.2,
  bevelSize: 2.4,
  bevelSegments: 4,
  curveSegments: 26,
};

export type MonogramPiece = {
  geo: THREE.ExtrudeGeometry;
  /** Position du morceau dans le logo assemblé, en unités de la scène. */
  lock: THREE.Vector3;
};

/**
 * Construit le volume d'un tracé et le centre sur lui-même, pour qu'il tourne
 * autour de son propre centre. `lock` est le décalage à réappliquer pour
 * reconstituer le logo.
 *
 * L'ordre des opérations compte : le SVG descend en Y et la 3D monte, donc on
 * retourne la géométrie AVANT de calculer sa boîte. Les matériaux qui la
 * reçoivent doivent utiliser `side: THREE.DoubleSide` — sur une géométrie
 * retournée, l'enroulement des faces est inversé et l'éclairage avec.
 */
export function buildMonogramGeometry(d: string): MonogramPiece {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${VIEWBOX}"><path d="${d}"/></svg>`;
  const shapes = new SVGLoader().parse(svg).paths.flatMap((p) => SVGLoader.createShapes(p));

  const geo = new THREE.ExtrudeGeometry(shapes, EXTRUDE);
  geo.scale(1, -1, 1);
  geo.computeVertexNormals();
  geo.computeBoundingBox();

  const lock = geo.boundingBox!.getCenter(new THREE.Vector3());
  geo.translate(-lock.x, -lock.y, -lock.z);

  return { geo, lock };
}

/**
 * Dégradé du R, cuit dans une texture.
 *
 * `ExtrudeGeometry` pose les UV aux coordonnées brutes de la forme : sans ce
 * recalage sur la boîte du R (x 81→306, y 90→314), le dégradé échantillonne une
 * bande minuscule et la queue paraît unie.
 */
export function buildRGradient(stops: readonly string[]): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 4;
  canvas.height = 256;

  // Null sous pression mémoire : on remonte une erreur lisible, que la barrière
  // d'erreur du calque attrape, plutôt qu'un TypeError à la ligne suivante.
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("intro : contexte 2D indisponible pour le dégradé du R");
  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  stops.forEach((c, i) => grad.addColorStop(i / (stops.length - 1), c));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 4, 256);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.repeat.set(1 / 225, 1 / 224);
  tex.offset.set(-81 / 225, -90 / 224);
  return tex;
}
