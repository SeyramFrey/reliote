"use client";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import {
  ClassicEditor,
  Autoformat,
  BlockQuote,
  Bold,
  Essentials,
  Heading,
  HorizontalLine,
  Italic,
  Link,
  List,
  Paragraph,
  PasteFromOffice,
  Table,
  TableToolbar,
  Underline,
} from "ckeditor5";
import "ckeditor5/ckeditor5.css";

// Ce module touche au DOM dès son évaluation : `ckeditor5` appelle
// document.createElement au chargement. Il ne doit donc JAMAIS être importé
// pendant le rendu serveur — RichTextInput le charge via next/dynamic avec
// ssr: false. Un simple garde d'état ne suffit pas : il empêche le rendu,
// pas l'évaluation du module (500 au SSR de la page admin).

const TOOLBAR = [
  "heading",
  "|",
  "bold", "italic", "underline",
  "|",
  "link", "bulletedList", "numberedList", "blockQuote",
  "|",
  "insertTable", "horizontalLine",
  "|",
  "undo", "redo",
];

export function RichTextEditor({
  initialData,
  onData,
}: {
  initialData: string;
  onData: (html: string) => void;
}) {
  return (
    <CKEditor
      editor={ClassicEditor}
      data={initialData}
      config={{
        // CKEditor 5 est en double licence GPL-2.0+ / commerciale. Reliote étant
        // un produit privé, l'usage sous GPL n'est pas ouvert : il faut une clé
        // obtenue chez CKSource. 'GPL' ne sert qu'au développement local.
        licenseKey: process.env.NEXT_PUBLIC_CKEDITOR_LICENSE_KEY || "GPL",
        plugins: [
          Autoformat, BlockQuote, Bold, Essentials, Heading, HorizontalLine,
          Italic, Link, List, Paragraph, PasteFromOffice, Table, TableToolbar,
          Underline,
        ],
        toolbar: TOOLBAR,
        heading: {
          options: [
            { model: "paragraph", title: "Paragraphe", class: "ck-heading_paragraph" },
            { model: "heading2", view: "h2", title: "Titre d'article", class: "ck-heading_heading2" },
            { model: "heading3", view: "h3", title: "Sous-titre", class: "ck-heading_heading3" },
            { model: "heading4", view: "h4", title: "Sous-sous-titre", class: "ck-heading_heading4" },
          ],
        },
        table: { contentToolbar: ["tableColumn", "tableRow", "mergeTableCells"] },
        link: { addTargetToExternalLinks: true },
      }}
      onChange={(_evt, editor) => onData(editor.getData())}
    />
  );
}
