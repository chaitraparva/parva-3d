// Downloads every photo in src/data/images.js at 3840px (4K) into public/img.
// Run with:  npm run images
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { IMAGES } from "../src/data/images.js";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const out = path.join(root, "public", "img");
await fs.mkdir(out, { recursive: true });

const WIDTH = process.env.IMG_WIDTH || 3840;
const entries = Object.entries(IMAGES);
let ok = 0, skipped = 0, failed = [];

async function grab([key, { id, url: direct, w }]) {
  const file = path.join(out, `${key}.jpg`);
  try { await fs.access(file); skipped++; return; } catch {}
  const url = direct || `https://unsplash.com/photos/${id}/download?force=true&w=${w || WIDTH}`;
  try {
    const res = await fetch(url, { redirect: "follow", headers: { "User-Agent": "parva-residence-setup" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 5000) throw new Error("file too small");
    await fs.writeFile(file, buf);
    ok++;
    console.log(`  ✓ ${key.padEnd(11)} ${(buf.length / 1024 / 1024).toFixed(1)} MB`);
  } catch (e) {
    failed.push(key);
    console.log(`  ✗ ${key.padEnd(11)} ${e.message}`);
  }
}

// also fetch a 1600px copy of each Unsplash photo for small slots (faster, smoother scrolling)
for (const [key, v] of Object.entries(IMAGES)) {
  if (v.url && v.url.includes("images.unsplash.com")) entries.push([`${key}-1600`, { url: v.url.replace("w=3840", "w=1600") }]);
  else if (v.id && !v.url) entries.push([`${key}-1600`, { id: v.id, w: 1600 }]);
}

console.log(`\nDownloading ${entries.length} photos at ${WIDTH}px into public/img …\n`);
const queue = [...entries];
await Promise.all(Array.from({ length: 4 }, async () => { while (queue.length) await grab(queue.shift()); }));
console.log(`\nDone: ${ok} downloaded, ${skipped} already there, ${failed.length} failed.`);
if (failed.length) console.log(`Failed ones will load straight from Unsplash while the site runs: ${failed.join(", ")}`);
