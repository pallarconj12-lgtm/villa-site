import { CHAPTERS } from "@/config/frames";
import { cn } from "@/lib/cn";

/** Minimal progress marker: one tick per room, the current room named beside it. */
export default function ChapterRail({
  active,
  onSelect,
}: {
  active: number;
  onSelect?: (i: number) => void;
}) {
  return (
    <div
      className="absolute right-6 top-1/2 z-10 hidden -translate-y-1/2 flex-col items-end gap-[9px] md:right-12 md:flex"
    >
      {CHAPTERS.map((c, i) => (
        <button
          key={c.id}
          type="button"
          onClick={() => onSelect?.(i)}
          aria-label={`Go to ${c.label}`}
          className="group flex items-center gap-3 py-[3px]"
        >
          <span
            className={cn(
              "text-[12px] font-light tracking-[0.08em] text-bone transition-all duration-700 ease-cine",
              i === active ? "translate-x-0 opacity-100" : "translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-70"
            )}
          >
            {c.label}
          </span>
          <span
            className={cn(
              "block h-px transition-all duration-700 ease-cine",
              i === active ? "w-8 bg-bone" : i < active ? "w-3 bg-bone/70" : "w-3 bg-bone/30"
            )}
          />
        </button>
      ))}
    </div>
  );
}
