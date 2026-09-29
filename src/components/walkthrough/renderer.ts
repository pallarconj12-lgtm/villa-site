import { FRAME_COUNT, framePath, type TransitionType } from "@/config/frames";
import type { Drawable, FrameEntry } from "./useFrameSequence";

/**
 * Paints the "camera" onto a <canvas> for a fractional frame position `f`
 * (0 = first frame, 38 = last). Between two frames it composes the move:
 *
 *   flow    crossfade
 *   push    outgoing frame dollies in, incoming settles, crossfaded
 *   pull    incoming frame settles back from a tighter crop
 *   portal  incoming frame is revealed through a doorway mask that grows to
 *           fill the screen while the outgoing frame rushes past
 */

const smooth = (x: number) => {
  const t = Math.min(1, Math.max(0, x));
  return t * t * t * (t * (t * 6 - 15) + 10);
};
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

const dims = (d: Drawable) =>
  d instanceof HTMLImageElement
    ? { w: d.naturalWidth, h: d.naturalHeight }
    : { w: d.width, h: d.height };

/** Per-frame live data: clock (s) and smoothed scroll speed 0..1 (drives motion blur + dust). */
export type FX = { time: number; speed: number };

export type Renderer = {
  resize: () => void;
  draw: (f: number, force?: boolean, fx?: FX) => void;
  redraw: () => void;
  destroy: () => void;
};

export function createRenderer(
  canvas: HTMLCanvasElement,
  getFrames: () => FrameEntry[],
  transitions: TransitionType[]
): Renderer {
  const ctx = canvas.getContext("2d", { alpha: false })!;
  let W = 0;
  let H = 0;
  let lastF = -1;
  let currentF = 0;
  let fx: FX = { time: 0, speed: 0 };
  let sway = { s: 1, x: 0, y: 0 };
  const seed = (i: number, n: number) => {
    const x = Math.sin(i * 127.1 + n * 311.7) * 43758.5453;
    return x - Math.floor(x);
  };
  const motes = Array.from({ length: 46 }, (_, i) => ({
    x: seed(i, 1), y: seed(i, 2), z: 0.3 + seed(i, 3) * 0.7, p: seed(i, 4) * 6.28,
  }));

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    W = Math.max(1, Math.round(canvas.clientWidth * dpr));
    H = Math.max(1, Math.round(canvas.clientHeight * dpr));
    if (canvas.width !== W || canvas.height !== H) {
      canvas.width = W;
      canvas.height = H;
    }
    lastF = -1;
  }

  /** The frame to paint for index i: itself, or the nearest loaded neighbour while streaming. */
  function resolve(i: number): Drawable | "missing" | null {
    const list = getFrames();
    const e = list[i];
    if (e?.img) return e.img;
    if (e?.state === "error") return "missing";
    for (let d = 1; d < FRAME_COUNT; d++) {
      const a = list[i - d]?.img;
      if (a) return a;
      const b = list[i + d]?.img;
      if (b) return b;
    }
    return null;
  }

  function drawCover(src: Drawable | "missing" | null, index: number, scale = 1, alpha = 1) {
    if (alpha <= 0) return;
    ctx.globalAlpha = alpha;
    if (src === "missing") {
      drawPlaceholder(index, scale);
    } else if (src) {
      const { w, h } = dims(src);
      const cover = Math.max(W / w, H / h) * scale * sway.s;
      const dw = w * cover;
      const dh = h * cover;
      ctx.drawImage(src, (W - dw) / 2 + sway.x, (H - dh) / 2 + sway.y, dw, dh);
    }
    ctx.globalAlpha = 1;
  }

  function drawPlaceholder(index: number, scale: number) {
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.scale(scale, scale);
    ctx.translate(-W / 2, -H / 2);
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, "#d9cdb9");
    g.addColorStop(1, "#b7a68b");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(111,94,76,.6)";
    ctx.setLineDash([12, 10]);
    ctx.lineWidth = 2;
    ctx.strokeRect(W * 0.06, H * 0.08, W * 0.88, H * 0.84);
    ctx.setLineDash([]);
    ctx.fillStyle = "#1c201d";
    ctx.textAlign = "center";
    const s = Math.max(12, W / 70);
    ctx.font = `500 ${s}px sans-serif`;
    ctx.fillText("IMAGE PLACEHOLDER", W / 2, H / 2 - s * 1.6);
    ctx.font = `${s * 1.6}px Georgia, serif`;
    ctx.fillText(`Frame ${String(index + 1).padStart(3, "0")}`, W / 2, H / 2 + s * 0.6);
    ctx.font = `${s}px sans-serif`;
    ctx.fillText(`Add file: public${framePath(index + 1)}`, W / 2, H / 2 + s * 2.6);
    ctx.restore();
  }

  function roundedRect(x: number, y: number, w: number, h: number, r: number) {
    const rr = Math.max(0, Math.min(r, w / 2, h / 2));
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  function paint(f: number) {
    const max = FRAME_COUNT - 1;
    const clamped = Math.min(Math.max(f, 0), max);
    const i = Math.min(Math.floor(clamped), max - 1);
    const t = clamped - i;
    const a = resolve(i);
    const b = resolve(i + 1);
    const type = transitions[i] ?? "flow";

    ctx.globalAlpha = 1;
    ctx.fillStyle = "#1c201d";
    ctx.fillRect(0, 0, W, H);

    if (t <= 0.0005) {
      drawCover(a, i);
      return;
    }
    if (t >= 0.9995) {
      drawCover(b, i + 1);
      return;
    }

    switch (type) {
      case "flow": {
        // the camera keeps travelling forward: outgoing pushes in, incoming settles from just behind
        drawCover(a, i, 1 + 0.08 * t);
        drawCover(b, i + 1, 0.92 + 0.08 * t, smooth((t - 0.1) / 0.8));
        break;
      }
      case "push": {
        const e = easeInOut(t);
        drawCover(a, i, 1 + 0.42 * e);
        drawCover(b, i + 1, 1.22 - 0.22 * e, smooth((t - 0.15) / 0.7));
        break;
      }
      case "pull": {
        drawCover(a, i, 1 + 0.06 * t);
        drawCover(b, i + 1, 1.3 - 0.3 * easeInOut(t), smooth((t - 0.05) / 0.8));
        break;
      }
      case "portal": {
        const e = easeInOut(t);
        // outgoing frame rushes toward the camera and darkens as we go through
        drawCover(a, i, 1 + 0.9 * e);
        ctx.fillStyle = `rgba(20,14,10,${0.45 * smooth(t * 1.4)})`;
        ctx.fillRect(0, 0, W, H);
        // the doorway: starts as a door-shaped opening, grows past the screen edges
        const pw = W * (0.16 + 1.0 * e);
        const ph = H * (0.52 + 0.75 * e);
        const cx = W / 2;
        const cy = H * (0.54 - 0.04 * e);
        ctx.save();
        roundedRect(cx - pw / 2, cy - ph / 2, pw, ph, Math.min(pw, ph) * 0.05 * (1 - e));
        ctx.clip();
        drawCover(b, i + 1, 1.35 - 0.35 * e);
        ctx.restore();
        break;
      }
    }
  }

  /** Dust in the light + a slow sun bloom: keeps the picture alive between scroll ticks. */
  function atmosphere() {
    const { time, speed } = fx;
    const u = (W / 1600) * 1.2;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const g = ctx.createRadialGradient(W * 0.82, H * 0.1, 0, W * 0.82, H * 0.1, W * 0.75);
    const a = 0.035 + 0.015 * Math.sin(time * 0.25);
    g.addColorStop(0, `rgba(255,226,170,${a})`);
    g.addColorStop(1, "rgba(255,226,170,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  function draw(f: number, force = false, next?: FX) {
    if (next) fx = next;
    currentF = f;
    if (!force && Math.abs(f - lastF) < 0.0005) return;
    lastF = f;
    if (!W || !H) resize();
    // idle handheld breathing: never fully still, like a stabilised gimbal shot
    const { time, speed } = fx;
    sway = {
      s: 1.012 + 0.008 * Math.sin(time * 0.17),
      x: Math.sin(time * 0.13) * W * 0.003,
      y: Math.cos(time * 0.15) * H * 0.002,
    };
    paint(f);
    atmosphere();
  }

  return {
    resize,
    draw,
    redraw: () => draw(currentF, true),
    destroy: () => {},
  };
}
