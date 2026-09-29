// Turns a folder of walkthrough photographs into the two optimized sets the site uses.
//
//   npm run frames -- ./my-photos            (all images, sorted by filename)
//   npm run frames -- ./my-photos --limit=39 (only the first 39)
//
// Output:
//   public/frames/desktop/frame-001.webp ... (1600px wide)
//   public/frames/mobile/frame-001.webp  ... (900px wide)
//
// Files are sorted "naturally" (Frame_2 before Frame_10), so name them in walking order.

import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";

const args = process.argv.slice(2);
const inputDir = args.find((a) => !a.startsWith("--")) ?? "source-frames";
const limit = Number(args.find((a) => a.startsWith("--limit="))?.split("=")[1] ?? 0);

const SETS = [
  { name: "desktop", width: 1600, quality: 78 },
  { name: "mobile", width: 900, quality: 72 },
];

const files = (await fs.readdir(inputDir))
  .filter((f) => /\.(webp|jpe?g|png|avif)$/i.test(f))
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

const chosen = limit > 0 ? files.slice(0, limit) : files;
if (chosen.length === 0) {
  console.error(`No images found in ${inputDir}`);
  process.exit(1);
}

for (const set of SETS) {
  const out = path.join("public", "frames", set.name);
  await fs.mkdir(out, { recursive: true });
  for (const old of await fs.readdir(out)) {
    if (/^frame-\d+\.webp$/.test(old)) await fs.unlink(path.join(out, old));
  }
  let bytes = 0;
  for (let i = 0; i < chosen.length; i++) {
    const name = `frame-${String(i + 1).padStart(3, "0")}.webp`;
    const info = await sharp(path.join(inputDir, chosen[i]))
      .resize({ width: set.width, withoutEnlargement: true })
      .webp({ quality: set.quality, effort: 5 })
      .toFile(path.join(out, name));
    bytes += info.size;
  }
  console.log(`${set.name}: ${chosen.length} frames, ${(bytes / 1048576).toFixed(1)} MB`);
}

console.log(
  `\nDone. Make sure FRAME_COUNT in src/config/frames.ts is ${chosen.length}.`
);
