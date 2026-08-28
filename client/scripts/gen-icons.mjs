import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public");
mkdirSync(outDir, { recursive: true });

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function png(width, height, pixelAt) {
  const raw = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    const row = y * (1 + width * 4);
    raw[row] = 0;
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = pixelAt(x, y);
      const o = row + 1 + x * 4;
      raw[o] = r;
      raw[o + 1] = g;
      raw[o + 2] = b;
      raw[o + 3] = a;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const INK = [0x14, 0x21, 0x1f, 255];
const MINERAL = [0xee, 0xf0, 0xeb, 255];
const LIME = [0xc7, 0xf3, 0x6b, 255];
const CLEAR = [0, 0, 0, 0];

function drawIcon(size, { maskable = false } = {}) {
  const scale = maskable ? 0.76 : 1;
  const s = size * scale;
  const off = (size - s) / 2;
  const radius = s * (maskable ? 0 : 0.22);
  const cx = size / 2;
  const cy = size / 2;

  const inRoundedSquare = (x, y) => {
    if (!maskable) {
      const dx = Math.abs(x - cx) - (s / 2 - radius);
      const dy = Math.abs(y - cy) - (s / 2 - radius);
      if (dx > 0 && dy > 0) return dx * dx + dy * dy <= radius * radius;
      return Math.abs(x - cx) <= s / 2 && Math.abs(y - cy) <= s / 2;
    }
    return true;
  };

  const rx0 = off + s * 0.28;
  const rw = s * 0.44;
  const ry0 = off + s * 0.18;
  const rh = s * 0.64;

  const inReceipt = (x, y) =>
    x >= rx0 && x <= rx0 + rw && y >= ry0 && y <= ry0 + rh;

  const stripe = (x, y, sy0, sy1, sx0, sx1) =>
    y >= off + s * sy0 &&
    y <= off + s * sy1 &&
    x >= off + s * sx0 &&
    x <= off + s * sx1;

  return (x, y) => {
    if (!inRoundedSquare(x, y)) return CLEAR;
    if (inReceipt(x, y)) {
      if (stripe(x, y, 0.3, 0.345, 0.36, 0.64)) return INK;
      if (stripe(x, y, 0.4, 0.445, 0.36, 0.55)) return LIME;
      if (stripe(x, y, 0.5, 0.545, 0.36, 0.64)) return [0x14, 0x21, 0x1f, 140];
      return MINERAL;
    }
    return INK;
  };
}

writeFileSync(join(outDir, "icon-192.png"), png(192, 192, drawIcon(192)));
writeFileSync(join(outDir, "icon-512.png"), png(512, 512, drawIcon(512)));
writeFileSync(
  join(outDir, "icon-maskable-512.png"),
  png(512, 512, drawIcon(512, { maskable: true })),
);
console.log("icons written to", outDir);
