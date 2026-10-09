"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

// Relance le matching d'un projet puis recharge la page serveur.
export function RecalculateButton({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  async function recalc() {
    setBusy(true);
    setFailed(false);
    const res = await fetch(`/api/admin/match/recalculate?projectId=${encodeURIComponent(projectId)}`, {
      method: "POST",
    });
    setBusy(false);
    if (!res.ok) setFailed(true);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-3">
      <button onClick={recalc} disabled={busy} className="px-4 py-2 bg-ink text-paper text-sm disabled:opacity-50">
        {busy ? "…" : "Re-calculer"}
      </button>
      {failed && <span className="text-sm text-red-700">Le re-calcul a échoué.</span>}
    </div>
  );
}
