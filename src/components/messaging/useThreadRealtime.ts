"use client";
import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

const TABLES = ["messages", "message_attachments", "message_thread_reads"] as const;

// Abonnement temps réel au fil ouvert. Les événements ne servent que de
// signal : le composant recharge alors la vue calculée côté serveur. La RLS
// (0017) garantit qu'on ne reçoit que les événements des fils lisibles.
// Rechargement aussi à chaque (ré)abonnement et au retour sur l'onglet, pour
// rattraper ce qui a pu être manqué pendant une coupure.
export function useThreadRealtime(threadId: string, onChange: () => void) {
  const cb = useRef(onChange);
  useEffect(() => {
    cb.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const supabase = createClient();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;
    const fire = () => {
      clearTimeout(timer);
      timer = setTimeout(() => cb.current(), 150);
    };
    const channel = supabase.channel(`thread:${threadId}`);
    for (const table of TABLES) {
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table, filter: `thread_id=eq.${threadId}` },
        fire,
      );
    }

    // Le jeton de l'utilisateur doit être posé AVANT l'abonnement, sinon le
    // canal rejoint avec la clé anonyme et la RLS ne laisse rien passer.
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      if (data.session) supabase.realtime.setAuth(data.session.access_token);
      channel.subscribe((status) => {
        if (status === "SUBSCRIBED") fire();
      });
    });

    const onVisible = () => {
      if (document.visibilityState === "visible") fire();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
      supabase.removeChannel(channel);
    };
  }, [threadId]);
}
