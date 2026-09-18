/**
 * Generates the favicon from the brand token, rather than from a designer's
 * export nobody can regenerate.
 *
 * The logo is not a drawing: `.wordmark-glyph` in `apps/web/src/styles.css` is a
 * 22px square with a 7px radius filled with `--accent`. So the favicon is the
 * same square, and the colour is READ FROM THAT FILE. Change `--accent` and
 * re-run this; the icon follows. A hex code pasted into an SVG by hand is a
 * second source of truth for the brand colour, and it is the one that silently
 * stops matching.
 *
 * Written with no image library on purpose. PNG is a zlib stream plus four
 * chunks and ICO is a six-byte header plus PNG payloads, which is a smaller
 * dependency surface than adding sharp to a repo that ships no images.
 *
 * Run: npm run favicon:build
 */
import { deflateSync } from 'node:zlib';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = join(here, '..');
const PUBLIC_DIR = join(ROOT, 'apps/web/public');
const STYLES = join(ROOT, 'apps/web/src/styles.css');
const UI_EN = join(ROOT, 'config/i18n/ui/en.json');

/** The logo: `.wordmark-glyph` is 22px wide with a 7px corner radius. */
const RADIUS_RATIO = 7 / 22;

function brandColour(): { hex: string; rgb: [number, number, number] } {
  const css = readFileSync(STYLES, 'utf8');
  const match = css.match(/--accent:\s*(#[0-9a-fA-F]{6})\s*;/);
  if (!match) throw new Error(`No --accent token in ${STYLES}. The favicon has no colour to use.`);
  const hex = match[1].toLowerCase();
  return {
    hex,
    rgb: [
      parseInt(hex.slice(1, 3), 16),
      parseInt(hex.slice(3, 5), 16),
      parseInt(hex.slice(5, 7), 16),
    ],
  };
}

/** The public brand, for the icon's accessible name. Same argument as the colour. */
function brandName(): string {
  const name = (JSON.parse(readFileSync(UI_EN, 'utf8')) as Record<string, unknown>)['app.name'];
  if (typeof name !== 'string' || !name) throw new Error(`No app.name in ${UI_EN}.`);
  return name;
}

// ---------- PNG ----------

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

function png(size: number, pixels: Buffer): Buffer {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type: RGBA
  // Each scanline is prefixed with filter byte 0. At these sizes the filtering
  // would save a few hundred bytes and cost the reader an hour.
  const stride = size * 4 + 1;
  const raw = Buffer.alloc(size * stride);
  for (let y = 0; y < size; y += 1) {
    pixels.copy(raw, y * stride + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---------- the shape ----------

/** Standard rounded-rect test: clamp into the inner rect, measure from there. */
function insideRoundedSquare(x: number, y: number, size: number, radius: number): boolean {
  const cx = Math.min(Math.max(x, radius), size - radius);
  const cy = Math.min(Math.max(y, radius), size - radius);
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy <= radius * radius;
}

/**
 * 4x4 supersampling. At 16px the corner radius is five pixels, so aliasing on
 * the curve is the difference between a rounded square and a chewed one.
 */
const SAMPLES = 4;

function roundedSquarePixels(size: number, rgb: [number, number, number], radiusRatio: number): Buffer {
  const radius = size * radiusRatio;
  const pixels = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let hits = 0;
      for (let sy = 0; sy < SAMPLES; sy += 1) {
        for (let sx = 0; sx < SAMPLES; sx += 1) {
          const px = x + (sx + 0.5) / SAMPLES;
          const py = y + (sy + 0.5) / SAMPLES;
          if (insideRoundedSquare(px, py, size, radius)) hits += 1;
        }
      }
      const offset = (y * size + x) * 4;
      pixels[offset] = rgb[0];
      pixels[offset + 1] = rgb[1];
      pixels[offset + 2] = rgb[2];
      pixels[offset + 3] = Math.round((hits / (SAMPLES * SAMPLES)) * 255);
    }
  }
  return pixels;
}

/** iOS applies its own mask and squircle, so the touch icon is a flat opaque square. */
function solidSquarePixels(size: number, rgb: [number, number, number]): Buffer {
  const pixels = Buffer.alloc(size * size * 4);
  for (let i = 0; i < size * size; i += 1) {
    pixels[i * 4] = rgb[0];
    pixels[i * 4 + 1] = rgb[1];
    pixels[i * 4 + 2] = rgb[2];
    pixels[i * 4 + 3] = 255;
  }
  return pixels;
}

// ---------- ICO ----------

function ico(images: { size: number; data: Buffer }[]): Buffer {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(images.length, 4);

  const entries: Buffer[] = [];
  let offset = 6 + images.length * 16;
  for (const image of images) {
    const entry = Buffer.alloc(16);
    entry[0] = image.size >= 256 ? 0 : image.size; // 0 means 256
    entry[1] = image.size >= 256 ? 0 : image.size;
    entry.writeUInt16LE(1, 4); // colour planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(image.data.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += image.data.length;
    entries.push(entry);
  }
  return Buffer.concat([header, ...entries, ...images.map((i) => i.data)]);
}

// ---------- write ----------

const { hex, rgb } = brandColour();
const name = brandName();
const percent = (RADIUS_RATIO * 100).toFixed(4);

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" role="img" aria-label="${name}">
  <title>${name}</title>
  <rect width="32" height="32" rx="${percent}%" ry="${percent}%" fill="${hex}"/>
</svg>
`;
writeFileSync(join(PUBLIC_DIR, 'favicon.svg'), svg);

const icoSizes = [16, 32, 48];
writeFileSync(
  join(PUBLIC_DIR, 'favicon.ico'),
  ico(icoSizes.map((size) => ({ size, data: png(size, roundedSquarePixels(size, rgb, RADIUS_RATIO)) }))),
);

writeFileSync(join(PUBLIC_DIR, 'favicon-32.png'), png(32, roundedSquarePixels(32, rgb, RADIUS_RATIO)));
writeFileSync(join(PUBLIC_DIR, 'apple-touch-icon.png'), png(180, solidSquarePixels(180, rgb)));

console.log(`favicon written from --accent ${hex}`);
for (const name of ['favicon.svg', 'favicon.ico', 'favicon-32.png', 'apple-touch-icon.png']) {
  console.log(`  apps/web/public/${name}`);
}
