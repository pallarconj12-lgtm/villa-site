"use client";

import { useCallback, useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import SafeImage from "@/components/ui/SafeImage";
import { useLenis } from "@/components/providers/SmoothScroll";

export type LightboxItem = { src: string; label: string };

type Props = {
  items: LightboxItem[];
  index: number | null;
  onIndex: (i: number | null) => void;
};

/** Fullscreen viewer: arrows / swipe to move, Escape to close, focus stays inside. */
export default function Lightbox({ items, index, onIndex }: Props) {
  const lenis = useLenis();
  const root = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const opener = useRef<Element | null>(null);
  const touchX = useRef<number | null>(null);
  const isOpen = index !== null;

  const go = useCallback(
    (dir: 1 | -1) => {
      if (index === null) return;
      onIndex((index + dir + items.length) % items.length);
    },
    [index, items.length, onIndex]
  );

  /* open / close side effects */
  useEffect(() => {
    if (!isOpen) return;
    opener.current = document.activeElement;
    lenis?.stop();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeBtn.current?.focus();

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduce && root.current) {
      gsap.fromTo(root.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5, ease: "power2.out" });
      gsap.fromTo(
        root.current.querySelector(".js-lb-img"),
        { scale: 0.94 },
        { scale: 1, duration: 0.9, ease: "expo.out" }
      );
    }
    return () => {
      lenis?.start();
      document.body.style.overflow = prev;
      (opener.current as HTMLElement | null)?.focus?.();
    };
  }, [isOpen, lenis]);

  /* keyboard */
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onIndex(null);
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "Tab" && root.current) {
        const f = root.current.querySelectorAll<HTMLElement>("button");
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, go, onIndex]);

  if (!isOpen) return null;
  const item = items[index];

  return (
    <div
      ref={root}
      role="dialog"
      aria-modal="true"
      aria-label={`${item.label}, image ${index + 1} of ${items.length}`}
      data-lenis-prevent
      className="fixed inset-0 z-[100] flex flex-col bg-ink/95 text-bone backdrop-blur-sm"
      onClick={() => onIndex(null)}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        touchX.current = null;
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
      }}
    >
      <div className="flex h-20 shrink-0 items-center justify-between px-6 md:px-12">
        <p className="text-sm font-light tracking-[0.1em] text-haze">
          {index + 1} / {items.length}
        </p>
        <button
          ref={closeBtn}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onIndex(null);
          }}
          className="text-sm tracking-[0.1em] hover:text-lagoon-light"
        >
          Close ✕
        </button>
      </div>

      <div className="relative min-h-0 flex-1 px-4 md:px-20" onClick={(e) => e.stopPropagation()}>
        <div className="js-lb-img relative h-full w-full">
          <SafeImage
            key={item.src}
            src={item.src}
            alt={item.label}
            label={item.label}
            fill
            priority
            quality={85}
            sizes="100vw"
            className="animate-[lbfade_500ms_ease-out] object-contain"
          />
        </div>
        <button
          type="button"
          aria-label="Previous image"
          onClick={() => go(-1)}
          className="absolute left-1 top-1/2 flex h-14 w-14 -translate-y-1/2 items-center justify-center text-3xl hover:text-lagoon-light md:left-6"
        >
          ‹
        </button>
        <button
          type="button"
          aria-label="Next image"
          onClick={() => go(1)}
          className="absolute right-1 top-1/2 flex h-14 w-14 -translate-y-1/2 items-center justify-center text-3xl hover:text-lagoon-light md:right-6"
        >
          ›
        </button>
      </div>

      <p className="shrink-0 px-6 py-6 text-center font-display text-2xl md:py-8 md:text-3xl">
        {item.label}
      </p>
    </div>
  );
}
