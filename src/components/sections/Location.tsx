"use client";

import { useEffect, useRef, useState } from "react";
import { ATTRACTIONS, CATEGORIES, site, type Category } from "@/config/site";
import { cn } from "@/lib/cn";

/**
 * Drawn map (swap for Mapbox / Google Maps when the address is final). On arrival the
 * camera starts tight on the villa and pulls back to the whole area, then the
 * places appear one by one. Filter by category to spotlight a group.
 */
export default function Location() {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  const [cat, setCat] = useState<Category | "All">("All");
  const [hot, setHot] = useState<string | null>(null);

  useEffect(() => {
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (setSeen(true), io.disconnect()), { threshold: 0.35 });
    ref.current && io.observe(ref.current);
    return () => io.disconnect();
  }, []);

  const on = (c: Category) => cat === "All" || cat === c;

  return (
    <section id="location" data-nav-theme="light" className="bg-sand px-6 py-28 text-ink md:px-12 md:py-44">
      <div className="mx-auto grid max-w-[1500px] gap-14 lg:grid-cols-12 lg:gap-x-16">
        <div className="lg:col-span-7">
          <div ref={ref} className="relative aspect-[4/5] w-full overflow-hidden border border-umber/30 bg-[#e3dac9] md:aspect-[5/4]">
            <div
              className="absolute inset-0 transition-[transform,filter] duration-[2800ms] ease-cine"
              style={{ transform: seen ? "scale(1)" : "scale(3.4)", filter: seen ? "blur(0)" : "blur(5px)" }}
            >
              <svg viewBox="0 0 500 400" className="h-full w-full" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Map of the area around the villa">
                <g fill="none" stroke="#69645a" strokeOpacity=".25">
                  {[90, 120, 150, 180].map((y) => (
                    <path key={y} d={`M-20 ${y} C90 ${y - 50} 170 ${y + 40} 260 ${y - 10} S420 ${y - 70} 520 ${y - 20}`} />
                  ))}
                </g>
                <path d="M-20 300 C80 270 140 330 240 305 S400 250 520 290 L520 420 L-20 420 Z" fill="#1f4d3a" fillOpacity=".22" />
                <path d="M-20 300 C80 270 140 330 240 305 S400 250 520 290" fill="none" stroke="#1f4d3a" strokeOpacity=".7" strokeWidth="1.5" />
                <g fill="none" stroke="#69645a" strokeOpacity=".45" strokeWidth="2" strokeLinecap="round">
                  <path d="M60 -10 C120 90 190 140 250 200 S330 300 380 420" />
                  <path d="M-10 230 C100 220 200 205 250 200 S400 170 520 150" strokeWidth="1.5" />
                </g>
                <g fill="none" stroke="#1c201d" strokeOpacity=".3" strokeDasharray="3 6">
                  <circle cx="250" cy="200" r="70" />
                  <circle cx="250" cy="200" r="140" />
                </g>

                {ATTRACTIONS.map((a, i) => {
                  const lit = on(a.cat);
                  const active = hot === a.name;
                  return (
                    <g
                      key={a.name}
                      onPointerEnter={() => setHot(a.name)}
                      onPointerLeave={() => setHot(null)}
                      className="cursor-pointer transition-opacity duration-700"
                      style={{ opacity: !seen ? 0 : lit ? 1 : 0.15, transitionDelay: seen ? `${1600 + i * 130}ms` : "0ms" }}
                    >
                      {active && <line x1="250" y1="200" x2={a.x} y2={a.y} stroke="#b8975a" strokeWidth="1.5" strokeDasharray="4 4" />}
                      <circle cx={a.x} cy={a.y} r={active ? 8 : 5.5} fill={a.cat === "Beaches" ? "#1f4d3a" : "#b8975a"} stroke="#f6f2ea" strokeWidth="2" className="transition-all duration-300" />
                      {(active || cat === a.cat) && (
                        <text x={a.x} y={a.y - 13} textAnchor="middle" fontSize="11" fill="#1c201d" stroke="#e3dac9" strokeWidth="3" paintOrder="stroke">
                          {a.name} · {a.time}
                        </text>
                      )}
                    </g>
                  );
                })}
                <circle cx="250" cy="200" r="7" fill="#1c201d" />
                <circle cx="250" cy="200" r="16" fill="none" stroke="#1c201d" strokeOpacity=".5" />
              </svg>
            </div>
            <p className="pointer-events-none absolute left-4 top-4 bg-ink px-3 py-1.5 text-[12px] font-light tracking-[0.1em] text-bone">
              {site.name}
            </p>
            <p className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-bone/90 to-transparent p-4 text-[12px] font-light text-umber">
              Illustrative map · replace with Mapbox / Google Maps once the address is final
            </p>
          </div>
        </div>

        <div className="lg:col-span-5 lg:pt-4">
          <h2 className="font-display text-[clamp(2.4rem,4.6vw,4.4rem)] leading-[1.05]">Set apart, never far.</h2>
          <p className="mt-6 max-w-md text-lg font-light leading-relaxed text-umber">
            {site.location}. Private enough to disappear, close enough to dine out on a whim.
          </p>

          <div className="mt-10 flex flex-wrap gap-2" role="group" aria-label="Filter nearby places">
            {(["All", ...CATEGORIES] as const).map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={cat === c}
                onClick={() => setCat(c)}
                className={cn(
                  "border px-4 py-2 text-[13px] font-light tracking-[0.06em] transition-all duration-300 hover:-translate-y-0.5",
                  cat === c ? "border-lagoon bg-lagoon text-bone" : "border-ink/30 hover:border-ink"
                )}
              >
                {c}
              </button>
            ))}
          </div>

          <ul className="mt-8 border-t border-ink/20">
            {ATTRACTIONS.filter((a) => on(a.cat)).map((a) => (
              <li
                key={a.name}
                onPointerEnter={() => setHot(a.name)}
                onPointerLeave={() => setHot(null)}
                className={cn("flex items-baseline justify-between gap-6 border-b border-ink/20 py-3.5 transition-colors", hot === a.name && "bg-bone/50")}
              >
                <span className="text-lg font-light">
                  {a.name} <span className="ml-2 text-[12px] tracking-[0.08em] text-umber">{a.cat}</span>
                </span>
                <span className="shrink-0 font-display text-2xl text-lagoon">{a.time}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
