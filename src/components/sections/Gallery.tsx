"use client";

import { useMemo, useState } from "react";
import SafeImage from "@/components/ui/SafeImage";
import { GALLERY, img } from "@/config/site";
import { cn } from "@/lib/cn";
import Lightbox from "./Lightbox";

/**
 * Twelve photographs in a 12-column mosaic (two columns on phones and tablets).
 * Every tile is an exact fit for its neighbours: the block edges line up.
 */
export default function Gallery() {
  const [open, setOpen] = useState<number | null>(null);
  const items = useMemo(() => GALLERY.map((g) => ({ src: img(g.frame), label: g.label })), []);

  return (
    <section
      id="gallery"
      data-nav-theme="dark"
      className="bg-ink px-4 py-28 text-bone md:px-12 md:py-44"
    >
      <div className="mx-auto max-w-[1360px]">
        <h2 className="px-2 font-display text-[clamp(2.6rem,6vw,5.6rem)] leading-[1.02] md:px-0">
          Gallery
        </h2>

        <ul className="mt-12 grid grid-cols-2 gap-2 md:mt-20 md:gap-3 lg:auto-rows-[104px] lg:grid-cols-12 lg:gap-4">
          {GALLERY.map((g, i) => {
            return (
              <li
                key={g.frame}
                className={cn(
                  "group relative overflow-hidden bg-[#33291f]",
                  g.wide ? "col-span-2 aspect-[16/10]" : "aspect-[4/5]",
                  "lg:aspect-auto lg:[grid-column:var(--c)] lg:[grid-row:var(--r)]"
                )}
                style={{ "--c": g.col, "--r": g.row } as React.CSSProperties}
              >
                <button
                  type="button"
                  onClick={() => setOpen(i)}
                  aria-label={`Open photo: ${g.label}`}
                  className="absolute inset-0 cursor-zoom-in"
                >
                  <SafeImage
                    src={img(g.frame)}
                    alt={g.label}
                    label={g.label}
                    fill
                    loading="lazy"
                    sizes="(min-width:1024px) 45vw, 50vw"
                    style={{ objectPosition: g.pos }}
                    className="object-cover transition-transform duration-[1200ms] ease-cine group-hover:scale-[1.04]"
                  />
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/70 to-transparent px-4 pb-3 pt-10 text-left text-sm font-light tracking-[0.04em] opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-focus-visible:opacity-100">
                    {g.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <Lightbox items={items} index={open} onIndex={setOpen} />
    </section>
  );
}
