import { cn } from "@/lib/utils";
import { Logo } from "./Logo";

/** Le monogramme tient lieu de R : logo + « ELIOTE », posés sur la même ligne de base. */
export function BrandMark({
  className,
  inverse = false,
  size = "md",
}: {
  className?: string;
  /** Fonds sombres : P en paper au lieu du vert. */
  inverse?: boolean;
  /** `lg` : bloc marque du pied de page. */
  size?: "md" | "lg";
}) {
  const lg = size === "lg";
  return (
    <span className={cn("inline-flex items-baseline", lg ? "gap-[4px]" : "gap-[3px]", className)}>
      {/* Sans boîte de base propre, le SVG s'aligne par son bord bas : la queue du R touche la ligne de base. */}
      <Logo inverse={inverse} className={cn("w-auto shrink-0", lg ? "h-[30px]" : "h-[22px]")} />
      <span
        aria-hidden="true"
        className={cn(
          "font-sans font-medium leading-none",
          lg ? "tracking-[0.2em] text-[20px]" : "tracking-[0.18em] text-[15px]",
        )}
      >
        ELIOTE
      </span>
      <span className="sr-only">Reliote</span>
    </span>
  );
}
