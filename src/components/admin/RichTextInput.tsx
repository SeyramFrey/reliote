"use client";
import { useState } from "react";
import dynamic from "next/dynamic";

// Champ de saisie riche pour les corps de pages légales (0012). CKEditor produit
// du HTML, stocké tel quel puis assaini au rendu public (src/lib/legal/page.ts).
//
// L'éditeur écrit dans un <input type="hidden"> porteur du `name` : le formulaire
// admin reste un <form action={serverAction}> classique.
//
// L'éditeur lui-même est chargé avec ssr: false — le paquet ckeditor5 appelle
// document.createElement à l'évaluation du module et fait planter le rendu
// serveur. `ssr: false` n'est autorisé que dans un Client Component, d'où ce
// wrapper (cf. next/dist/docs/01-app/02-guides/lazy-loading.md § Skipping SSR).

const Placeholder = (
  <div
    className="border border-[var(--hairline)] p-4 text-sm text-concrete-2"
    style={{ minHeight: 260 }}
  >
    Chargement de l&apos;éditeur…
  </div>
);

const RichTextEditor = dynamic(
  () => import("./RichTextEditor").then((m) => m.RichTextEditor),
  { ssr: false, loading: () => Placeholder }
);

export function RichTextInput({
  name,
  label,
  defaultValue = "",
}: {
  name: string;
  label: string;
  defaultValue?: string;
}) {
  const [value, setValue] = useState(defaultValue);

  return (
    <div className="block">
      <span className="eyebrow">{label}</span>
      <input type="hidden" name={name} value={value} />
      <div className="mt-1 legal-editor">
        <RichTextEditor initialData={defaultValue} onData={setValue} />
      </div>
    </div>
  );
}
