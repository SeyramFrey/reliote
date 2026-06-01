import { getTranslations } from "next-intl/server";
import { Hairline } from "@/components/shared/Hairline";

export async function StatsBar() {
  const t = await getTranslations("stats");
  const items = ["a", "b", "c", "d"].map((k) => ({ num: t(`${k}.num`), label: t(`${k}.label`) }));
  return (
    <section className="bg-paper">
      <div className="page-edge py-16 grid grid-cols-2 md:grid-cols-4 gap-y-10">
        {items.map((it, i) => (
          <div key={i} className="flex flex-col gap-2">
            <span className="font-display text-[56px] leading-none text-ink">{it.num}</span>
            <span className="eyebrow">{it.label}</span>
          </div>
        ))}
      </div>
      <div className="page-edge"><Hairline /></div>
    </section>
  );
}
