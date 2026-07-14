const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const outDir = path.resolve(__dirname, '../tests/fixtures/e2e/assets/demo/textures');
fs.mkdirSync(outDir, { recursive: true });
const colors = {
  'wooden_shovel.png': [139, 69, 19, 255],
  'stone_pickaxe.png': [112, 128, 144, 255],
  'ornate_sword.png': [218, 165, 32, 255],
  'gilded_axe.png': [255, 215, 0, 255],
  'crystal_block.png': [135, 206, 250, 255],
  'prism_block.png': [186, 85, 211, 255]
};

function crc32(buf) {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  let crc = -1;
  for (const b of buf) crc = (crc >>> 8) ^ table[(crc ^ b) & 0xff];
  return (crc ^ -1) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function pngForColor(rgba) {
  const width = 16;
  const height = 16;
  const pixels = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    pixels[y * (width * 4 + 1)] = 0;
    for (let x = 0; x < width; x++) {
      const offset = y * (width * 4 + 1) + 1 + x * 4;
      pixels[offset] = rgba[0];
      pixels[offset + 1] = rgba[1];
      pixels[offset + 2] = rgba[2];
      pixels[offset + 3] = rgba[3];
    }
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;
  header[10] = 0;
  header[11] = 0;
  header[12] = 0;
  const idat = zlib.deflateSync(pixels);
  return Buffer.concat([
    Buffer.from('\x89PNG\r\n\x1a\n','binary'),
    chunk('IHDR', header),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

for (const [name, rgba] of Object.entries(colors)) {
  const filePath = path.join(outDir, name);
  fs.writeFileSync(filePath, pngForColor(rgba));
}
console.log('created', Object.keys(colors).length, 'PNGs');
