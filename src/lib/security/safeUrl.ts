// Liens et images saisis par l'admin puis rendus en href/src sur la landing :
// http(s) absolu ou chemin du site, jamais « javascript: », « data: » ni
// « //hôte » (URL relative au protocole).
export function safeUrl(value: string | null | undefined): string | null {
  const v = String(value ?? "").trim();
  if (/^https?:\/\/[^\s]+$/i.test(v)) return v;
  if (/^\/(?!\/)[^\s]*$/.test(v)) return v;
  return null;
}
