"use client";

import SafeImage from "@/components/ui/SafeImage";
import { FEATURES, img } from "@/config/site";

/** Eight features. Hovering tilts the card toward the pointer and pushes the picture in, like a small camera move. */
export default function FeatureGrid() {
  const tilt = (e: React.PointerEvent<HTMLElement>) => {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(900px) rotateY(${x * 9}deg) rotateX(${-y * 9}deg) translateY(-8px)`;
    el.style.setProperty("--px", `${-x * 24}px`);
    el.style.setProperty("--py", `${-y * 24}px`);
  };
  const reset = (e: React.PointerEvent<HTMLElement>) => {
    e.currentTarget.style.transform = "";
  };

  return (
    <div className="mb-28 md:mb-44">
      <h2 className="font-display text-[clamp(2.2rem,5vw,4.6rem)] leading-[1.02] tracking-[0.03em]">
        THE PERRY’S VILLE EXPERIENCE
      </h2>
      <ul className="mt-14 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
        {FEATURES.map((f) => (
          <li
            key={f.title}
            onPointerMove={tilt}
            onPointerLeave={reset}
            className="group relative aspect-[3/4] overflow-hidden bg-sand transition-transform duration-500 ease-cine [transform-style:preserve-3d] hover:shadow-[0_30px_60px_-30px_rgba(28,32,29,0.6)]"
          >
            <div
              className="absolute -inset-4 transition-transform duration-[1400ms] ease-cine group-hover:scale-[1.12]"
              style={{ translate: "var(--px,0) var(--py,0)" }}
            >
              <SafeImage src={img(f.frame)} alt={f.title} label={f.title} fill loading="lazy" sizes="(min-width:768px) 25vw, 50vw" className="object-cover" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/5 to-transparent transition-opacity duration-500 group-hover:from-lagoon/70" />
            <div className="absolute inset-x-0 bottom-0 p-4 text-bone md:p-6">
              <span className="text-2xl" aria-hidden>{f.icon}</span>
              <p className="mt-2 font-display text-xl leading-tight md:text-2xl">{f.title}</p>
              <span className="mt-3 block h-px w-8 bg-gold transition-all duration-700 ease-cine group-hover:w-full" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
