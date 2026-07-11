// Design section header (.sect-head 12-col grid: num / title / kicker).
// Mirrors the prototype's SectionHead — always renders "{num} —".
export function SectionHead({
  num,
  titlePre,
  titleItalic,
  titleRest,
  kicker,
}: {
  num: string;
  titlePre: string;
  titleItalic: string;
  titleRest?: string;
  kicker: string;
}) {
  return (
    <header className="sect-head">
      <div className="sect-num">{num} —</div>
      <h2 className="sect-title">
        {titlePre}
        <em>{titleItalic}</em>
        {titleRest}
      </h2>
      <p className="sect-kicker">{kicker}</p>
    </header>
  );
}
