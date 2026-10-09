import sanitizeHtml from "sanitize-html";
import type { Locale } from "@/lib/i18n/config";

// Pages légales (0012_legal_pages). Le corps est du HTML produit par CKEditor
// dans l'admin. Ce module est pur et sans accès base : il décide quelle langue
// servir et assainit le HTML avant rendu. Testable sans DB.

// L'ordre est celui de la colonne « Légal » du pied de page, et sert aussi de
// source aux paramètres statiques de la route publique.
export const LEGAL_SLUGS = ["cgu", "confidentialite", "cookies", "mentions"] as const;

export type LegalSlug = (typeof LEGAL_SLUGS)[number];

export type LegalRow = {
  slug: string;
  title_fr: string;
  title_en: string;
  body_fr: string;
  body_en: string;
  seo_description_fr: string | null;
  seo_description_en: string | null;
  updated_at: string;
};

export type LocalizedLegal = {
  title: string;
  body: string;
  description: string | null;
};

export function isLegalSlug(value: string): value is LegalSlug {
  return (LEGAL_SLUGS as readonly string[]).includes(value);
}

/**
 * Choisit la langue à servir. Le corps retombe sur le français si l'autre
 * version est encore vide : une page peut être publiée alors que seul le texte
 * français a été relu par un juriste, et servir un document légal vide serait
 * pire que de servir l'autre langue.
 */
export function pickLocalized(row: LegalRow, locale: Locale): LocalizedLegal {
  const en = locale === "en";
  return {
    title: (en ? row.title_en : row.title_fr) || row.title_fr,
    body: (en ? row.body_en : row.body_fr) || row.body_fr,
    description:
      (en ? row.seo_description_en : row.seo_description_fr) ??
      row.seo_description_fr ??
      null,
  };
}

// Liste blanche calquée sur ce que produit CKEditor Classic. L'écriture est
// réservée aux admins, mais on ne rend jamais du HTML stocké sans filet : une
// base compromise ne doit pas devenir une injection de script.
const ALLOWED_TAGS = [
  "h2", "h3", "h4", "p", "br", "hr",
  "strong", "b", "em", "i", "u", "s", "sub", "sup",
  "ul", "ol", "li", "blockquote",
  "a", "table", "thead", "tbody", "tr", "th", "td",
  "figure", "figcaption",
];

export function sanitizeLegalHtml(html: string): string {
  if (!html) return "";
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      a: ["href", "name", "target", "rel"],
      td: ["colspan", "rowspan"],
      th: ["colspan", "rowspan"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    // Les liens sortants d'un document légal pointent vers des tiers
    // (autorité de contrôle, sous-traitants) : on les ouvre à part.
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", {
        target: "_blank",
        rel: "noopener noreferrer",
      }),
    },
  });
}
