import { cn } from "@/lib/utils";
import { Logo } from "./Logo";

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
    <span className={cn("inline-flex items-center", lg ? "gap-3" : "gap-[10px]", className)}>
      <Logo inverse={inverse} className={cn("w-auto shrink-0", lg ? "h-[36px]" : "h-[26px]")} />
      <span
        className={cn(
          "font-sans font-medium",
          lg ? "tracking-[0.2em] text-[18px]" : "tracking-[0.18em] text-[13px]",
        )}
      >
        RELIOTE
      </span>
    </span>
  );
}
