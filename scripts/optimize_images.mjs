// Convert the colored-pencil render PNGs to WebP for fast mobile loading.
// High quality (82) + capped at 2000px wide — visually lossless for these
// illustrations, but a fraction of the bytes. Re-runnable for new renders.
//   node scripts/optimize_images.mjs
import { readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'lookbook_images');
const pngs = readdirSync(dir).filter((f) => f.toLowerCase().endsWith('.png'));

let before = 0, after = 0;
for (const f of pngs) {
  const src = path.join(dir, f);
  const out = path.join(dir, f.replace(/\.png$/i, '.webp'));
  before += statSync(src).size;
  await sharp(src).resize({ width: 2000, withoutEnlargement: true }).webp({ quality: 82 }).toFile(out);
  after += statSync(out).size;
}

console.log(`Converted ${pngs.length} PNG -> WebP`);
console.log(`Before ${(before / 1e6).toFixed(1)} MB  →  After ${(after / 1e6).toFixed(1)} MB  (${(100 * (1 - after / before)).toFixed(0)}% smaller)`);
