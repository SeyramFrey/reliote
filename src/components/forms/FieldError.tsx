"use client";
import { useTranslations } from "next-intl";

// Message d'erreur d'un champ. Les schémas renvoient des codes (validation.*) ;
// un message qui n'est pas un code connu est affiché tel quel.
export function FieldError({ message }: { message?: unknown }) {
  const t = useTranslations("validation");
  if (message == null || message === "") return null;
  const code = String(message);
  return <span className="text-xs text-red-700 block mt-1">{t.has(code) ? t(code) : code}</span>;
}
