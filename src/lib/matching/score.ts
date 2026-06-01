export const MAX_SCORE = 30 + 20 + 15 + 10 + 10 + 5; // 90

export type MatchReason =
  | { kind: "specialty"; items: string[]; weight: 30 }
  | { kind: "project_type"; item: string; weight: 20 }
  | { kind: "availability"; weight: 15 }
  | { kind: "experience"; years: number; weight: 10 }
  | { kind: "location"; city: string; weight: 10 }
  | { kind: "rating"; value: number; weight: 5 };

export type ProjectForMatch = {
  id: string;
  project_type: string;
  required_specialties: string[];
  project_location: string;
  budget_range: string | null | undefined;
};

export type ArchitectForMatch = {
  id: string;
  city: string;
  specialties: string[];
  project_types: readonly string[];
  years_experience: number;
  availability: "available" | "busy" | "unavailable";
  rating: number | null;
  status?: string;
};

function parseBudget(s?: string | null): number {
  if (!s) return 0;
  const m = s.match(/(\d+)\s*k/i);
  return m ? Number(m[1]) * 1000 : 0;
}

export function scoreArchitect(p: ProjectForMatch, a: ArchitectForMatch) {
  const reasons: MatchReason[] = [];
  let score = 0;

  const overlap = p.required_specialties.filter((s) => a.specialties.includes(s));
  if (overlap.length > 0) {
    score += 30;
    reasons.push({ kind: "specialty", items: overlap, weight: 30 });
  }

  if (a.project_types.includes(p.project_type)) {
    score += 20;
    reasons.push({ kind: "project_type", item: p.project_type, weight: 20 });
  }

  if (a.availability === "available") {
    score += 15;
    reasons.push({ kind: "availability", weight: 15 });
  }

  const budget = parseBudget(p.budget_range);
  const expThreshold = budget < 50_000 ? 5 : 10;
  if (a.years_experience >= expThreshold) {
    score += 10;
    reasons.push({ kind: "experience", years: a.years_experience, weight: 10 });
  }

  if (a.city && p.project_location.toLowerCase().includes(a.city.toLowerCase())) {
    score += 10;
    reasons.push({ kind: "location", city: a.city, weight: 10 });
  }

  if ((a.rating ?? 0) >= 4.5) {
    score += 5;
    reasons.push({ kind: "rating", value: a.rating ?? 0, weight: 5 });
  }

  return { architectId: a.id, score, reasons };
}

export function rankArchitects(
  p: ProjectForMatch,
  architects: ArchitectForMatch[],
  limit = 5,
) {
  return architects
    .filter((a) => a.status === "verified" && a.availability !== "unavailable")
    .map((a) => scoreArchitect(p, a))
    .sort((x, y) => y.score - x.score)
    .slice(0, limit);
}
