"use client";

import { useRef, useState } from "react";
import { useLenis } from "@/components/providers/SmoothScroll";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import SafeImage from "@/components/ui/SafeImage";
import { site } from "@/config/site";
import {
  CHAPTERS,
  FRAME_COUNT,
  OVERLAYS,
  STEP_DURATIONS,
  TRANSITIONS,
  chapterForFrame,
  framePath,
} from "@/config/frames";
import { cn } from "@/lib/cn";
import { useFrameSequence } from "./useFrameSequence";
import { createRenderer } from "./renderer";
import ChapterRail from "./ChapterRail";

/** Seconds of travel per timeline unit (a doorway is 2.4 units). Raise to slow the camera. */
const SECONDS_PER_UNIT = 0.85;
/** Frames (0-indexed) where a click stops: the start of every room, then the last frame. */
const BEATS = [...CHAPTERS.map((c) => c.from - 1), FRAME_COUNT - 1];

const smooth = (x: number) => {
  const t = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
};

const alignClass = {
  left: "items-start text-left",
  right: "items-end text-right md:pr-[6vw]",
  center: "items-center text-center",
} as const;

/**
 * CLICK → APPROACH → ENTER → WALK THROUGH → EXPLORE → STEP OUTSIDE
 *
 * One full-screen stage. Each click flies the camera to the next room: a GSAP
 * tween moves a fractional frame position through the photo sequence while the
 * renderer composes zoom / mask / crossfade between frames. Hero, text moments
 * and progress are all derived from that one playhead. The page scrolls normally.
 */
export default function ClickJourney() {
  const root = useRef<HTMLElement>(null);
  const cam = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [chapter, setChapter] = useState(0);
  const [atEnd, setAtEnd] = useState(false);
  const [playing, setPlaying] = useState(false);
  const playRef = useRef(false);
  const goRef = useRef<(dir: 1 | -1) => void>(() => {});
  const jumpRef = useRef<(frame: number) => void>(() => {});
  const lenis = useLenis();
  const lenisRef = useRef(lenis);
  lenisRef.current = lenis;
  const { frames, onLoad, progress, firstReady } = useFrameSequence();

  const setPlay = (v: boolean) => {
    playRef.current = v;
    setPlaying(v);
  };

  useGSAP(
    () => {
      const canvas = canvasRef.current!;
      const camEl = cam.current!;
      const renderer = createRenderer(canvas, () => frames.current, TRANSITIONS);
      const state = { f: 0 }; // where the camera is going (tweened by clicks)
      const disp = { f: 0 }; // where the picture is (eased toward state.f)
      let speed = 0;
      let dir = 1;
      let lastChapter = 0;
      let lastEnd = false;
      let tween: gsap.core.Animation | null = null;

      /** timeline time → fractional frame index (inverse of timeAtFrame, defined below) */
      const frameAtTime = (t: number) => {
        const tt = Math.min(Math.max(t, 0), total);
        let k = STEP_DURATIONS.length - 1;
        for (let i = 0; i < starts.length; i++) {
          if (tt < starts[i] + STEP_DURATIONS[i]) {
            k = i;
            break;
          }
        }
        return k + Math.min(1, (tt - starts[k]) / STEP_DURATIONS[k]);
      };

      /**
       * Walk to frame index `target` as ONE stride: speed builds, holds, then eases to a stop,
       * instead of stopping at every photo. Doorway steps are longer, so they slow the walk.
       */
      const flyTo = (target: number, pace = 1) => {
        tween?.kill();
        const cur = state.f;
        if (Math.abs(target - cur) < 0.001) return;
        dir = target > cur ? 1 : -1;
        const t0 = timeAtFrame(cur + 1);
        const t1 = timeAtFrame(target + 1);
        const u = { t: t0 };
        tween = gsap.to(u, {
          t: t1,
          duration: Math.max(0.5, Math.abs(t1 - t0) * SECONDS_PER_UNIT * pace),
          ease: playRef.current ? "none" : "power2.inOut", // tour: keep walking, no stop between rooms
          onUpdate: () => {
            state.f = frameAtTime(u.t);
          },
        });
      };

      const leave = () => {
        // past the last room: continue down the page
        setPlay(false);
        const el = root.current!;
        const nextEl = el.nextElementSibling as HTMLElement | null;
        if (lenisRef.current && nextEl) lenisRef.current.scrollTo(nextEl);
        else window.scrollTo({ top: el.offsetTop + el.offsetHeight, behavior: "smooth" });
      };
      const next = () => {
        const b = BEATS.find((x) => x > state.f + 0.01);
        if (b === undefined) return leave();
        flyTo(b, playRef.current ? 0.8 : 1);
      };
      const prev = () => {
        const b = [...BEATS].reverse().find((x) => x < state.f - 0.01);
        flyTo(b ?? 0);
      };
      goRef.current = (d) => {
        setPlay(false);
        d > 0 ? next() : prev();
      };
      jumpRef.current = (frame) => {
        setPlay(false);
        flyTo(frame);
      };
      // play: keep advancing room to room until the end
      const playWatch = () => {
        if (playRef.current && !tween?.isActive()) next();
      };
      gsap.ticker.add(playWatch);

      const draw = (time = 0) => {
        renderer.draw(disp.f, true, { time, speed });
        const c = chapterForFrame(Math.round(disp.f) + 1);
        if (c !== lastChapter) {
          lastChapter = c;
          setChapter(c);
        }
        const end = disp.f > FRAME_COUNT - 1.05;
        if (end !== lastEnd) {
          lastEnd = end;
          setAtEnd(end);
        }
      };
      onLoad.current = () => draw(gsap.ticker.time);

      const ro = new ResizeObserver(() => {
        renderer.resize();
        draw(gsap.ticker.time);
      });
      ro.observe(canvas);

      /* ---- timeline geometry: playhead position → overlay windows ---- */
      const starts: number[] = [];
      let total = 0;
      STEP_DURATIONS.forEach((d) => {
        starts.push(total);
        total += d;
      });
      const timeAtFrame = (frame: number) => {
        const f0 = Math.min(Math.max(frame - 1, 0), FRAME_COUNT - 1);
        const k = Math.min(Math.floor(f0), STEP_DURATIONS.length - 1);
        return starts[k] + (f0 - k) * STEP_DURATIONS[k];
      };
      const timeNow = () => timeAtFrame(disp.f + 1);
      const overlays = OVERLAYS.map((o) => {
        const wrap = root.current!.querySelector<HTMLElement>(`[data-overlay="${o.id}"]`)!;
        return {
          wrap,
          title: wrap.querySelector<HTMLElement>(".js-o-title")!,
          line: wrap.querySelector<HTMLElement>(".js-o-line")!,
          tIn: timeAtFrame(o.from),
          tOut: timeAtFrame(o.to),
        };
      });
      const heroEl = root.current!.querySelector<HTMLElement>(".js-hero")!;
      const cueEl = root.current!.querySelector<HTMLElement>(".js-cue")!;
      const progEl = root.current!.querySelector<HTMLElement>(".js-progress")!;

      /** hero, cue, text moments and progress: all read straight off the playhead */
      const choreograph = () => {
        const t = timeNow();
        const heroA = 1 - smooth(t / 1.6);
        gsap.set(heroEl, { autoAlpha: heroA, y: -90 * (1 - heroA) });
        gsap.set(cueEl, { autoAlpha: 1 - smooth(t / 0.6) });
        gsap.set(progEl, { scaleX: t / total });
        overlays.forEach((o) => {
          const a = Math.min(smooth((t - o.tIn) / 1.2), 1 - smooth((t - (o.tOut - 1)) / 1));
          const k = Math.min(1, Math.max(0, (t - o.tIn) / (o.tOut - o.tIn)));
          gsap.set(o.wrap, { autoAlpha: a });
          gsap.set(o.title, { y: 90 - 140 * k, scale: 0.95 + 0.08 * k });
          gsap.set(o.line, { y: 55 - 75 * k });
        });
      };

      /* ---- one orchestrated entrance for the hero ---- */
      gsap.from(".js-hero-line", {
        yPercent: 115,
        duration: 1.7,
        ease: "expo.out",
        stagger: 0.14,
        delay: 0.3,
      });
      gsap.from(".js-cue-inner", { autoAlpha: 0, y: -12, duration: 1.2, delay: 1.6 });

      /* ---- perspective: pointer parallax + a tilt that follows camera speed ---- */
      gsap.set(camEl, { transformPerspective: 1400, scale: 1.05 });
      const rx = gsap.quickTo(camEl, "rotationX", { duration: 0.9, ease: "power3.out" });
      const ry = gsap.quickTo(camEl, "rotationY", { duration: 0.9, ease: "power3.out" });
      const mx = gsap.quickTo(camEl, "x", { duration: 1.1, ease: "power3.out" });
      const my = gsap.quickTo(camEl, "y", { duration: 1.1, ease: "power3.out" });
      let px = 0;
      let py = 0;
      const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
      const onMove = (e: PointerEvent) => {
        px = (e.clientX / window.innerWidth) * 2 - 1;
        py = (e.clientY / window.innerHeight) * 2 - 1;
      };
      if (finePointer) window.addEventListener("pointermove", onMove, { passive: true });

      /* ---- keyboard: ← → (only while the walkthrough is on screen) ---- */
      const onKey = (e: KeyboardEvent) => {
        if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
        const r = root.current!.getBoundingClientRect();
        if (r.bottom < window.innerHeight * 0.4 || r.top > window.innerHeight * 0.6) return;
        goRef.current(e.key === "ArrowRight" ? 1 : -1);
      };
      window.addEventListener("keydown", onKey);

      const tick = (time: number, deltaMs: number) => {
        const dt = Math.min(deltaMs, 64) / 1000;
        const prevF = disp.f;
        disp.f += (state.f - disp.f) * (1 - Math.exp(-dt * 10));
        if (Math.abs(state.f - disp.f) < 0.0003) disp.f = state.f;
        const v = dt > 0 ? Math.abs(disp.f - prevF) / dt : 0; // frames per second
        speed += (Math.min(1, v / 5) - speed) * 0.12;
        draw(time);
        choreograph();
        const tilt = gsap.utils.clamp(-1.2, 1.2, dir * speed * 1.2);
        rx(-tilt - py * 0.7);
        ry(px * 1.1);
        mx(-px * 12);
        my(-py * 8);
      };
      gsap.ticker.add(tick);

      draw(0);
      choreograph();
      return () => {
        tween?.kill();
        gsap.ticker.remove(tick);
        gsap.ticker.remove(playWatch);
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("keydown", onKey);
        ro.disconnect();
        onLoad.current = () => {};
      };
    },
    { scope: root }
  );

  return (
    <section
      id="home"
      ref={root}
      data-nav-theme="dark"
      aria-label="Walkthrough of the villa"
      className="relative h-svh w-full cursor-pointer overflow-hidden bg-ink text-bone"
      onClick={(e) => {
        // a click anywhere on the scene (not on a button) moves to the next room
        if ((e.target as HTMLElement).closest("button")) return;
        goRef.current(1);
      }}
    >
      <p className="sr-only">
        Click, or use the arrow keys, to take a guided walk through {site.name}: from the aerial approach, through the
        entrance, living room, kitchen, dining room, bedroom and bathroom, out to the pool and
        the sunset.
      </p>

      {/* camera */}
      <div ref={cam} className="absolute inset-0 will-change-transform">
        {/* first frame as a real <img>: paints immediately, before the canvas is ready */}
        <SafeImage
          src={framePath(1, "desktop")}
          alt=""
          fill
          priority
          sizes="100vw"
          label="Aerial view"
          className={cn("object-cover transition-opacity duration-700", firstReady && "opacity-0")}
        />
        <canvas
          ref={canvasRef}
          role="img"
          aria-label="Scroll-driven walkthrough of the villa"
          className="absolute inset-0 h-full w-full [filter:contrast(1.05)_saturate(1.07)]"
        />
      </div>

      {/* grade + legibility */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-ink/35" />
      <div className="pointer-events-none absolute inset-0 [background:radial-gradient(ellipse_at_center,transparent_55%,rgba(20,14,10,0.45)_100%)]" />

      {/* a whisper of static film grain */}
      <div className="film-grain pointer-events-none absolute inset-0 opacity-[0.045] mix-blend-overlay" />

      {/* hero */}
      <div className="js-hero pointer-events-none absolute inset-x-0 bottom-0 z-10 px-6 pb-[13svh] md:px-12 md:pb-[11svh]">
        <h1 className="font-display text-[clamp(3.4rem,12.5vw,11.5rem)] leading-[0.92] tracking-[-0.01em]">
          <span className="block overflow-hidden pb-[0.08em]">
            <span className="js-hero-line block">{site.name}</span>
          </span>
        </h1>
        <p className="mt-4 overflow-hidden text-lg font-light tracking-[0.04em] md:mt-6 md:text-2xl">
          <span className="js-hero-line block">“{site.tagline}”</span>
        </p>
      </div>

      {/* scroll cue */}
      <div className="js-cue pointer-events-none absolute bottom-7 left-1/2 z-10 -translate-x-1/2 md:bottom-9 md:left-auto md:right-12 md:translate-x-0">
        <div className="js-cue-inner flex flex-col items-center gap-3 text-[13px] font-light tracking-[0.14em]">
          <span>Explore Perry’s Ville ↓</span>
          <span className="cue-line block h-10 w-px bg-bone/60" />
        </div>
      </div>

      {/* story text */}
      {OVERLAYS.map((o) => (
        <div
          key={o.id}
          data-overlay={o.id}
          className={cn(
            "pointer-events-none invisible absolute inset-0 z-10 flex flex-col px-6 md:px-12",
            o.align === "center"
              ? "justify-center pb-[6svh]"
              : "justify-end pb-[14svh] md:pb-[12svh]",
            alignClass[o.align]
          )}
        >
          <h2 className={cn("js-o-title font-display leading-none tracking-[0.05em] [text-shadow:0_2px_40px_rgba(20,14,10,0.45)]", o.title.length > 10 ? "max-w-[12ch] text-[clamp(3rem,9vw,8rem)]" : "text-[clamp(3.6rem,13vw,11rem)]")}>
            {o.title}
          </h2>
          <p className="js-o-line mt-3 max-w-[22ch] text-xl font-light leading-snug [text-shadow:0_1px_24px_rgba(20,14,10,0.6)] md:mt-5 md:max-w-[30ch] md:text-3xl">
            {o.line}
          </p>
        </div>
      ))}

      <ChapterRail active={chapter} onSelect={(i) => jumpRef.current(CHAPTERS[i].from - 1)} />

      {/* controls */}
      <div className="absolute bottom-16 left-6 z-20 flex items-stretch gap-2 md:bottom-9 md:left-12">
        {[
          { label: "← Back", on: () => goRef.current(-1) },
        ].map((b) => (
          <button
            key={b.label}
            type="button"
            onClick={b.on}
            aria-label="Previous room"
            className="border border-bone/40 bg-ink/30 px-4 py-2 text-[12px] font-light tracking-[0.14em] text-bone backdrop-blur-sm transition-colors hover:bg-bone hover:text-ink"
          >
            {b.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => goRef.current(1)}
          aria-label={atEnd ? "Continue to the villa details" : "Next room"}
          className="border border-bone/40 bg-ink/30 px-4 py-2 text-[12px] font-light tracking-[0.14em] text-bone backdrop-blur-sm transition-colors hover:bg-bone hover:text-ink"
        >
          {atEnd ? "Continue ↓" : "Next →"}
        </button>
        <button
          type="button"
          onClick={() => {
            if (playing) return setPlay(false);
            setPlay(true);
            if (atEnd) jumpRef.current(0);
          }}
          aria-pressed={playing}
          className="flex items-center gap-3 border border-bone/40 bg-ink/30 px-4 py-2 text-[12px] font-light tracking-[0.14em] text-bone backdrop-blur-sm transition-colors hover:bg-bone hover:text-ink"
        >
          <span aria-hidden>{playing ? "❚❚" : "▶"}</span>
          {playing ? "Pause" : "Play tour"}
        </button>
      </div>

      {/* mobile: current room, quiet, bottom-left */}
      <p
        aria-hidden
        className="pointer-events-none absolute bottom-6 left-6 z-10 text-[12px] font-light tracking-[0.1em] text-bone/80 md:hidden"
      >
        {chapter > 0 ? CHAPTERS[chapter].label : ""}
      </p>

      {/* streaming indicator + scroll progress */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-px bg-bone/10">
        <div className="js-progress h-full origin-left bg-bone/70" />
      </div>
      {progress < 1 && (
        <p
          aria-hidden
          className="pointer-events-none absolute left-6 top-24 z-10 text-[11px] font-light tracking-[0.14em] text-bone/60 md:left-12"
        >
          Preparing the tour {Math.round(progress * 100)}%
        </p>
      )}

    </section>
  );
}
