// Cycle de vie d'un projet, piloté par les actions de l'admin et du porteur :
//   new → matched → selected → meeting_proposed → meeting_confirmed → in_review → closed
// Une seule règle par événement, et jamais de retour en arrière « par
// accident » : un recalcul ou une nouvelle proposition ne fait pas reculer un
// projet déjà plus avancé.

export type ProjectStatus =
  | "new"
  | "matched"
  | "selected"
  | "meeting_proposed"
  | "meeting_confirmed"
  | "in_review"
  | "closed";

export type WorkflowEvent =
  | "matched"
  | "rematched"
  | "proposed"
  | "meeting_scheduled"
  | "meeting_confirmed"
  | "meeting_cancelled"
  | "meeting_declined"
  | "proposal_withdrawn"
  | "meeting_completed"
  | "closed";

export type WorkflowContext = {
  current: ProjectStatus;
  /** RDV encore ouverts (proposed / rescheduled / confirmed) après l'événement. */
  activeMeetings: number;
  /** Engagements encore proposés ou engagés après l'événement. */
  activeProposals: number;
};

const ORDER: ProjectStatus[] = [
  "new",
  "matched",
  "selected",
  "meeting_proposed",
  "meeting_confirmed",
  "in_review",
  "closed",
];

const before = (a: ProjectStatus, b: ProjectStatus) => ORDER.indexOf(a) < ORDER.indexOf(b);
const forwardTo = (current: ProjectStatus, target: ProjectStatus) =>
  before(current, target) ? target : current;

export function projectStatusAfter(event: WorkflowEvent, ctx: WorkflowContext): ProjectStatus {
  const { current } = ctx;
  if (current === "closed") return "closed";

  switch (event) {
    case "matched":
    case "rematched":
      return forwardTo(current, "matched");
    case "proposed":
      return forwardTo(current, "selected");
    case "meeting_scheduled":
      return forwardTo(current, "meeting_proposed");
    case "meeting_confirmed":
      return forwardTo(current, "meeting_confirmed");
    case "meeting_cancelled":
    case "meeting_declined":
    case "proposal_withdrawn":
      if (ctx.activeMeetings > 0) return current;
      if (!before(current, "in_review")) return current;
      return ctx.activeProposals > 0 ? "selected" : "matched";
    case "meeting_completed":
      return forwardTo(current, "in_review");
    case "closed":
      return "closed";
  }
}
