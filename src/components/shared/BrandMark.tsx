import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-[10px]", className)}>
      <span className="inline-grid place-items-center w-[22px] h-[22px] border border-current font-display text-[13px] leading-none pt-px">
        R
      </span>
      <span className="font-sans font-medium tracking-[0.18em] text-[13px]">
        RELIOTE
      </span>
    </span>
  );
}
