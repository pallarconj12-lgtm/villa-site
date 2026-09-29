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
  SCROLL_VH_PER_UNIT,
  STEP_DURATIONS,
  TRANSITIONS,
  chapterForFrame,
  framePath,
} from "@/config/frames";
import { cn } from "@/lib/cn";
import { useFrameSequence } from "./useFrameSequence";
import { createRenderer } from "./renderer";
import ChapterRail from "./ChapterRail";

/** Length of the hands-free "Play tour" in seconds. */
const TOUR_SECONDS = 75;

const alignClass = {
  left: "items-start text-left",
  right: "items-end text-right md:pr-[6vw]",
  center: "items-center text-center",
} as const;

/**
 * SCROLL → APPROACH → ENTER → WALK THROUGH → EXPLORE → STEP OUTSIDE
 *
 * One pinned, full-screen stage. A single GSAP timeline, scrubbed by scroll,
 * moves a fractional frame position through the photo sequence while the
 * renderer composes zoom / mask / crossfade between frames. The same timeline
 * choreographs the hero, the four text moments, the progress line and the
 * closing fade, so everything moves on one clock.
 */
export default function ScrollJourney() {
  const root = useRef<HTMLElement>(null);
  const cam = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [chapter, setChapter] = useState(0);
  const [playing, setPlaying] = useState(false);
  const playRef = useRef(false);
  const lenis = useLenis();
  const lenisRef = useRef(lenis);
  lenisRef.current = lenis;
  const setPlay = (v: boolean) => {
    playRef.current = v;
    setPlaying(v);
  };
  const { frames, onLoad, progress, firstReady } = useFrameSequence();

  useGSAP(
    () => {
      const canvas = canvasRef.current!;
      const camEl = cam.current!;
      const renderer = createRenderer(canvas, () => frames.current, TRANSITIONS);
      const state = { f: 0 };
      let lastChapter = 0;

      // `state.f` is where the scroll wants the playhead; `disp.f` is where the picture is.
      // Easing between them gives the playhead momentum, like a video that glides to a stop.
      const disp = { f: 0 };
      let speed = 0;
      const draw = (time = 0) => {
        renderer.draw(disp.f, true, { time, speed });
        const c = chapterForFrame(Math.round(disp.f) + 1);
        if (c !== lastChapter) {
          lastChapter = c;
          setChapter(c);
        }
      };
      onLoad.current = () => draw(gsap.ticker.time);

      const ro = new ResizeObserver(() => {
        renderer.resize();
        draw(gsap.ticker.time);
      });
      ro.observe(canvas);

      /* ---- timeline geometry ---- */
      const starts: number[] = [];
      let total = 0;
      STEP_DURATIONS.forEach((d) => {
        starts.push(total);
        total += d;
      });
      /** timeline position at which (1-indexed, fractional) `frame` is on screen */
      const timeAtFrame = (frame: number) => {
        const f0 = Math.min(Math.max(frame - 1, 0), FRAME_COUNT - 1);
        const k = Math.min(Math.floor(f0), STEP_DURATIONS.length - 1);
        return starts[k] + (f0 - k) * STEP_DURATIONS[k];
      };
      const unitPx = () =>
        (window.innerWidth < 768 ? SCROLL_VH_PER_UNIT.mobile : SCROLL_VH_PER_UNIT.desktop) *
        window.innerHeight;

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: () => `+=${Math.round(total * unitPx())}`,
          pin: true,
          scrub: 1.1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      /* ---- the camera: doorways and scene changes ease in/out, footage moves linearly ---- */
      STEP_DURATIONS.forEach((d, k) => {
        tl.fromTo(
          state,
          { f: k },
          { f: k + 1, duration: d, ease: TRANSITIONS[k] === "flow" ? "none" : "power2.inOut" },
          starts[k]
        );
      });

      /* ---- hero, cue, progress, closing fade ---- */
      tl.to(".js-hero", { autoAlpha: 0, y: -90, duration: 1.6, ease: "power2.in" }, 0);
      tl.to(".js-cue", { autoAlpha: 0, duration: 0.6 }, 0);
      tl.fromTo(".js-progress", { scaleX: 0 }, { scaleX: 1, duration: total }, 0);
      tl.fromTo(
        ".js-endfade",
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 1.4, ease: "power1.in" },
        total - 1.4
      );

      /* ---- text: fades in, drifts at two speeds (parallax), fades out ---- */
      OVERLAYS.forEach((o) => {
        const tIn = timeAtFrame(o.from);
        const tOut = timeAtFrame(o.to);
        const wrap = `[data-overlay="${o.id}"]`;
        tl.fromTo(wrap, { autoAlpha: 0 }, { autoAlpha: 1, duration: 1.2, ease: "power1.out" }, tIn);
        tl.to(wrap, { autoAlpha: 0, duration: 1, ease: "power1.in" }, tOut - 1);
        tl.fromTo(
          `${wrap} .js-o-title`,
          { y: 90, scale: 0.95 },
          { y: -50, scale: 1.03, duration: tOut - tIn },
          tIn
        );
        tl.fromTo(`${wrap} .js-o-line`, { y: 55 }, { y: -20, duration: tOut - tIn }, tIn);
      });

      /* ---- one orchestrated entrance for the hero (not scroll-driven) ---- */
      gsap.from(".js-hero-line", {
        yPercent: 115,
        duration: 1.7,
        ease: "expo.out",
        stagger: 0.14,
        delay: 0.3,
      });
      gsap.from(".js-cue-inner", { autoAlpha: 0, y: -12, duration: 1.2, delay: 1.6 });

      /* ---- perspective: pointer parallax + a tilt that follows scroll velocity ---- */
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
      const st = tl.scrollTrigger!;
      const stop = () => playRef.current && setPlay(false);
      window.addEventListener("wheel", stop, { passive: true });
      window.addEventListener("touchstart", stop, { passive: true });
      window.addEventListener("keydown", stop);
      const tick = (time: number, deltaMs: number) => {
        const dt = Math.min(deltaMs, 64) / 1000;
        // hands-free tour: advance the scroll at a steady pace
        if (playRef.current && dt > 0) {
          const y = st.scroll() + ((st.end - st.start) / TOUR_SECONDS) * dt;
          if (y >= st.end - 2) setPlay(false);
          else if (lenisRef.current) lenisRef.current.scrollTo(y, { immediate: true, force: true });
          else window.scrollTo(0, y);
        }
        const prev = disp.f;
        disp.f += (state.f - disp.f) * (1 - Math.exp(-dt * 9));
        if (Math.abs(state.f - disp.f) < 0.0003) disp.f = state.f;
        const v = dt > 0 ? Math.abs(disp.f - prev) / dt : 0; // frames per second
        speed += (Math.min(1, v / 5) - speed) * 0.12;
        draw(time);
        const tilt = gsap.utils.clamp(-1.2, 1.2, -st.getVelocity() / 1800);
        rx(tilt - py * 0.7);
        ry(px * 1.1);
        mx(-px * 12);
        my(-py * 8);
      };
      gsap.ticker.add(tick);

      draw(0);
      return () => {
        gsap.ticker.remove(tick);
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("wheel", stop);
        window.removeEventListener("touchstart", stop);
        window.removeEventListener("keydown", stop);
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
      className="relative h-svh w-full overflow-hidden bg-ink text-bone"
    >
      <p className="sr-only">
        Scroll to take a guided walk through {site.name}: from the aerial approach, through the
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
          className="absolute inset-0 h-full w-full"
        />
      </div>

      {/* grade + legibility */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-ink/35" />
      <div className="pointer-events-none absolute inset-0 [background:radial-gradient(ellipse_at_center,transparent_55%,rgba(20,14,10,0.45)_100%)]" />

      {/* film: animated grain, slow light sweep, soft grade */}
      <div className="film-grain pointer-events-none absolute -inset-[20%] opacity-[0.1] mix-blend-overlay" />
      <div className="light-sweep pointer-events-none absolute inset-0 mix-blend-soft-light" />

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
          <span>Scroll to Explore ↓</span>
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
          <h2 className="js-o-title font-display text-[clamp(3.6rem,13vw,11rem)] leading-none tracking-[0.05em] [text-shadow:0_2px_40px_rgba(20,14,10,0.45)]">
            {o.title}
          </h2>
          <p className="js-o-line mt-3 max-w-[22ch] text-xl font-light leading-snug [text-shadow:0_1px_24px_rgba(20,14,10,0.6)] md:mt-5 md:max-w-[30ch] md:text-3xl">
            {o.line}
          </p>
        </div>
      ))}

      <ChapterRail active={chapter} />

      <button
        type="button"
        onClick={() => setPlay(!playing)}
        aria-pressed={playing}
        className="absolute bottom-16 left-6 z-20 flex items-center gap-3 border border-bone/40 bg-ink/30 px-4 py-2 text-[12px] font-light tracking-[0.14em] text-bone backdrop-blur-sm transition-colors hover:bg-bone hover:text-ink md:bottom-9 md:left-12"
      >
        <span aria-hidden>{playing ? "❚❚" : "▶"}</span>
        {playing ? "Pause tour" : "Play tour"}
      </button>

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

      {/* dissolve into the next (walnut) section */}
      <div className="js-endfade pointer-events-none invisible absolute inset-0 z-20 bg-ink" />
    </section>
  );
}
