export function Hairline({ vertical = false }: { vertical?: boolean }) {
  return <span className={vertical ? "hairline-v" : "hairline"} aria-hidden />;
}
