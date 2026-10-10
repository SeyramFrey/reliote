// Design section header (.sect-head 12-col grid: num / title / kicker).
// Mirrors the prototype's SectionHead — renders "{num} —" or "{num} — {label} —".
// `num` comes from numberSections() so the sequence follows what is displayed.
export function SectionHead({
  num,
  label,
  titlePre,
  titleItalic,
  titleRest,
  kicker,
}: {
  num: string;
  label?: string;
  titlePre: string;
  titleItalic: string;
  titleRest?: string;
  kicker: string;
}) {
  return (
    <header className="sect-head">
      <div className="sect-num">
        {num} —{label ? ` ${label} —` : ""}
      </div>
      <h2 className="sect-title">
        {titlePre}
        <em>{titleItalic}</em>
        {titleRest}
      </h2>
      <p className="sect-kicker">{kicker}</p>
    </header>
  );
}
