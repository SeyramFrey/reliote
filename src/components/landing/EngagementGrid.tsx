"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArchitectAnonCard } from "./ArchitectAnonCard";
import { ArchitectCard } from "./ArchitectCard";
import { ArchitectDrawer } from "./ArchitectDrawer";
import { EngagementCharter } from "@/components/forms/EngagementCharter";
import type { ArchitectAnonRow, ClientEngagement } from "@/types/anon";
import type { ArchitectRow } from "./ArchitectIndex";

// Orchestre les états Niveau 2 / Niveau 3 pour les architectes matchés d'un
// projet client. Pour chaque match :
//   - si engagement.status === 'engaged' → on a aussi l'ArchitectRow complet
//     (la RLS l'a laissé passer), on rend ArchitectCard
//   - sinon → on rend ArchitectAnonCard avec un bouton qui ouvre la charte
//
// La carte N3 ouvre le drawer existant (en lecture seule, sans contact direct).
export function EngagementGrid({
  projectId,
  anonArchitects,
  fullArchitects,
  engagements,
}: {
  projectId: string;
  anonArchitects: ArchitectAnonRow[];
  fullArchitects: ArchitectRow[];
  engagements: ClientEngagement[];
}) {
  const router = useRouter();
  const [drawer, setDrawer] = useState<ArchitectRow | null>(null);
  const [charter, setCharter] = useState<{ id: string; handle: string } | null>(
    null
  );

  const engagedByArch = new Map(engagements.map((e) => [e.architect_id, e]));
  const fullByArch = new Map(fullArchitects.map((a) => [a.id, a]));
  const total = anonArchitects.length;

  return (
    <>
      <div className="archi-grid">
        {anonArchitects.map((anon, i) => {
          const engagement = engagedByArch.get(anon.id);
          const full = fullByArch.get(anon.id);
          if (engagement?.status === "engaged" && full) {
            // Niveau 3 — carte complète. Le drawer s'ouvre au clic.
            return (
              <ArchitectCard
                key={anon.id}
                a={full}
                index={i}
                total={total}
                onOpen={() => setDrawer(full)}
              />
            );
          }
          return (
            <ArchitectAnonCard
              key={anon.id}
              a={anon}
              index={i}
              total={total}
              onEngage={(architectId) =>
                setCharter({ id: architectId, handle: anon.anon_handle })
              }
            />
          );
        })}
      </div>

      <ArchitectDrawer architect={drawer} onClose={() => setDrawer(null)} />

      <EngagementCharter
        projectId={projectId}
        architectId={charter?.id ?? ""}
        architectHandle={charter?.handle ?? ""}
        open={charter !== null}
        onClose={() => setCharter(null)}
        onAccepted={() => {
          setCharter(null);
          // Le server action a déjà revalidé /architectes. router.refresh() force
          // le re-fetch en respectant le cache invalidé.
          router.refresh();
        }}
      />
    </>
  );
}
