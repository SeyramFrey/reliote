// Encode la vidéo de construction de la séquence d'ouverture.
//
// La source est hors dépôt (c'est une génération, il n'y a pas de master de
// meilleure qualité). On l'accélère ici, une fois pour toutes, plutôt que de
// poser un `playbackRate` à la lecture : accélérer dans le navigateur est
// coûteux et saccadé sur mobile.
//
// Usage: node scripts/encode-intro-video.mjs <chemin de la source>

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";

const SPEED = 2.2; // doit rester cohérent avec VIDEO_DURATION dans src/lib/intro/timeline.ts
const OUT_DIR = "public/assets";

const source = process.argv[2];
if (!source) {
  console.error("Usage: node scripts/encode-intro-video.mjs <chemin de la source>");
  process.exit(1);
}
if (!existsSync(source)) {
  console.error(`Source introuvable : ${source}`);
  process.exit(1);
}

mkdirSync(OUT_DIR, { recursive: true });

const ff = (args) => execFileSync("ffmpeg", ["-y", "-v", "error", ...args], { stdio: "inherit" });

const desktop = path.join(OUT_DIR, "intro-construction.mp4");
const mobile = path.join(OUT_DIR, "intro-construction-mobile.mp4");
const poster = path.join(OUT_DIR, "intro-construction.jpg");

// `setpts` jette les PTS d'origine : la piste est réellement plus courte, pas
// relue plus vite. `-an` : la séquence est muette.
ff(["-i", source, "-vf", `setpts=PTS/${SPEED},scale=1920:-2`, "-an",
    "-c:v", "libx264", "-crf", "20", "-preset", "slow",
    "-pix_fmt", "yuv420p", "-movflags", "+faststart", desktop]);

ff(["-i", source, "-vf", `setpts=PTS/${SPEED},scale=960:-2`, "-an",
    "-c:v", "libx264", "-crf", "26", "-preset", "slow",
    "-pix_fmt", "yuv420p", "-movflags", "+faststart", mobile]);

// Dernière image : le plan achevé, c'est elle qui doit s'afficher si la vidéo
// ne se lance pas.
ff(["-sseof", "-0.1", "-i", source, "-vf", "scale=1920:-2",
    "-frames:v", "1", "-q:v", "4", "-update", "1", poster]);

const probe = (file) =>
  execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration",
    "-show_entries", "stream=width,height", "-of", "default=noprint_wrappers=1", file],
    { encoding: "utf8" }).trim().replace(/\s+/g, " ");

console.log("desktop :", probe(desktop));
console.log("mobile  :", probe(mobile));
console.log("poster  :", poster);
