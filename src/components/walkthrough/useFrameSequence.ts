"use client";

import { useEffect, useRef, useState } from "react";
import { FRAME_COUNT, framePath, type FrameKind } from "@/config/frames";

export type Drawable = ImageBitmap | HTMLImageElement;

export type FrameEntry = {
  img: Drawable | null;
  state: "idle" | "loading" | "ready" | "error";
};

/**
 * Preloads the walkthrough frames into memory so the canvas can paint any frame
 * instantly while scrolling. Frame 1 loads first; the rest stream in behind it.
 * Phones get the lighter 900px set.
 */
export function useFrameSequence() {
  const frames = useRef<FrameEntry[]>(
    Array.from({ length: FRAME_COUNT }, () => ({ img: null, state: "idle" as const }))
  );
  const onLoad = useRef<(index: number) => void>(() => {});
  const [progress, setProgress] = useState(0);
  const [firstReady, setFirstReady] = useState(false);

  useEffect(() => {
    const kind: FrameKind = window.matchMedia("(max-width: 767px)").matches
      ? "mobile"
      : "desktop";
    const abort = new AbortController();
    let cancelled = false;
    let done = 0;

    const load = async (i: number) => {
      const entry = frames.current[i];
      entry.state = "loading";
      try {
        const res = await fetch(framePath(i + 1, kind), { signal: abort.signal });
        if (!res.ok) throw new Error(String(res.status));
        const blob = await res.blob();
        entry.img =
          typeof createImageBitmap === "function"
            ? await createImageBitmap(blob) // decoded off the main thread
            : await decodeWithImage(blob);
        entry.state = "ready";
      } catch {
        if (cancelled) return;
        entry.state = "error";
      }
      if (cancelled) return;
      done += 1;
      setProgress(done / FRAME_COUNT);
      if (i === 0 && entry.state === "ready") setFirstReady(true);
      onLoad.current(i);
    };

    // Frame 1 first (it is on screen), then a small pool works through the rest in order.
    (async () => {
      await load(0);
      let next = 1;
      const worker = async () => {
        while (!cancelled && next < FRAME_COUNT) {
          const i = next++;
          await load(i);
        }
      };
      await Promise.all(Array.from({ length: 4 }, worker));
    })();

    return () => {
      cancelled = true;
      abort.abort();
    };
  }, []);

  return { frames, onLoad, progress, firstReady };
}

function decodeWithImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = reject;
    image.src = url;
  });
}
