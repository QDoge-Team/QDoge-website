/**
 * Build multi-size favicon.ico from public/icon.png (no circular mask).
 * Run after icons are finalized: node scripts/favicon-ico.mjs
 */
import { renameSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import pngToIco from 'png-to-ico';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const iconPng = join(root, 'public', 'icon.png');
const buf = readFileSync(iconPng);
const ico32 = await sharp(buf).resize(32, 32).png().toBuffer();
const ico48 = await sharp(buf).resize(48, 48).png().toBuffer();
const ico = await pngToIco([ico48, ico32]);

function atomic(dest, data) {
  const tmp = `${dest}.tmp-${process.pid}`;
  writeFileSync(tmp, data);
  renameSync(tmp, dest);
}

for (const dest of [join(root, 'public', 'favicon.ico'), join(root, 'app', 'favicon.ico')]) {
  try {
    atomic(dest, ico);
    console.log('Wrote', dest);
  } catch (e) {
    console.warn('Skip', dest, e.message);
  }
}
