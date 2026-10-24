"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { LOGO_P_PATH, LOGO_R_PATH, LOGO_R_STOPS } from "@/components/shared/Logo";
import { introLayout } from "@/lib/intro/layout";
import { buildMonogramGeometry, buildRGradient } from "./geometry";

// Les deux crochets tournent l'un autour de l'autre en resserrant la spirale,
// puis se verrouillent. L'assemblage est l'aboutissement du mouvement : quand
// le rayon atteint zéro, les deux morceaux sont exactement à leur place dans le
// logo — pas de correction de trajectoire ajoutée après coup.

/** Instant du verrouillage : fin de l'acte 1 + 85 % de l'acte 2. */
const APPROACH = 3.02;
/** Rayon de départ. Au-delà, les crochets sortent du cadre. */
const ORBIT_R = 400;
const A0 = -0.4 * Math.PI;
const A1 = Math.PI * 2 * 1.45;
/** Échelle du monogramme dans la scène, avant la réduction du lockup. */
const WORLD = 0.58;
const FOV = 32;

/** Le logo libère la place AVANT que les lettres n'arrivent. */
const SHIFT_START = 3.056;
const SHIFT_END = 3.81;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const easeInOut2 = (x: number) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
const easeOut3 = (x: number) => 1 - Math.pow(1 - x, 3);

type Props = {
  /** Temps courant dans la séquence, en secondes. Lu par la boucle de rendu :
   *  un prop numérique re-rendrait React soixante fois par seconde. */
  progressRef: React.RefObject<number>;
  /** Appelé une fois la géométrie construite et l'environnement compilé. */
  onReady: () => void;
};

export function MonogramScene({ progressRef, onReady }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  // `onReady` est gardé dans une ref pour que la scène ne se reconstruise pas
  // si l'appelant en change l'identité entre deux rendus.
  const readyRef = useRef(onReady);
  useEffect(() => {
    readyRef.current = onReady;
  }, [onReady]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const canvas = document.createElement("canvas");
    canvas.className = "intro-canvas";
    host.appendChild(canvas);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(FOV, 1, 10, 4000);

    // Sans carte d'environnement, le métal n'a rien à refléter et paraît gris.
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = envRT.texture;

    scene.add(new THREE.AmbientLight(0xffffff, 0.25));
    const key = new THREE.DirectionalLight(0xfff3df, 2.6);
    key.position.set(-380, 420, 540);
    const rim = new THREE.DirectionalLight(0x7ccf8f, 1.9);
    rim.position.set(460, -220, -320);
    const fill = new THREE.DirectionalLight(0xc9b37e, 0.9);
    fill.position.set(320, 160, 420);
    scene.add(key, rim, fill);

    const P = buildMonogramGeometry(LOGO_P_PATH);
    const R = buildMonogramGeometry(LOGO_R_PATH);
    const centre = new THREE.Vector3().addVectors(P.lock, R.lock).multiplyScalar(0.5);
    const lockP = P.lock.clone().sub(centre);
    const lockR = R.lock.clone().sub(centre);

    const rGradient = buildRGradient(LOGO_R_STOPS);
    // DoubleSide : la géométrie est retournée en Y, l'enroulement des faces
    // avec. Three corrige la normale des faces arrière, l'éclairage redevient juste.
    const matP = new THREE.MeshPhysicalMaterial({
      color: 0xe8e4da, metalness: 1, roughness: 0.22, side: THREE.DoubleSide,
    });
    const matR = new THREE.MeshPhysicalMaterial({
      map: rGradient, metalness: 1, roughness: 0.18, side: THREE.DoubleSide,
    });

    const world = new THREE.Group();
    world.scale.setScalar(WORLD);
    scene.add(world);
    const logo = new THREE.Group();
    world.add(logo);
    const meshP = new THREE.Mesh(P.geo, matP);
    const meshR = new THREE.Mesh(R.geo, matR);
    logo.add(meshP, meshR);

    let layout = introLayout(1);

    function resize() {
      const w = host!.clientWidth;
      const h = host!.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      layout = introLayout(w / h);
      camera.aspect = w / h;
      camera.position.z = layout.cameraZ;
      camera.updateProjectionMatrix();

      // Publié pour que le mot ELIOTE, qui est du DOM, suive exactement la
      // taille apparente du monogramme quel que soit le format d'écran.
      const unit = h / (2 * layout.cameraZ * Math.tan((FOV * Math.PI) / 360));
      host!.style.setProperty("--intro-unit", String(unit));
      host!.style.setProperty("--intro-stacked", layout.lockup === "empile" ? "1" : "0");
    }
    const ro = new ResizeObserver(resize);
    ro.observe(host);
    resize();

    function frame(t: number) {
      // Spirale : décalage par-dessus la position verrouillée, qui se referme.
      const e = easeInOut2(clamp(t / APPROACH, 0, 1));
      const a = A0 + (A1 - A0) * e;
      const r = ORBIT_R * (1 - e);
      const k = r / ORBIT_R;
      meshP.position.set(lockP.x + Math.cos(a) * r, lockP.y + Math.sin(a) * r * 0.45, 0);
      meshR.position.set(
        lockR.x + Math.cos(a + Math.PI) * r,
        lockR.y + Math.sin(a + Math.PI) * r * 0.45,
        0,
      );
      meshP.rotation.set(0, 0, a * 0.3 * k);
      meshR.rotation.set(0, 0, -a * 0.3 * k);

      // Le « clac » du verrouillage, puis le retrait vers la place du lockup.
      const pop = clamp((t - APPROACH) / 0.45, 0, 1);
      const bump = Math.sin(pop * Math.PI) * 0.045;

      const shift = easeInOut2(clamp((t - SHIFT_START) / (SHIFT_END - SHIFT_START), 0, 1));
      const s = (1 + bump) * (1 - shift * (1 - layout.monogramScale));
      logo.scale.setScalar(s);

      // En ligne, le monogramme s'écarte à gauche ; empilé, il remonte. La
      // place est prise sur le champ réellement visible, pas sur une constante :
      // sur une fenêtre moins large que 16:9, un décalage fixe le ferait sortir
      // du cadre.
      const halfH = camera.position.z * Math.tan((FOV * Math.PI) / 360);
      const halfW = halfH * camera.aspect;
      logo.position.set(
        layout.lockup === "empile" ? 0 : (-halfW * 0.3 * shift) / WORLD,
        layout.lockup === "empile" ? (halfH * 0.22 * shift) / WORLD : 0,
        0,
      );

      // Passé la vidéo, le monogramme a fait son travail : il s'efface.
      const out = easeOut3(clamp((t - 6.45) / 0.7, 0, 1));
      host!.style.opacity = String(1 - out);

      renderer.render(scene, camera);
    }

    let raf = 0;
    const loop = () => {
      frame(progressRef.current ?? 0);
      raf = requestAnimationFrame(loop);
    };
    frame(0);
    renderer.render(scene, camera);
    readyRef.current();
    loop();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      P.geo.dispose();
      R.geo.dispose();
      matP.dispose();
      matR.dispose();
      rGradient.dispose();
      envRT.dispose();
      pmrem.dispose();
      renderer.dispose();
      canvas.remove();
    };
  }, [progressRef]);

  return <div ref={hostRef} className="intro-scene" aria-hidden="true" />;
}
