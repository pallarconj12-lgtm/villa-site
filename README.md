# Villa Ocaso: a scroll-driven walkthrough

A cinematic villa website where scrolling *is* the camera:

    CLICK → APPROACH → ENTER → WALK THROUGH → EXPLORE → STEP OUTSIDE

Next.js (App Router) · React · Tailwind CSS v3 · GSAP + ScrollTrigger · Lenis

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
```

Fonts (Italiana + Jost) are fetched from Google Fonts at build time, so the first build needs internet access.

---

## Where your images go

**Everything reads from one numbered sequence.** Your walkthrough photos are already in place:

```
public/frames/desktop/frame-001.webp … frame-039.webp   (1600 px wide, ~4.6 MB total)
public/frames/mobile/frame-001.webp  … frame-039.webp   (900 px wide,  ~1.8 MB total)
```

The scroll journey uses both sets (phones get the lighter one). The hero, gallery, experience
photos, lightbox and booking background all use the **desktop** files, picked by frame number.

### What each frame is (in walking order)

| Frames | Room | Frames | Room |
|---|---|---|---|
| 001–005 | Aerial (drone descends) | 021–023 | Bedroom |
| 006–007 | Exterior / facade | 024–025 | Bathroom |
| 008–010 | Entrance (doors open) | 026–028 | Guest suite |
| 011 | Interior entrance | 029–033 | Pool |
| 012–014 | Living room | 034–039 | Sunset, drone pulls away |
| 015–016 | Kitchen | | |
| 017–018 | Dining | | |
| 019–020 | Corridor | | |

`frame_40` and the `.gif` from your zip are not used (frame 40 repeats the opening aerial).

### Using different photographs

1. Put your photos in a folder, **named so they sort in walking order** (`01.jpg`, `02.jpg` … or `Frame_01…`).
2. Run:
   ```bash
   npm run frames -- ./my-photos
   ```
   This writes `frame-001.webp …` into both `public/frames/desktop` and `public/frames/mobile`.
3. Open `src/config/frames.ts` and update:
   - `FRAME_COUNT`
   - `CHAPTERS` (which frames belong to which room)
   - the `STEPS` string (one letter per step: `f` flow · `p` push · `l` pull · `o` portal, see the comments)
   - `OVERLAYS` (which frames the ARRIVE / LIVE / REST / ESCAPE text sits on)
4. Open `src/config/site.ts` and update `GALLERY` and `EXPERIENCES` (they refer to frame numbers).

### Missing files show a labeled placeholder

If a file isn't there, the slot shows a clearly labeled **IMAGE PLACEHOLDER** card with the exact
path to add (`public/frames/desktop/frame-014.webp`). In the scroll journey the canvas paints the
same placeholder for that frame.

---

## How the scroll journey works

- `src/components/walkthrough/ScrollJourney.tsx` pins one full-screen stage and builds **one GSAP timeline**,
  scrubbed by ScrollTrigger. Frames, text, hero fade, progress line and closing fade all live on it.
- `renderer.ts` paints a `<canvas>` for any fractional frame position and composes the camera move
  between two frames:
  - **flow**: soft crossfade (the footage already moves)
  - **push**: hard scene change, outgoing frame dollies in while the next settles (scale + crossfade)
  - **pull**: the drone rising away at sunset
  - **portal**: the next room is revealed through a **doorway mask** that grows to fill the screen while the
    outgoing frame rushes past. Used at the front door, the entrance and the glass to the pool.
- Perspective: the camera layer tilts with the pointer and with scroll velocity (`quickTo`).
- Doorways and scene changes get more scroll distance and ease in/out, so they *dwell*.
- Lenis smooth scrolling is driven from GSAP's ticker so both share one clock.

### Tuning

| Want | Change |
|---|---|
| Longer / shorter journey | `SCROLL_VH_PER_UNIT` in `src/config/frames.ts` |
| Linger longer on doorways | `DURATION.portal` (same file) |
| Different transition at one cut | that letter in `STEPS` |
| Text position / timing | `OVERLAYS` (frame numbers + `align`) |
| Colors | `tailwind.config.ts` (`ink`, `bone`, `sand`, `umber`, `lagoon`) |
| Fonts | `src/app/layout.tsx` |
| Name, copy, specs, nearby places | `src/config/site.ts` |

### Notes

- Your walkthrough runs **kitchen → dining** (the camera's actual path); the brief listed dining first.
  Reordering frames would break the continuity of the move, so the footage order wins.
- Photos are 3:2; screens are cropped to fill (`cover`). On phones the crop is centered.
- Nav order is Home / The Villa / Experience / Gallery / Location / Book, and the page follows it. Reorder
  sections in `src/app/page.tsx`.

## Motion preferences

With `prefers-reduced-motion: reduce`: no pinning, no scrubbing, no Lenis, no parallax, no lightbox
animation. Visitors get the same journey as ordinary scrolling: full-bleed photos in walking order with the
same four lines of copy (`StaticJourney.tsx`).

## Placeholders left for you

- Villa name, tagline, email → `src/config/site.ts`
- Map → `Location.tsx` (`<MapPlaceholder />`, swap for Mapbox / Google Maps)
- Nearby places + drive times → `ATTRACTIONS` in `site.ts` (sample values)
- Booking → `Booking.tsx` (`TODO` in `submit`: connect your booking engine or API route)

## Structure

```
src/
  app/            layout.tsx · page.tsx · globals.css
  config/         frames.ts (sequence, chapters, transitions, text) · site.ts (content)
  components/
    walkthrough/  Walkthrough · ScrollJourney · StaticJourney · renderer · useFrameSequence · ChapterRail
    sections/     VillaDetails · Experience · Gallery · Lightbox · Location · Booking
    layout/       Nav · Footer
    providers/    SmoothScroll (Lenis + ScrollTrigger)
    ui/           SafeImage (next/image + labeled placeholder)
  hooks/ lib/     useReducedMotion · gsap · cn
scripts/          optimize-frames.mjs
public/frames/    desktop/ · mobile/
```
