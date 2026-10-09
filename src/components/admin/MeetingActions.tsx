import { MeetingSlotFields } from "./MeetingSlotFields";
import { rescheduleMeeting, setMeetingStatus } from "@/app/[locale]/admin/projets/actions";

const btn = "px-4 py-2 bg-ink text-paper text-sm";
const btnGhost = "px-4 py-2 border border-[var(--hairline)] text-sm hover:border-ink";

// Actions sur un RDV ouvert : replanifier, terminer (si confirmé), annuler.
export function MeetingActions({
  meetingId,
  status,
  returnTo,
}: {
  meetingId: string;
  status: string;
  returnTo?: string;
}) {
  const back = returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null;
  return (
    <div className="mt-3 flex flex-wrap items-end gap-3 border-t border-[var(--hairline-soft)] pt-3">
      <details className="w-full">
        <summary className="cursor-pointer eyebrow hover:text-ink">Replanifier</summary>
        <form action={rescheduleMeeting} className="mt-3 flex flex-wrap items-end gap-3">
          <input type="hidden" name="meetingId" value={meetingId} />
          {back}
          <MeetingSlotFields />
          <button className={btn}>Enregistrer le nouveau créneau</button>
        </form>
      </details>
      {status === "confirmed" && (
        <form action={setMeetingStatus}>
          <input type="hidden" name="meetingId" value={meetingId} />
          {back}
          <input type="hidden" name="status" value="completed" />
          <button className={btn}>Marquer comme tenu</button>
        </form>
      )}
      <form action={setMeetingStatus}>
        <input type="hidden" name="meetingId" value={meetingId} />
          {back}
        <input type="hidden" name="status" value="cancelled" />
        <button className={btnGhost}>Annuler le RDV</button>
      </form>
    </div>
  );
}
