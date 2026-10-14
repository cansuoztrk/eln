#!/usr/bin/env node
/*
  El yazısı: adları Great Vibes yazı tipinin çizgilerinden SVG yoluna çevirir.
  Site bu yolları kalem gibi çizerek yazar. Çıktı ozel/el.json'a gider (kişisel olduğu için şifreli kasaya girer).

    npm i --no-save opentype.js@1.3.4
    YAZI_TIPI=/yol/GreatVibes-Regular.ttf node tools/el-yazisi.mjs "Eln," "Arda"
*/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const opentype = (await import(process.env.OPENTYPE || 'opentype.js')).default;
const buf = fs.readFileSync(process.env.YAZI_TIPI);
const font = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
const out = {};
for (const metin of process.argv.slice(2)) {
  const p = font.getPath(metin, 0, 0, 200);
  const b = p.getBoundingBox();
  const pad = 14;
  const cmds = p.commands.map((c) => {
    const r = (v) => Math.round(v * 10) / 10;
    const x = (v) => r(v - b.x1 + pad);
    const y = (v) => r(v - b.y1 + pad);
    if (c.type === 'M') return `M${x(c.x)} ${y(c.y)}`;
    if (c.type === 'L') return `L${x(c.x)} ${y(c.y)}`;
    if (c.type === 'Q') return `Q${x(c.x1)} ${y(c.y1)} ${x(c.x)} ${y(c.y)}`;
    if (c.type === 'C') return `C${x(c.x1)} ${y(c.y1)} ${x(c.x2)} ${y(c.y2)} ${x(c.x)} ${y(c.y)}`;
    return 'Z';
  });
  // Her harf ayrı bir yol olsun: sırayla yazılabilsin
  const parcalar = cmds.join(' ').split(/(?=M)/).map((s) => s.trim());
  out[metin] = { w: Math.ceil(b.x2 - b.x1 + pad * 2), h: Math.ceil(b.y2 - b.y1 + pad * 2), d: parcalar };
}
fs.mkdirSync(path.join(ROOT, 'ozel'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'ozel', 'el.json'), JSON.stringify(out));
console.log('ozel/el.json yazıldı:', Object.keys(out).join(', '));
