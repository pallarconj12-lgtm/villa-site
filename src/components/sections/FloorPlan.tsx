"use client";

import { useRef, useState } from "react";
import SafeImage from "@/components/ui/SafeImage";
import { ROOMS, img } from "@/config/site";
import { cn } from "@/lib/cn";

const CELL = 64; // px per grid unit at zoom 1

/**
 * Interactive 3D floor plan: drag to rotate, +/- to zoom, click a room to lift it
 * and fly the "camera" into a photograph of it.
 */
export default function FloorPlan() {
  const [sel, setSel] = useState<string>("living");
  const [rot, setRot] = useState({ x: 55, z: -28 });
  const [zoom, setZoom] = useState(1);
  const drag = useRef<{ x: number; y: number } | null>(null);
  const room = ROOMS.find((r) => r.id === sel)!;

  return (
    <section
      id="floorplan"
      data-nav-theme="dark"
      className="bg-ink px-6 py-28 text-bone md:px-12 md:py-40"
    >
      <div className="mx-auto grid max-w-[1500px] gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <h2 className="font-display text-[clamp(2.4rem,5vw,4.6rem)] leading-[1.02]">Walk the plan.</h2>
          <p className="mt-5 max-w-[38ch] text-lg font-light text-haze">
            Drag to turn the villa, zoom in, and choose a room to step inside.
          </p>
          <ul className="mt-10 grid grid-cols-2 gap-x-6 gap-y-1">
            {ROOMS.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => setSel(r.id)}
                  aria-pressed={sel === r.id}
                  className={cn(
                    "w-full border-b border-bone/15 py-3 text-left text-[15px] font-light tracking-[0.04em] transition-colors hover:text-gold",
                    sel === r.id ? "text-gold" : "text-bone/80"
                  )}
                >
                  {r.name}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-7">
          {/* 3D plan */}
          <div
            className="relative h-[360px] cursor-grab touch-none select-none overflow-hidden border border-bone/10 bg-[radial-gradient(ellipse_at_center,rgba(157,191,169,0.12),transparent_70%)] active:cursor-grabbing md:h-[440px]"
            style={{ perspective: 1400 }}
            onPointerDown={(e) => {
              drag.current = { x: e.clientX, y: e.clientY };
              e.currentTarget.setPointerCapture(e.pointerId);
            }}
            onPointerMove={(e) => {
              if (!drag.current) return;
              const dx = e.clientX - drag.current.x;
              const dy = e.clientY - drag.current.y;
              drag.current = { x: e.clientX, y: e.clientY };
              setRot((r) => ({ x: Math.min(80, Math.max(20, r.x - dy * 0.3)), z: r.z + dx * 0.4 }));
            }}
            onPointerUp={() => (drag.current = null)}
          >
            <div
              className="absolute left-1/2 top-1/2 transition-transform duration-300 ease-out [transform-style:preserve-3d]"
              style={{
                width: 12 * CELL,
                height: 6 * CELL,
                transform: `translate(-50%,-50%) scale(${zoom * 0.8}) rotateX(${rot.x}deg) rotateZ(${rot.z}deg)`,
              }}
            >
              {ROOMS.map((r) => {
                const on = r.id === sel;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSel(r.id)}
                    aria-label={`${r.name}, ${r.size}`}
                    className={cn(
                      "absolute flex items-center justify-center border text-[11px] tracking-[0.08em] transition-all duration-700 ease-cine [transform-style:preserve-3d]",
                      "water" in r && r.water ? "bg-lagoon/60 border-lagoon-light/50" : "bg-bone/10 border-bone/30",
                      on && "border-gold bg-gold/25 shadow-[0_0_40px_rgba(184,151,90,0.45)]"
                    )}
                    style={{
                      left: r.x * CELL,
                      top: r.y * CELL,
                      width: r.w * CELL,
                      height: r.h * CELL,
                      transform: `translateZ(${on ? 46 : 8}px)`,
                    }}
                  >
                    <span style={{ transform: `rotateZ(${-rot.z}deg)` }} className="pointer-events-none">
                      {r.name}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="absolute bottom-3 right-3 flex gap-2">
              {[["−", -0.2], ["+", 0.2]].map(([l, d]) => (
                <button
                  key={l}
                  type="button"
                  aria-label={l === "+" ? "Zoom in" : "Zoom out"}
                  onClick={() => setZoom((z) => Math.min(1.8, Math.max(0.6, z + (d as number))))}
                  className="h-9 w-9 border border-bone/30 text-lg leading-none transition-colors hover:bg-bone hover:text-ink"
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* the room: re-mounted on every selection so the push-in plays */}
          <div key={room.id} className="relative mt-4 aspect-[16/8] overflow-hidden bg-sand">
            <div className="push-in absolute inset-0">
              <SafeImage src={img(room.frame)} alt={room.name} label={room.name} fill loading="lazy" sizes="(min-width:1024px) 55vw, 92vw" className="object-cover" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-ink/70 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-5 md:p-7">
              <p className="font-display text-3xl md:text-4xl">{room.name}</p>
              <p className="text-[13px] font-light tracking-[0.12em] text-gold">{room.size}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
