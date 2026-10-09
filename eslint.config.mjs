import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Maquettes figées du bundle de design et script outillage CommonJS :
    // ni l'un ni l'autre ne fait partie de l'application.
    "_design-reference/**",
    "scripts/gen-landing-css.cjs",
    ".superpowers/**",
  ]),
]);

export default eslintConfig;
