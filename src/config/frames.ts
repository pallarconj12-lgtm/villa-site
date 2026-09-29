/**
 * The scroll journey is built from a numbered sequence of photographs that already
 * describes a camera path through the villa:
 *
 *   public/frames/desktop/frame-001.webp ... frame-039.webp   (1600px wide)
 *   public/frames/mobile/frame-001.webp  ... frame-039.webp   (900px wide)
 *
 * Replace those files with your own photographs (same names, walking order) and
 * adjust the chapter / transition tables below if the count or order changes.
 */

export const FRAME_COUNT = 39;

export type FrameKind = "desktop" | "mobile";

export const framePath = (n: number, kind: FrameKind = "desktop") =>
  `/frames/${kind}/frame-${String(n).padStart(3, "0")}.webp`;

/* ------------------------------------------------------------------ */
/* Chapters: which frames belong to which room (1-indexed, inclusive)  */
/* ------------------------------------------------------------------ */

export const CHAPTERS = [
  { id: "aerial", label: "Aerial", from: 1, to: 5 },
  { id: "exterior", label: "Exterior", from: 6, to: 7 },
  { id: "entrance", label: "Entrance", from: 8, to: 10 },
  { id: "interior", label: "Interior Entrance", from: 11, to: 11 },
  { id: "living", label: "Living Room", from: 12, to: 14 },
  { id: "kitchen", label: "Kitchen", from: 15, to: 16 },
  { id: "dining", label: "Dining", from: 17, to: 18 },
  { id: "corridor", label: "Corridor", from: 19, to: 20 },
  { id: "bedroom", label: "Bedroom", from: 21, to: 23 },
  { id: "bathroom", label: "Bathroom", from: 24, to: 25 },
  { id: "suite", label: "Guest Suite", from: 26, to: 28 },
  { id: "pool", label: "Pool", from: 29, to: 33 },
  { id: "sunset", label: "Sunset", from: 34, to: 39 },
] as const;

export function chapterForFrame(frame1: number): number {
  const i = CHAPTERS.findIndex((c) => frame1 >= c.from && frame1 <= c.to);
  return i === -1 ? 0 : i;
}

/* ------------------------------------------------------------------ */
/* Transitions between consecutive frames                              */
/* ------------------------------------------------------------------ */
/**
 * How the camera "travels" from frame N to frame N+1.
 *
 *  flow   the footage already moves: a soft crossfade
 *  push   a hard scene change: the outgoing frame dollies in, the next settles in
 *  pull   drone pulling away: the next frame settles from a tighter crop
 *  portal the camera passes through an opening: the next frame is revealed
 *         inside a growing doorway mask while the outgoing frame rushes past
 */
export type TransitionType = "flow" | "push" | "pull" | "portal";

const CODE: Record<string, TransitionType> = {
  f: "flow",
  p: "push",
  l: "pull",
  o: "portal",
};

// One letter per step (frame 1→2, 2→3, ... 38→39). 38 letters for 39 frames.
const STEPS = [
  "fff", //  1-4   drone descends toward the villa
  "pp", //   4-6   aerial → facade
  "f", //    6-7   facade
  "o", //    7-8   facade → front doors            (portal)
  "ff", //   8-10  doors slide open
  "o", //    10-11 through the doorway              (portal)
  "ppppppppppp", // 11-22 living, kitchen, dining, corridor, bedroom
  "f", //    22-23 bedroom
  "p", //    23-24 bedroom → bathroom
  "f", //    24-25 bathroom
  "ppp", //  25-28 guest suite
  "o", //    28-29 out through the glass to the pool (portal)
  "f", //    29-30 pool
  "p", //    30-31
  "ff", //   31-33 pool
  "llllll", // 33-39 drone rises and pulls away at sunset
].join("");

export const TRANSITIONS: TransitionType[] = [...STEPS].map((c) => CODE[c]);

if (process.env.NODE_ENV !== "production" && TRANSITIONS.length !== FRAME_COUNT - 1) {
  console.warn(
    `[frames] TRANSITIONS has ${TRANSITIONS.length} entries, expected ${FRAME_COUNT - 1}.`
  );
}

/**
 * Scroll "time" spent on each step, in timeline units. Doorways and scene
 * changes get more scroll distance so the moment can breathe.
 */
const DURATION: Record<TransitionType, number> = {
  flow: 1,
  push: 1.5,
  pull: 1.3,
  portal: 2.4,
};

export const STEP_DURATIONS = TRANSITIONS.map((t) => DURATION[t]);

/** Screens of scroll per timeline unit (desktop / mobile). Raise to slow the journey down. */
export const SCROLL_VH_PER_UNIT = { desktop: 0.18, mobile: 0.15 };

/* ------------------------------------------------------------------ */
/* Text that drifts over the footage (frame numbers are 1-indexed)     */
/* ------------------------------------------------------------------ */

export const OVERLAYS = [
  {
    id: "arrive",
    title: "ARRIVE",
    line: "Where architecture meets nature.",
    from: 3,
    to: 7.4,
    align: "left",
  },
  {
    id: "live",
    title: "LIVE",
    line: "Thoughtfully designed for slow living.",
    from: 12,
    to: 18,
    align: "right",
  },
  {
    id: "rest",
    title: "REST",
    line: "Wake up somewhere extraordinary.",
    from: 21,
    to: 25.5,
    align: "left",
  },
  {
    id: "escape",
    title: "WAKE UP TO INFINITY.",
    line: "Then out, toward the horizon.",
    from: 30,
    to: 37.5,
    align: "center",
  },
] as const;

/** Frames used by the reduced-motion (no animation) version of the journey. */
export const STATIC_STOPS = [
  { frame: 6, label: "Exterior" },
  { frame: 8, label: "Entrance" },
  { frame: 11, label: "Interior Entrance" },
  { frame: 13, label: "Living Room" },
  { frame: 15, label: "Kitchen" },
  { frame: 17, label: "Dining" },
  { frame: 22, label: "Bedroom" },
  { frame: 24, label: "Bathroom" },
  { frame: 32, label: "Pool" },
  { frame: 38, label: "Sunset" },
] as const;
