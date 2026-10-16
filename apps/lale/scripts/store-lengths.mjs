// Checks store text lengths in docs/17 against App Store / Play limits.
import { readFileSync } from 'node:fs';
const md = readFileSync(new URL('../../../docs/17-lale-magaza-metinleri.md', import.meta.url), 'utf8');
const LIMITS = [
  [/^\*\*(Ad|Name|Nombre|Başlık|Title|Titel|Título):\*\* (.+)$/, 30],
  [/^\*\*(Alt başlık|Subtitle|Untertitel|Subtítulo):\*\* (.+)$/, 30],
  [/^\*\*(Anahtar kelimeler|Keywords|Schlüsselwörter|Palabras clave):\*\* `(.+)`$/, 100],
  [/^\*\*(Promosyon metni|Promotional text|Werbetext|Texto promocional):\*\* (.+)$/, 170],
  [/^\*\*(Kısa açıklama|Short description|Kurzbeschreibung|Descripción breve):\*\* (.+)$/, 80],
];
let bad = 0;
for (const line of md.split('\n')) {
  for (const [re, max] of LIMITS) {
    const m = line.match(re);
    if (!m) continue;
    const n = [...m[2]].length;
    const flag = n > max ? '  ✗ TOO LONG' : '';
    if (flag) bad++;
    console.log(`${String(n).padStart(3)}/${max}  ${m[1]}: ${m[2].slice(0, 60)}${flag}`);
  }
}
process.exit(bad ? 1 : 0);
