/**
 * Circular mask (transparent outside the circle) — removes square / white corners in the tab.
 * Reads public/favicon.png (square master), writes public/icon.png, apple-icon.png, favicon.png.
 * Replace public/favicon.png with a square PNG, then: npm run icons:round
 */
import sharp from 'sharp';
import pngToIco from 'png-to-ico';
import { copyFileSync, renameSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
/* Source: any square brand PNG (same art as the tab icon). */
const input = join(root, 'public', 'favicon.png');

const size = 512;
const r = size / 2;

const circleSvg = Buffer.from(
  `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <circle cx="${r}" cy="${r}" r="${r}" fill="#ffffff"/>
  </svg>`
);

const buf = await sharp(input)
  .resize(size, size, { fit: 'cover', position: 'centre' })
  .ensureAlpha()
  .composite([{ input: circleSvg, blend: 'dest-in' }])
  .png()
  .toBuffer();

function writeBufferAtomic(destPath, data) {
  const tmp = `${destPath}.tmp-${process.pid}`;
  writeFileSync(tmp, data);
  renameSync(tmp, destPath);
}

const targets = [
  join(root, 'public', 'icon.png'),
  join(root, 'public', 'apple-icon.png'),
  join(root, 'public', 'favicon.png'),
];

for (const dest of targets) {
  try {
    writeBufferAtomic(dest, buf);
  } catch (e) {
    console.error('Failed to write:', dest, e);
    process.exit(1);
  }
}

/* Browsers still default to /favicon.ico — real .ico avoids redirect/metadata issues. */
const ico32 = await sharp(buf).resize(32, 32).png().toBuffer();
const ico48 = await sharp(buf).resize(48, 48).png().toBuffer();
const icoBuf = await pngToIco([ico48, ico32]);
const icoTargets = [
  join(root, 'public', 'favicon.ico'),
  join(root, 'app', 'favicon.ico'),
];
for (const dest of icoTargets) {
  try {
    writeBufferAtomic(dest, icoBuf);
  } catch (e) {
    console.warn('ICO write skipped:', dest, e.message);
  }
}

/* Next.js serves /icon.png from app/ when present — keep in sync. */
try {
  copyFileSync(join(root, 'public', 'icon.png'), join(root, 'app', 'icon.png'));
  copyFileSync(join(root, 'public', 'apple-icon.png'), join(root, 'app', 'apple-icon.png'));
} catch (e) {
  console.warn('Could not copy into app/ (close IDE preview if needed):', e.message);
}

console.log('Round icon written:', targets.join(', '), '+ favicon.ico');
