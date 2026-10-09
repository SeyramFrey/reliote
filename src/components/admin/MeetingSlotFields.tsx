import { TIMEZONE_CHOICES, PARIS_TIME_ZONE } from "@/lib/time/meetingTime";

const field =
  "block mt-1 bg-transparent border-b border-[var(--hairline)] py-1.5 text-sm outline-none focus:border-green";

// Créneau + fuseau de saisie + lien visio, partagés par « planifier » et
// « replanifier ». L'heure saisie est lue dans le fuseau choisi.
export function MeetingSlotFields({ defaultTimeZone = PARIS_TIME_ZONE }: { defaultTimeZone?: string }) {
  return (
    <>
      <label className="block">
        <span className="eyebrow">Créneau</span>
        <input type="datetime-local" name="scheduledAt" required className={field} />
      </label>
      <label className="block">
        <span className="eyebrow">Fuseau de saisie</span>
        <select name="timeZone" defaultValue={defaultTimeZone} className={`${field} max-w-[240px]`}>
          {TIMEZONE_CHOICES.map((z) => (
            <option key={`${z.value}-${z.label}`} value={z.value}>
              {z.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="eyebrow">Lien visio</span>
        <input type="url" name="videoUrl" placeholder="https://meet…" className={`${field} min-w-[220px]`} />
      </label>
    </>
  );
}
