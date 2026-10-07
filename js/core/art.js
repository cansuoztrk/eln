/* Eln'in Krallığı — tüm çizimler (inline SVG). Hiçbir görsel dosyaya ihtiyaç yok. */
(function () {
  'use strict';
  const K = window.K;
  const INK = '#2B2024';
  const LINE = '#4A2138';
  let uid = 0;

  /* ---------------- Hello Kitty ---------------- */
  // Tüm göz çeşitleri çizilir; hangisinin görüneceğini CSS sınıfı seçer (is-heart, is-happy, is-sleep, is-wink)
  function kitty(opt = {}) {
    // Kitty'nin Gardırobu: seçilen kıyafet ve fiyonk rengi her çizimde (giysi: false ile kapatılır)
    const gy = opt.giysi !== false && K.giysi ? K.giysi : null;
    const { crown: crown0 = false, blush = true, cls = '', label = 'Hello Kitty' } = opt;
    const bow = opt.bow || (gy && gy.renk()) || '#E3174D';
    const crown = crown0 && !(gy && gy.secili().bas);
    const id = 'kt' + ++uid;
    const earL = 'M30 104 C20 62 26 26 48 19 C64 14 94 34 114 55 Z';
    const earR = 'M210 104 C220 62 214 26 192 19 C176 14 146 34 126 55 Z';
    const sil = `<path d="${earL}"/><path d="${earR}"/><ellipse cx="120" cy="121" rx="103" ry="73"/>`;
    const heart = (x, y) =>
      `<path transform="translate(${x} ${y}) scale(1.35)" d="M0 7 C-11 -1 -11 -12 -4.5 -12 C-1.5 -12 0 -9.5 0 -8 C0 -9.5 1.5 -12 4.5 -12 C11 -12 11 -1 0 7 Z"/>`;
    // Kale 3.0 çizimi: aynı oranlar, yumuşak gölgeli yüz, parlak fiyonk, gözlerde ışık
    return `<svg class="kitty ${cls}" viewBox="0 0 240 200" role="img" aria-label="${label}">
  <defs>
    <radialGradient id="${id}h" cx="42%" cy="34%" r="74%"><stop offset="0" stop-color="#fff"/><stop offset=".58" stop-color="#FFFBFC"/><stop offset="1" stop-color="#F1DDE6"/></radialGradient>
    <radialGradient id="${id}b"><stop offset="0" stop-color="#FF8DB0" stop-opacity=".8"/><stop offset="1" stop-color="#FF8DB0" stop-opacity="0"/></radialGradient>
    <linearGradient id="${id}n" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE68A"/><stop offset="1" stop-color="#FFBE2E"/></linearGradient>
  </defs>
  <g class="k-head">
    <g fill="#fff" stroke="${INK}" stroke-width="9" stroke-linejoin="round">${sil}</g>
    <g fill="url(#${id}h)">${sil}</g>
  </g>
  ${blush ? `<g class="k-blush"><ellipse cx="56" cy="148" rx="19" ry="11" fill="url(#${id}b)"/><ellipse cx="184" cy="148" rx="19" ry="11" fill="url(#${id}b)"/></g>` : ''}
  <g class="k-whiskers" stroke="${INK}" stroke-width="4.6" stroke-linecap="round">
    <path d="M6 110 L46 118"/><path d="M2 134 L44 135"/><path d="M8 158 L46 149"/>
    <path d="M234 110 L194 118"/><path d="M238 134 L196 135"/><path d="M232 158 L194 149"/>
  </g>
  ${eyeSets(opt.eyes, heart)}
  <ellipse class="k-nose" cx="120" cy="142" rx="10.5" ry="7.5" fill="url(#${id}n)" stroke="${INK}" stroke-width="3.6"/>
  <ellipse cx="116.5" cy="139.6" rx="3.2" ry="1.8" fill="#fff" opacity=".75"/>
  ${crown ? crownSvg() : ''}
  <g class="k-bow" transform="translate(184 42) rotate(-14) scale(.86)">${bowShape(bow)}</g>
  ${gy ? `<g class="k4-giysi">${gy.svg()}</g>` : ''}
</svg>`;
  }

  // only verilirse sadece o göz çizilir (CSS'siz resimler için); verilmezse hepsi çizilir, CSS seçer
  function eyeSets(only, heart) {
    const sets = {
      normal: `<g class="k-eyes k-normal"><ellipse class="k-eye-l" cx="80" cy="124" rx="8.5" ry="12" fill="${INK}"/><ellipse class="k-eye-r" cx="160" cy="124" rx="8.5" ry="12" fill="${INK}"/><g fill="#fff"><circle cx="77.4" cy="118.5" r="2.7"/><circle cx="157.4" cy="118.5" r="2.7"/></g></g>`,
      heart: `<g class="k-eyes k-heart" fill="#E3174D">${heart(80, 128)}${heart(160, 128)}</g>`,
      happy: `<g class="k-eyes k-happy" fill="none" stroke="${INK}" stroke-width="5.5" stroke-linecap="round"><path d="M69 128 Q80 113 91 128"/><path d="M149 128 Q160 113 171 128"/></g>`,
      sleep: `<g class="k-eyes k-sleep" fill="none" stroke="${INK}" stroke-width="5.5" stroke-linecap="round"><path d="M69 122 Q80 132 91 122"/><path d="M149 122 Q160 132 171 122"/></g>`,
      wink: `<g class="k-eyes k-wink"><ellipse cx="80" cy="124" rx="8.5" ry="12" fill="${INK}"/><circle cx="77.4" cy="118.5" r="2.7" fill="#fff"/><path d="M149 128 Q160 113 171 128" fill="none" stroke="${INK}" stroke-width="5.5" stroke-linecap="round"/></g>`,
    };
    if (only) return sets[only].replace(/class="k-eyes k-\w+"/, 'class="k-eyes"');
    return Object.values(sets).join('');
  }

  // Eln'in kırmızı puantiyeli tokasından: bütün fiyonklar puantiyeli
  const DOTS = [
    [-40, -12, 3.4], [-28, -17, 3], [-17, -7, 2.6], [-39, 3, 3], [-27, 1, 3.2],
  ];
  function bowShape(color, stroke = INK, dots = true) {
    const dot = dots
      ? `<g fill="#fff" opacity=".92">${DOTS.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/><circle cx="${-x}" cy="${y}" r="${r}"/>`).join('')}</g>`
      : `<g fill="#fff" opacity=".35"><ellipse cx="-34" cy="-12" rx="7" ry="4" transform="rotate(-20 -34 -12)"/><ellipse cx="34" cy="-12" rx="7" ry="4" transform="rotate(20 34 -12)"/></g>`;
    // Rengi ne olursa olsun: alt kanatlarda hafif gölge, üstte parlaklık (Kale 3.0)
    return `<g stroke="${stroke}" stroke-width="5.6" stroke-linejoin="round" fill="${color}">
      <path d="M0 0 C-12 -30 -52 -36 -52 -8 C-52 18 -20 16 0 0 Z"/>
      <path d="M0 0 C12 -30 52 -36 52 -8 C52 18 20 16 0 0 Z"/>
    </g>
    <g fill="#000" opacity=".1"><path d="M-3 2 C-18 14 -42 16 -48 2 C-38 10 -18 8 -3 2 Z"/><path d="M3 2 C18 14 42 16 48 2 C38 10 18 8 3 2 Z"/></g>
    ${dot}
    <g fill="#fff" opacity=".3"><ellipse cx="-38" cy="-19" rx="9" ry="4.2" transform="rotate(-24 -38 -19)"/><ellipse cx="38" cy="-19" rx="9" ry="4.2" transform="rotate(24 38 -19)"/></g>
    <g fill="none" stroke="${stroke}" stroke-width="3.6" stroke-linecap="round"><path d="M-14 -5 C-24 -13 -34 -15 -41 -11"/><path d="M14 -5 C24 -13 34 -15 41 -11"/></g>
    <ellipse cx="0" cy="0" rx="13" ry="12" fill="${color}" stroke="${stroke}" stroke-width="5.6"/>
    <ellipse cx="-4" cy="-4" rx="4.5" ry="2.6" fill="#fff" opacity=".38"/>`;
  }

  function crownSvg() {
    return `<g class="k-crown" transform="translate(112 46) rotate(-6) scale(.82)">
      <path d="M-30 10 L-33 -20 L-16 -4 L0 -30 L16 -4 L33 -20 L30 10 Z" fill="#FFD34E" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
      <circle cx="0" cy="-33" r="4.5" fill="#FFD34E" stroke="${INK}" stroke-width="3"/>
      <circle cx="-34" cy="-23" r="4" fill="#FFD34E" stroke="${INK}" stroke-width="3"/>
      <circle cx="34" cy="-23" r="4" fill="#FFD34E" stroke="${INK}" stroke-width="3"/>
      <circle cx="0" cy="-1" r="5.5" fill="#FF6FA3" stroke="${INK}" stroke-width="2.5"/>
      <circle cx="-18" cy="3" r="3.5" fill="#8FD3FF"/><circle cx="18" cy="3" r="3.5" fill="#8FD3FF"/>
    </g>`;
  }

  // Küçük bağımsız fiyonk (logo, mühür, mandal)
  function bow(color = '#E3174D', cls = '') {
    return `<svg class="bow ${cls}" viewBox="-60 -42 120 70" aria-hidden="true">${bowShape(color)}</svg>`;
  }

  /* ---------------- Angela (Konuşan Angela'dan esinlenen beyaz kedi) ---------------- */
  function angela(opt = {}) {
    const { body = false, cls = '' } = opt;
    const id = 'ag' + ++uid;
    const OUT = '#6E4459',
      FUR = '#FFFFFF',
      INNER = '#FFC2D4';
    const earL = 'M44 118 L30 26 Q32 16 42 20 L112 66 Z';
    const earR = 'M196 118 L210 26 Q208 16 198 20 L128 66 Z';
    const tuftL = 'M34 138 L6 156 L32 164 L14 186 L48 176 Z';
    const tuftR = 'M206 138 L234 156 L208 164 L226 186 L192 176 Z';
    const headSil = `<path d="${earL}"/><path d="${earR}"/><path d="${tuftL}"/><path d="${tuftR}"/><ellipse cx="120" cy="138" rx="98" ry="84"/>`;
    const eye = (x, flip) => `<g transform="translate(${x} 136) scale(${flip ? -1 : 1} 1)"><g class="a-eye" data-zone="eyes">
        <ellipse rx="25" ry="29" fill="#fff" stroke="${OUT}" stroke-width="4"/>
        <circle cx="3" cy="4" r="18" fill="url(#${id}-iris)"/>
        <ellipse cx="4" cy="6" rx="9" ry="11" fill="#2A1B24"/>
        <circle cx="-5" cy="-5" r="6" fill="#fff"/><circle cx="10" cy="14" r="3" fill="#fff"/>
        <g stroke="${OUT}" stroke-width="4" stroke-linecap="round"><path d="M-21 -15 L-33 -22"/><path d="M-16 -22 L-25 -34"/><path d="M-8 -27 L-12 -40"/></g>
      </g></g>`;
    const head = `<g class="a-head">
      <g class="a-ears"><g class="a-ear-l"><path d="${earL}" fill="${FUR}" stroke="${OUT}" stroke-width="8" stroke-linejoin="round"/></g><g class="a-ear-r"><path d="${earR}" fill="${FUR}" stroke="${OUT}" stroke-width="8" stroke-linejoin="round"/></g></g>
      <g fill="${FUR}" stroke="${OUT}" stroke-width="8" stroke-linejoin="round">${headSil}</g>
      <g fill="${FUR}" data-zone="head">${headSil}</g>
      <path d="M52 100 L44 40 L96 72 Z" fill="${INNER}" data-zone="ear"/><path d="M188 100 L196 40 L144 72 Z" fill="${INNER}" data-zone="ear"/>
      <g class="a-blush" fill="#FF9EBB" opacity=".5" data-zone="cheek"><ellipse cx="54" cy="178" rx="17" ry="10"/><ellipse cx="186" cy="178" rx="17" ry="10"/></g>
      <g class="a-eyes">${eye(84, false)}${eye(156, true)}</g>
      <g class="a-happy" fill="none" stroke="${OUT}" stroke-width="5" stroke-linecap="round"><path d="M64 140 Q84 118 104 140"/><path d="M136 140 Q156 118 176 140"/></g>
      <path class="a-nose" data-zone="nose" d="M110 165 Q120 159 130 165 Q126 175 120 178 Q114 175 110 165 Z" fill="#FF8FB0" stroke="${OUT}" stroke-width="3" stroke-linejoin="round"/>
      <path class="a-mouth-closed" d="M120 178 Q113 191 103 186 M120 178 Q127 191 137 186" fill="none" stroke="${OUT}" stroke-width="4" stroke-linecap="round"/>
      <g class="a-mouth-open"><path d="M103 184 Q120 218 137 184 Q120 191 103 184 Z" fill="#8C2F4F" stroke="${OUT}" stroke-width="3" stroke-linejoin="round"/><path d="M110 198 Q120 212 130 198 Q120 203 110 198 Z" fill="#FF7FA2"/></g>
      <g stroke="${OUT}" stroke-width="2.5" stroke-linecap="round" opacity=".55"><path d="M40 170 L10 166"/><path d="M42 182 L14 188"/><path d="M200 170 L230 166"/><path d="M198 182 L226 188"/></g>
      <g class="acc acc-tiara" transform="translate(120 58)">
        <path d="M-36 10 L-40 -16 L-20 -2 L0 -26 L20 -2 L40 -16 L36 10 Q0 18 -36 10 Z" fill="#FFE27A" stroke="${OUT}" stroke-width="4" stroke-linejoin="round"/>
        <circle cx="0" cy="-2" r="6" fill="#FF6FA3" stroke="${OUT}" stroke-width="2.5"/><circle cx="-22" cy="4" r="4" fill="#8FD3FF"/><circle cx="22" cy="4" r="4" fill="#8FD3FF"/>
      </g>
      <g class="acc acc-bow" transform="translate(178 64) rotate(12) scale(.62)">${bowShape('#FF6FA3', OUT)}</g>
      <g class="acc acc-flowers">${[
        [58, 78],
        [84, 60],
        [120, 54],
        [156, 60],
        [182, 78],
      ]
        .map(
          ([x, y], i) =>
            `<g transform="translate(${x} ${y})">${[0, 72, 144, 216, 288]
              .map((a) => `<circle cx="${Math.cos((a * Math.PI) / 180) * 7}" cy="${Math.sin((a * Math.PI) / 180) * 7}" r="6" fill="${['#FF8FB8', '#FFD34E', '#C9B6FF', '#8FD3FF', '#FF8FB8'][i]}"/>`)
              .join('')}<circle r="4" fill="#fff"/></g>`
        )
        .join('')}<path d="M52 84 Q120 44 188 84" fill="none" stroke="#7ED6A5" stroke-width="4" opacity=".7"/></g>
      <g class="acc acc-heartglasses" fill="#FF4F8B" stroke="${OUT}" stroke-width="3.5" stroke-linejoin="round">
        <path transform="translate(84 140) scale(3)" d="M0 7 C-11 -1 -11 -12 -4.5 -12 C-1.5 -12 0 -9.5 0 -8 C0 -9.5 1.5 -12 4.5 -12 C11 -12 11 -1 0 7 Z" opacity=".92"/>
        <path transform="translate(156 140) scale(3)" d="M0 7 C-11 -1 -11 -12 -4.5 -12 C-1.5 -12 0 -9.5 0 -8 C0 -9.5 1.5 -12 4.5 -12 C11 -12 11 -1 0 7 Z" opacity=".92"/>
        <path d="M112 128 Q120 122 128 128" fill="none"/>
      </g>
      <g class="acc acc-teacher" fill="rgba(255,255,255,.18)" stroke="#4A2138" stroke-width="5">
        <circle cx="84" cy="136" r="32"/><circle cx="156" cy="136" r="32"/><path d="M116 132 Q120 126 124 132" fill="none"/><path d="M52 130 L26 122" fill="none"/><path d="M188 130 L214 122" fill="none"/>
      </g>
    </g>`;
    const defs = `<defs><radialGradient id="${id}-iris" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#9BE7F2"/><stop offset=".6" stop-color="#3FB6CF"/><stop offset="1" stop-color="#23809A"/></radialGradient></defs>`;
    if (!body) {
      return `<svg class="angela ${cls}" viewBox="0 0 240 240" role="img" aria-label="Angela">${defs}${head}</svg>`;
    }
    return `<svg class="angela ${cls}" viewBox="0 0 250 440" role="img" aria-label="Angela">${defs}
      <g class="a-tail" data-zone="tail"><path d="M170 392 C236 384 244 304 218 264 C206 246 216 228 232 236" fill="none" stroke="${OUT}" stroke-width="24" stroke-linecap="round"/><path d="M170 392 C236 384 244 304 218 264 C206 246 216 228 232 236" fill="none" stroke="${FUR}" stroke-width="15" stroke-linecap="round"/></g>
      <g class="a-body" data-zone="belly">
        <path d="M66 214 C36 272 38 372 76 408 L164 408 C202 372 204 272 174 214 Z" fill="${FUR}" stroke="${OUT}" stroke-width="8" stroke-linejoin="round"/>
        <ellipse cx="120" cy="322" rx="44" ry="60" fill="#FFF1F6"/>
        <path d="M78 222 Q120 246 162 222" fill="none" stroke="#FF6FA3" stroke-width="11" stroke-linecap="round"/>
        <circle cx="120" cy="240" r="9" fill="#FFD34E" stroke="${OUT}" stroke-width="3"/>
      </g>
      <g class="a-arm-l"><ellipse cx="80" cy="304" rx="16" ry="38" transform="rotate(16 80 304)" fill="${FUR}" stroke="${OUT}" stroke-width="6"/></g>
      <g class="a-arm-r"><ellipse cx="160" cy="304" rx="16" ry="38" transform="rotate(-16 160 304)" fill="${FUR}" stroke="${OUT}" stroke-width="6"/></g>
      <g data-zone="paw" fill="${FUR}" stroke="${OUT}" stroke-width="6"><ellipse cx="90" cy="410" rx="31" ry="16"/><ellipse cx="150" cy="410" rx="31" ry="16"/></g>
      <g fill="#FFB3C7"><circle cx="80" cy="412" r="4"/><circle cx="90" cy="415" r="4"/><circle cx="100" cy="412" r="4"/><circle cx="140" cy="412" r="4"/><circle cx="150" cy="415" r="4"/><circle cx="160" cy="412" r="4"/></g>
      <g class="a-headwrap">${head}</g>
    </svg>`;
  }

  /* ---------------- Köpekçik (puantiyeli fiyonk, pembe tasma) ---------------- */
  function kopus(opt = {}) {
    const { cls = '', label = 'Köpekçik' } = opt;
    const O = '#5A3A48';
    return `<svg class="kopus ${cls}" viewBox="0 0 240 250" role="img" aria-label="${label}">
      <g class="kp-tail"><path d="M168 196 C206 190 214 158 200 142" fill="none" stroke="${O}" stroke-width="20" stroke-linecap="round"/><path d="M168 196 C206 190 214 158 200 142" fill="none" stroke="#fff" stroke-width="12" stroke-linecap="round"/></g>
      <g class="kp-body"><path d="M70 170 C54 214 70 244 120 244 C170 244 186 214 170 170 Z" fill="#fff" stroke="${O}" stroke-width="6" stroke-linejoin="round"/>
        <ellipse cx="120" cy="212" rx="28" ry="24" fill="#FFF1F6"/>
        <g class="kp-paw-l"><ellipse cx="96" cy="240" rx="20" ry="11" fill="#fff" stroke="${O}" stroke-width="5"/></g>
        <g class="kp-paw-r"><ellipse cx="144" cy="240" rx="20" ry="11" fill="#fff" stroke="${O}" stroke-width="5"/></g>
      </g>
      <g class="kp-head">
        <g class="kp-ear-l"><path d="M58 70 C26 72 18 128 34 150 C46 164 64 150 70 124 Z" fill="#FFE6EF" stroke="${O}" stroke-width="6" stroke-linejoin="round"/></g>
        <g class="kp-ear-r"><path d="M182 70 C214 72 222 128 206 150 C194 164 176 150 170 124 Z" fill="#FFE6EF" stroke="${O}" stroke-width="6" stroke-linejoin="round"/></g>
        <ellipse cx="120" cy="104" rx="66" ry="60" fill="#fff" stroke="${O}" stroke-width="6"/>
        <path d="M86 52 Q120 36 154 52" fill="none" stroke="#F4E3EA" stroke-width="8" stroke-linecap="round"/>
        <g class="kp-eyes"><ellipse cx="94" cy="100" rx="10" ry="12" fill="#2A1B24"/><ellipse cx="146" cy="100" rx="10" ry="12" fill="#2A1B24"/><circle cx="90" cy="95" r="4" fill="#fff"/><circle cx="142" cy="95" r="4" fill="#fff"/></g>
        <g class="kp-happy" fill="none" stroke="#2A1B24" stroke-width="5" stroke-linecap="round"><path d="M84 102 Q94 90 104 102"/><path d="M136 102 Q146 90 156 102"/></g>
        <ellipse cx="120" cy="124" rx="13" ry="9" fill="#2A1B24"/><ellipse cx="116" cy="121" rx="4" ry="2.5" fill="#fff" opacity=".6"/>
        <path d="M120 133 Q112 146 102 140 M120 133 Q128 146 138 140" fill="none" stroke="${O}" stroke-width="4" stroke-linecap="round"/>
        <path class="kp-tongue" d="M112 142 Q120 162 128 142 Z" fill="#FF7FA2" stroke="${O}" stroke-width="2.5"/>
        <g fill="#FF9EBB" opacity=".55"><ellipse cx="76" cy="126" rx="12" ry="7"/><ellipse cx="164" cy="126" rx="12" ry="7"/></g>
        <g transform="translate(168 52) rotate(18) scale(.52)">${bowShape('#E3174D', O)}</g>
      </g>
      <path d="M72 166 Q120 188 168 166" fill="none" stroke="#FF6FA3" stroke-width="12" stroke-linecap="round"/>
      <g transform="translate(120 184)"><circle r="11" fill="#FFD34E" stroke="${O}" stroke-width="3"/><text y="5" text-anchor="middle" font-family="Fredoka, sans-serif" font-weight="700" font-size="12" fill="${O}">K</text></g>
    </svg>`;
  }
  // Köpekçiğin kulübesi
  function doghouse(cls = '', name = '') {
    const O = '#5A3A48';
    return `<svg class="doghouse ${cls}" viewBox="0 0 260 220" aria-hidden="true">
      <path d="M30 100 L130 20 L230 100 Z" fill="#FF8FB8" stroke="${O}" stroke-width="6" stroke-linejoin="round"/>
      <g fill="#fff" opacity=".85">${[[92, 70], [130, 50], [168, 70], [110, 88], [150, 88]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="6"/>`).join('')}</g>
      <rect x="48" y="96" width="164" height="112" rx="8" fill="#FFF1D6" stroke="${O}" stroke-width="6"/>
      <path d="M100 208 V160 Q130 124 160 160 V208 Z" fill="#5A3A48"/>
      <rect x="92" y="104" width="76" height="24" rx="6" fill="#fff" stroke="${O}" stroke-width="4"/>
      <text x="130" y="122" text-anchor="middle" font-family="Fredoka, sans-serif" font-weight="700" font-size="15" fill="#E3174D">${K.esc(String(name).toLocaleUpperCase("tr"))}</text>
      <g transform="translate(130 20) scale(.5)">${bowShape('#E3174D', O)}</g>
    </svg>`;
  }
  // Instagram sohbet temamızdaki gibi uçan çiçek adası
  function island(cls = '') {
    const flowers = [[30, 14, '#FF8FB8'], [52, 8, '#fff'], [74, 12, '#FF6FA3'], [98, 6, '#FFD6E5'], [120, 12, '#FF8FB8'], [142, 9, '#fff'], [60, 18, '#FFB3CE'], [110, 18, '#FF6FA3']];
    return `<svg class="island ${cls}" viewBox="0 0 170 80" aria-hidden="true">
      <path d="M8 22 C40 14 130 12 162 22 C150 44 120 70 86 76 C54 70 22 46 8 22 Z" fill="#D9A4C2"/>
      <path d="M8 22 C40 14 130 12 162 22 C150 30 120 34 86 34 C50 34 22 30 8 22 Z" fill="#7FB88F"/>
      <g stroke="#5E9B6E" stroke-width="2">${flowers.map(([x, y]) => `<path d="M${x} ${y + 12} V${y + 4}"/>`).join('')}</g>
      ${flowers.map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="4.5" fill="${c}"/><circle cx="${x}" cy="${y}" r="1.6" fill="#FFD34E"/>`).join('')}
      <g fill="#FFF4C7" class="island-glow"><circle cx="40" cy="4" r="1.6"/><circle cx="132" cy="2" r="1.4"/><circle cx="90" cy="0" r="1.2"/></g>
    </svg>`;
  }

  /* ---------------- Kuleler ---------------- */
  // İstanbul — Kız Kulesi
  function kizKulesi(cls = '') {
    const S = '#8B5E6B';
    return `<svg class="tower tower-ist ${cls}" viewBox="0 0 160 220" role="img" aria-label="Kız Kulesi, İstanbul">
      <path d="M0 200 Q20 192 40 200 T80 200 T120 200 T160 200 V220 H0 Z" fill="var(--sea, #BFE6FF)"/>
      <path d="M10 202 C22 180 50 174 80 176 C112 174 140 180 150 202 Z" fill="#EACBBE" stroke="${S}" stroke-width="3" stroke-linejoin="round"/>
      <rect x="26" y="134" width="108" height="46" rx="3" fill="#FFF7EE" stroke="${S}" stroke-width="3"/>
      <path d="M22 136 L138 136 L130 124 L30 124 Z" fill="#F29BB5" stroke="${S}" stroke-width="3" stroke-linejoin="round"/>
      <rect x="30" y="104" width="20" height="22" fill="#FFF7EE" stroke="${S}" stroke-width="3"/>
      <path d="M28 106 Q40 88 52 106 Z" fill="#C9B6FF" stroke="${S}" stroke-width="3" stroke-linejoin="round"/>
      <g class="win" fill="${S}">${[38, 56, 104, 122]
        .map((x) => `<path d="M${x - 5} 170 V156 Q${x} 148 ${x + 5} 156 V170 Z"/>`)
        .join('')}</g>
      <rect x="66" y="58" width="28" height="78" fill="#FFF7EE" stroke="${S}" stroke-width="3"/>
      <rect x="60" y="88" width="40" height="7" rx="2" fill="#F29BB5" stroke="${S}" stroke-width="3"/>
      <g class="win" fill="${S}"><path d="M75 82 V68 Q80 62 85 68 V82 Z"/><path d="M75 122 V106 Q80 100 85 106 V122 Z"/></g>
      <rect x="68" y="40" width="24" height="20" fill="#FFF7EE" stroke="${S}" stroke-width="3"/>
      <g class="win" fill="${S}"><rect x="72" y="45" width="5" height="10" rx="2"/><rect x="83" y="45" width="5" height="10" rx="2"/></g>
      <path d="M63 42 L97 42 L80 8 Z" fill="#C9B6FF" stroke="${S}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M80 8 V1" stroke="${S}" stroke-width="3" stroke-linecap="round"/>
      <path d="M80 2 C76 -2 72 3 80 8 C88 3 84 -2 80 2 Z" fill="#E3174D"/>
    </svg>`;
  }
  // Bakü — Qız Qalası
  function qizQalasi(cls = '') {
    const S = '#8B5E6B';
    const xl = (y) => 42 - ((y - 36) * 8) / 170;
    const xr = (y) => 114 + ((y - 36) * 8) / 170;
    return `<svg class="tower tower-baku ${cls}" viewBox="0 0 160 220" role="img" aria-label="Qız Qalası, Bakü">
      <path d="M0 206 Q40 198 80 204 T160 204 V220 H0 Z" fill="#F7E3D3"/>
      <path d="M112 208 L110 72 Q126 70 136 82 L142 208 Z" fill="#EAC3A4" stroke="${S}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M34 208 L42 36 Q78 28 114 36 L122 208 Z" fill="#F5D9C1" stroke="${S}" stroke-width="3" stroke-linejoin="round"/>
      <g fill="none" stroke="#CFA489" stroke-width="2.2">${[62, 88, 114, 140, 166, 190]
        .map((y) => `<path d="M${xl(y).toFixed(1)} ${y} Q78 ${y + 6} ${xr(y).toFixed(1)} ${y}"/>`)
        .join('')}</g>
      <rect x="36" y="26" width="84" height="12" rx="3" fill="#EAC3A4" stroke="${S}" stroke-width="3"/>
      <g fill="#EAC3A4" stroke="${S}" stroke-width="2.5">${[40, 56, 72, 88, 104]
        .map((x) => `<rect x="${x}" y="18" width="10" height="10" rx="1.5"/>`)
        .join('')}</g>
      <g class="win" fill="${S}"><path d="M60 80 V68 Q64 62 68 68 V80 Z"/><path d="M90 108 V96 Q94 90 98 96 V108 Z"/><path d="M64 146 V134 Q68 128 72 134 V146 Z"/><path d="M96 170 V158 Q100 152 104 158 V170 Z"/></g>
      <path d="M68 208 V190 Q78 178 88 190 V208 Z" fill="${S}"/>
      <path d="M78 18 V-2" stroke="${S}" stroke-width="3" stroke-linecap="round"/>
      <path d="M78 -1 L100 5 L78 11 Z" fill="#FF6FA3" stroke="${S}" stroke-width="2" stroke-linejoin="round"/>
    </svg>`;
  }
  // Bakü Alev Kuleleri silueti (küçük)
  function flameTowers(fill = '#E7A9C4') {
    return `<svg viewBox="0 0 90 90" class="flames" aria-hidden="true"><g fill="${fill}">
      <path d="M8 90 C4 60 10 34 22 18 C30 36 34 62 30 90 Z"/><path d="M34 90 C30 52 36 20 50 2 C60 24 64 56 58 90 Z"/><path d="M62 90 C60 64 66 42 78 30 C86 48 88 70 84 90 Z"/></g></svg>`;
  }

  /* ---------------- Bayrak dizisi (iki kule arasında) ---------------- */
  function garland(cls = '') {
    const colors = ['#FF8FB8', '#FFD34E', '#C9B6FF', '#8FD3FF', '#FF6FA3', '#7ED6A5'];
    let flags = '';
    const n = 13;
    for (let i = 1; i < n; i++) {
      const t = i / n;
      const x = 20 + t * 560;
      const y = 22 + Math.sin(t * Math.PI) * 62;
      if (i % 3 === 0) {
        flags += `<path transform="translate(${x} ${y + 4}) scale(1.1)" d="M0 16 C-12 6 -12 -4 -5 -4 C-2 -4 0 -1 0 1 C0 -1 2 -4 5 -4 C12 -4 12 6 0 16 Z" fill="#E3174D"/>`;
      } else {
        flags += `<path d="M${x - 11} ${y} L${x + 11} ${y} L${x} ${y + 24} Z" fill="${colors[i % colors.length]}"/>`;
      }
    }
    return `<svg class="garland ${cls}" viewBox="0 0 600 120" preserveAspectRatio="none" aria-hidden="true">
      <path d="M20 22 Q300 146 580 22" fill="none" stroke="#B9869C" stroke-width="2.5"/>${flags}</svg>`;
  }

  /* ---------------- İkonlar (kapılar ve çıkartmalar için, 64×64) ---------------- */
  const s = `stroke="${LINE}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`;
  const heartPath = (x, y, k = 1, fill = '#E3174D') =>
    `<path transform="translate(${x} ${y}) scale(${k})" d="M0 7 C-11 -1 -11 -12 -4.5 -12 C-1.5 -12 0 -9.5 0 -8 C0 -9.5 1.5 -12 4.5 -12 C11 -12 11 -1 0 7 Z" fill="${fill}" ${s}/>`;
  const ICONS = {
    book: `<path d="M6 16 C16 12 25 13 32 18 C39 13 48 12 58 16 V50 C48 46 39 47 32 52 C25 47 16 46 6 50 Z" fill="#fff" ${s}/><path d="M32 18 V52" ${s}/><path d="M12 24 H25 M12 31 H25 M12 38 H22" ${s} stroke-width="2.4"/>${heartPath(45, 33, 0.95, '#FF6FA3')}`,
    map: `<path d="M16 24 Q32 2 48 24" fill="none" ${s} stroke-dasharray="1 6"/>${heartPath(32, 13, 0.6)}<path d="M16 52 C10 44 7 39 7 33 A9 9 0 0 1 25 33 C25 39 22 44 16 52 Z" fill="#FF8FB8" ${s}/><circle cx="16" cy="33" r="3.5" fill="#fff"/><path d="M48 52 C42 44 39 39 39 33 A9 9 0 0 1 57 33 C57 39 54 44 48 52 Z" fill="#8FD3FF" ${s}/><circle cx="48" cy="33" r="3.5" fill="#fff"/>`,
    palette: `<path d="M32 8 C16 8 6 20 6 33 C6 47 18 54 29 52 C35 51 33 44 37 42 C43 40 58 45 58 31 C58 17 47 8 32 8 Z" fill="#FFF1D6" ${s}/><circle cx="20" cy="24" r="5" fill="#E3174D"/><circle cx="33" cy="18" r="5" fill="#4FC3D9"/><circle cx="46" cy="24" r="5" fill="#FFCF3F"/><circle cx="18" cy="38" r="5" fill="#7ED6A5"/><path d="M40 58 L58 36 L63 41 L45 62 Z" fill="#FF8FB8" ${s}/><path d="M40 58 L38 64 L45 62" fill="#FFE2C4" ${s}/>`,
    angela: `<path d="M12 30 L10 6 L28 18 Z M52 30 L54 6 L36 18 Z" fill="#fff" ${s}/><path d="M14 26 L13 12 L23 19 Z M50 26 L51 12 L41 19 Z" fill="#FFC2D4"/><ellipse cx="32" cy="36" rx="25" ry="22" fill="#fff" ${s}/><ellipse cx="23" cy="34" rx="6" ry="7.5" fill="#4FC3D9" ${s} stroke-width="2"/><ellipse cx="41" cy="34" rx="6" ry="7.5" fill="#4FC3D9" ${s} stroke-width="2"/><circle cx="22" cy="32" r="2" fill="#fff"/><circle cx="40" cy="32" r="2" fill="#fff"/><path d="M29 44 Q32 42 35 44 Q33 47 32 47 Q31 47 29 44 Z" fill="#FF8FB0"/><ellipse cx="15" cy="44" rx="4" ry="2.4" fill="#FF9EBB" opacity=".7"/><ellipse cx="49" cy="44" rx="4" ry="2.4" fill="#FF9EBB" opacity=".7"/>`,
    letter: `<rect x="6" y="16" width="52" height="34" rx="4" fill="#fff" ${s}/><path d="M6 18 L32 38 L58 18" fill="none" ${s}/>${heartPath(32, 38, 0.8)}`,
    cards: `<rect x="14" y="10" width="30" height="40" rx="5" transform="rotate(-12 29 30)" fill="#CDB8FF" ${s}/><rect x="22" y="14" width="30" height="40" rx="5" transform="rotate(8 37 34)" fill="#fff" ${s}/>${heartPath(37, 34, 0.9)}`,
    board: `<rect x="6" y="10" width="52" height="36" rx="4" fill="#6FAE97" ${s}/><path d="M18 36 L24 20 L30 36 M20 31 H28 M38 28 H48 M43 23 V33" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/><path d="M22 46 L18 58 M42 46 L46 58" ${s}/><circle cx="50" cy="50" r="8" fill="#E3174D" ${s}/><path d="M50 42 Q52 38 55 38" fill="none" ${s}/>`,
    camera: `<rect x="6" y="16" width="52" height="34" rx="7" fill="#FFB3CE" ${s}/><rect x="6" y="16" width="52" height="10" rx="5" fill="#FF8FB8" ${s}/><circle cx="32" cy="36" r="10" fill="#fff" ${s}/><circle cx="32" cy="36" r="5" fill="#4A2138"/><circle cx="30" cy="34" r="1.6" fill="#fff"/><rect x="44" y="20" width="8" height="4" rx="2" fill="#FFE08A"/><rect x="16" y="50" width="32" height="10" fill="#fff" ${s}/>`,
    list: `<rect x="12" y="10" width="40" height="48" rx="5" fill="#fff" ${s}/><rect x="22" y="6" width="20" height="8" rx="3" fill="#FFB3CE" ${s}/><path d="M19 25 L22 28 L27 22 M19 37 L22 40 L27 34" fill="none" ${s}/><path d="M32 25 H45 M32 37 H45 M20 49 H38" ${s} stroke-width="2.4"/><path d="M46 46 L48 50 L52 50.5 L49 53 L50 57 L46 55 L42 57 L43 53 L40 50.5 L44 50 Z" fill="#FFD34E" stroke="${LINE}" stroke-width="1.8" stroke-linejoin="round"/>`,
    ticket: `<path d="M6 18 H58 V27 A5 5 0 0 0 58 37 V46 H6 V37 A5 5 0 0 0 6 27 Z" fill="#FFE08A" ${s}/><path d="M22 20 V44" stroke="${LINE}" stroke-width="2.4" stroke-dasharray="3 4"/>${heartPath(40, 33, 0.85)}`,
    plane: `<path d="M8 46 Q20 50 26 40" fill="none" ${s} stroke-dasharray="1 5"/><path d="M14 34 L50 24 C58 22 62 26 58 30 L24 44 Z" fill="#fff" ${s}/><path d="M34 30 L28 14 L36 14 L44 27 Z M22 40 L18 52 L26 50 L32 40 Z M18 36 L10 30 L14 28 L22 34 Z" fill="#FF8FB8" ${s}/><circle cx="48" cy="27" r="2" fill="#8FD3FF"/>`,
    moon: `<path d="M38 8 A24 24 0 1 0 56 44 A19 19 0 1 1 38 8 Z" fill="#FFE08A" ${s}/><path d="M50 12 L51.5 16 L55.5 17.5 L51.5 19 L50 23 L48.5 19 L44.5 17.5 L48.5 16 Z" fill="#fff" stroke="${LINE}" stroke-width="1.8" stroke-linejoin="round"/><circle cx="58" cy="30" r="2" fill="${LINE}"/>`,
    music: `<rect x="8" y="30" width="48" height="26" rx="4" fill="#FFB3CE" ${s}/><path d="M8 30 L14 20 H50 L56 30" fill="#FFD6E5" ${s}/><circle cx="32" cy="43" r="5" fill="#fff" ${s} stroke-width="2.4"/><path d="M38 14 V4 L50 2 V10" fill="none" ${s}/><circle cx="35" cy="14" r="3.5" fill="${LINE}"/><circle cx="47" cy="11" r="3.5" fill="${LINE}"/>`,
    cake: `<path d="M32 6 C29 10 29 13 32 14 C35 13 35 10 32 6 Z" fill="#FFB547" ${s} stroke-width="2"/><path d="M32 15 V22" ${s}/><rect x="10" y="22" width="44" height="16" rx="4" fill="#fff" ${s}/><path d="M10 30 Q16 36 21 30 T32 30 T43 30 T54 30" fill="none" stroke="#FF8FB8" stroke-width="3"/><rect x="6" y="38" width="52" height="18" rx="4" fill="#FFB3CE" ${s}/><circle cx="20" cy="47" r="2.5" fill="#fff"/><circle cx="32" cy="47" r="2.5" fill="#fff"/><circle cx="44" cy="47" r="2.5" fill="#fff"/>`,
    sticker: `<path d="M32 5 L39.5 21 L57 23 L44 35 L47.5 52.5 L32 44 L16.5 52.5 L20 35 L7 23 L24.5 21 Z" fill="#FFD34E" ${s}/><path d="M44 35 L47.5 52.5 L38 46 Z" fill="#fff" ${s} stroke-width="2.4"/><circle cx="26" cy="29" r="2.3" fill="${LINE}"/><circle cx="38" cy="29" r="2.3" fill="${LINE}"/><path d="M28 35 Q32 38 36 35" fill="none" ${s} stroke-width="2.4"/>`,
    heart: `${heartPath(32, 36, 2.4)}<path d="M52 8 L53.6 12.4 L58 14 L53.6 15.6 L52 20 L50.4 15.6 L46 14 L50.4 12.4 Z" fill="#FFD34E" stroke="${LINE}" stroke-width="1.8" stroke-linejoin="round"/><circle cx="10" cy="12" r="2.4" fill="#FF8FB8"/>`,
    bow: `<g transform="translate(32 34) scale(.52)">${bowShape('#E3174D', LINE)}</g>`,
    key: `<circle cx="20" cy="32" r="12" fill="#FFD34E" ${s}/><circle cx="20" cy="32" r="4.5" fill="#fff" ${s} stroke-width="2.4"/><path d="M32 32 H58 M48 32 V40 M55 32 V38" fill="none" ${s}/>`,
    crown: `<path d="M8 46 L6 18 L20 30 L32 10 L44 30 L58 18 L56 46 Z" fill="#FFD34E" ${s}/><rect x="8" y="46" width="48" height="8" rx="2" fill="#FFB547" ${s}/><circle cx="32" cy="36" r="4" fill="#FF6FA3"/>`,
    sun: `<circle cx="32" cy="32" r="12" fill="#FFD34E" ${s}/><g ${s}><path d="M32 6 V13 M32 51 V58 M6 32 H13 M51 32 H58 M13.6 13.6 L18.5 18.5 M45.5 45.5 L50.4 50.4 M13.6 50.4 L18.5 45.5 M45.5 18.5 L50.4 13.6"/></g><circle cx="28" cy="30" r="1.8" fill="${LINE}"/><circle cx="36" cy="30" r="1.8" fill="${LINE}"/><path d="M28 35 Q32 38 36 35" fill="none" ${s} stroke-width="2"/>`,
    calendar: `<rect x="8" y="12" width="48" height="44" rx="6" fill="#fff" ${s}/><path d="M8 24 H56" ${s}/><rect x="8" y="12" width="48" height="12" rx="6" fill="#FF8FB8" ${s}/><path d="M20 8 V16 M44 8 V16" ${s}/><text x="32" y="48" text-anchor="middle" font-family="Fredoka, sans-serif" font-weight="700" font-size="18" fill="${LINE}">21</text>`,
    hug: `${heartPath(32, 36, 2.6, '#FF8FB8')}<path d="M10 30 Q6 40 16 46 M54 30 Q58 40 48 46" fill="none" ${s}/>`,
    cap: `<path d="M4 24 L32 12 L60 24 L32 36 Z" fill="#4A2138" ${s}/><path d="M16 29 V42 Q32 50 48 42 V29" fill="#6C3A58" ${s}/><path d="M56 26 V40" ${s}/><circle cx="56" cy="42" r="3" fill="#FFD34E" ${s} stroke-width="2"/>`,
    star: `<path d="M32 5 L39.5 21 L57 23 L44 35 L47.5 52.5 L32 44 L16.5 52.5 L20 35 L7 23 L24.5 21 Z" fill="#FFE08A" ${s}/><path d="M54 48 L55.4 51.6 L59 53 L55.4 54.4 L54 58 L52.6 54.4 L49 53 L52.6 51.6 Z" fill="#fff" stroke="${LINE}" stroke-width="1.8"/>`,
    apple: `<path d="M32 18 C22 10 8 16 10 32 C12 48 22 58 32 52 C42 58 52 48 54 32 C56 16 42 10 32 18 Z" fill="#E3174D" ${s}/><path d="M32 18 Q32 10 36 6" fill="none" ${s}/><path d="M36 12 Q44 6 48 12 Q42 16 36 12 Z" fill="#7ED6A5" ${s} stroke-width="2.2"/><ellipse cx="22" cy="28" rx="4" ry="6" fill="#fff" opacity=".45"/>`,
    pencil: `<path d="M12 52 L16 38 L44 10 L54 20 L26 48 Z" fill="#FFD34E" ${s}/><path d="M12 52 L16 38 L26 48 Z" fill="#FFE2C4" ${s}/><path d="M40 14 L50 24" ${s}/><path d="M44 10 L54 20 L58 16 C60 14 60 12 58 10 L54 6 C52 4 50 4 48 6 Z" fill="#FF8FB8" ${s}/>`,
    chat: `<path d="M8 12 H44 A6 6 0 0 1 50 18 V36 A6 6 0 0 1 44 42 H22 L12 50 V42 H14 A6 6 0 0 1 8 36 Z" fill="#E6DCFF" ${s}/><path d="M26 22 H56 A4 4 0 0 1 60 26 V42 A4 4 0 0 1 56 46 H54 V54 L46 46 H30 A4 4 0 0 1 26 42 Z" fill="#FFB3CE" ${s}/>${heartPath(43, 37, 0.6)}`,
    note: `<rect x="10" y="12" width="36" height="36" rx="3" transform="rotate(-8 28 30)" fill="#8FD3FF" ${s}/><rect x="20" y="18" width="36" height="36" rx="3" transform="rotate(6 38 36)" fill="#FFE08A" ${s}/><text x="38" y="38" text-anchor="middle" font-family="Caveat, cursive" font-weight="700" font-size="14" fill="${LINE}" transform="rotate(6 38 36)">♡</text>${heartPath(38, 47, 0.45)}`,
    frame: `<rect x="8" y="8" width="48" height="48" rx="4" fill="#FFD34E" ${s}/><rect x="15" y="15" width="34" height="34" rx="2" fill="#FFD6E5" ${s} stroke-width="2.4"/><circle cx="32" cy="28" r="6" fill="#fff" ${s} stroke-width="2"/><path d="M22 46 Q32 34 42 46" fill="#fff" ${s} stroke-width="2"/><circle cx="8" cy="8" r="3" fill="#FFD34E" ${s} stroke-width="2"/><circle cx="56" cy="8" r="3" fill="#FFD34E" ${s} stroke-width="2"/><circle cx="8" cy="56" r="3" fill="#FFD34E" ${s} stroke-width="2"/><circle cx="56" cy="56" r="3" fill="#FFD34E" ${s} stroke-width="2"/>`,
    vinyl: `<circle cx="32" cy="32" r="26" fill="#2B2024" ${s}/><circle cx="32" cy="32" r="18" fill="none" stroke="#5A4A54" stroke-width="1.5"/><circle cx="32" cy="32" r="13" fill="none" stroke="#5A4A54" stroke-width="1.5"/><circle cx="32" cy="32" r="9" fill="#FF8FB8"/><circle cx="32" cy="32" r="2.2" fill="#2B2024"/><path d="M50 10 L58 18 L44 34" fill="none" ${s}/>`,
    paw: `<ellipse cx="32" cy="42" rx="13" ry="11" fill="#FF8FB8" ${s}/><ellipse cx="17" cy="27" rx="6" ry="7.5" fill="#FF8FB8" ${s}/><ellipse cx="27" cy="18" rx="6" ry="7.5" fill="#FF8FB8" ${s}/><ellipse cx="38" cy="18" rx="6" ry="7.5" fill="#FF8FB8" ${s}/><ellipse cx="47" cy="27" rx="6" ry="7.5" fill="#FF8FB8" ${s}/>`,
    hugs: `<g transform="translate(-2 6)"><circle cx="20" cy="28" r="12" fill="#fff" ${s}/><circle cx="44" cy="28" r="12" fill="#fff" ${s}/><circle cx="16" cy="26" r="1.8" fill="${LINE}"/><circle cx="24" cy="26" r="1.8" fill="${LINE}"/><circle cx="40" cy="26" r="1.8" fill="${LINE}"/><circle cx="48" cy="26" r="1.8" fill="${LINE}"/><path d="M26 18 Q20 10 14 16 M38 18 Q44 10 50 16" fill="#E3174D" ${s} stroke-width="2"/><path d="M8 40 Q32 58 56 40" fill="none" ${s}/></g>${heartPath(32, 12, 0.7)}`,
    news: `<rect x="8" y="10" width="44" height="44" rx="4" fill="#fff" ${s}/><path d="M52 18 H58 V48 A6 6 0 0 1 52 54" fill="#FFE1EC" ${s}/><rect x="14" y="16" width="32" height="8" rx="2" fill="#FF8FB8" ${s} stroke-width="2"/><path d="M14 31 H30 M14 37 H30 M14 43 H30 M14 49 H26" ${s} stroke-width="2.2"/><rect x="34" y="30" width="12" height="14" rx="2" fill="#8FD3FF" ${s} stroke-width="2"/>`,
    radio: `<rect x="16" y="18" width="32" height="40" rx="7" fill="#FF8FB8" ${s}/><path d="M38 18 V6" ${s}/><circle cx="38" cy="5" r="3" fill="#E3174D" ${s} stroke-width="2"/><rect x="21" y="24" width="22" height="12" rx="3" fill="#FFF1F6" ${s} stroke-width="2"/>${heartPath(32, 31, 0.45)}<g fill="${LINE}"><circle cx="25" cy="44" r="2"/><circle cx="32" cy="44" r="2"/><circle cx="39" cy="44" r="2"/><circle cx="25" cy="51" r="2"/><circle cx="32" cy="51" r="2"/><circle cx="39" cy="51" r="2"/></g><path d="M6 22 Q2 30 6 38 M10 25 Q8 30 10 35 M58 22 Q62 30 58 38 M54 25 Q56 30 54 35" fill="none" ${s} stroke-width="2.2"/>`,
    jar: `<rect x="18" y="6" width="28" height="9" rx="3" fill="#FFB547" ${s}/><path d="M20 15 H44 V20 C52 24 54 30 54 38 V52 A6 6 0 0 1 48 58 H16 A6 6 0 0 1 10 52 V38 C10 30 12 24 20 20 Z" fill="#E6F6FF" ${s}/><path d="M16 34 H48" ${s} stroke-width="2" stroke-dasharray="2 4"/>${heartPath(24, 46, 0.55, '#FF6FA3')}<path d="M38 40 L39.6 44 L44 44.6 L40.6 47.4 L41.6 52 L38 49.6 L34.4 52 L35.4 47.4 L32 44.6 L36.4 44 Z" fill="#FFD34E" stroke="${LINE}" stroke-width="1.6" stroke-linejoin="round"/>`,
    film: `<rect x="8" y="26" width="48" height="30" rx="4" fill="#2B2024" ${s}/><path d="M8 18 L54 8 L56 16 L10 26 Z" fill="#fff" ${s}/><path d="M18 16 L22 22 M30 13 L34 19 M42 10 L46 16" ${s} stroke-width="2.4"/>${heartPath(32, 42, 1, '#FF6FA3')}`,
    gift: `<rect x="10" y="26" width="44" height="30" rx="4" fill="#FF8FB8" ${s}/><rect x="6" y="18" width="52" height="11" rx="3" fill="#FFB3CE" ${s}/><path d="M32 18 V56" ${s}/><path d="M32 18 C24 6 12 10 18 17 C21 20 28 19 32 18 C36 19 43 20 46 17 C52 10 40 6 32 18 Z" fill="#E3174D" ${s} stroke-width="2.4"/><g fill="#fff" opacity=".85"><circle cx="18" cy="38" r="2.4"/><circle cx="24" cy="46" r="2.4"/><circle cx="42" cy="36" r="2.4"/><circle cx="46" cy="47" r="2.4"/></g>`,
    snow: `<g ${s} stroke="#6FA8DC"><path d="M32 6 V58 M9.5 19 L54.5 45 M9.5 45 L54.5 19"/><path d="M26 10 L32 16 L38 10 M26 54 L32 48 L38 54 M10 27 L17 25 L15 18 M54 37 L47 39 L49 46 M10 37 L17 39 L15 46 M54 27 L47 25 L49 18" stroke-width="2.6"/></g><circle cx="32" cy="32" r="6" fill="#fff" ${s}/>${heartPath(32, 34, 0.35)}`,
    story: `<rect x="10" y="8" width="30" height="48" rx="6" fill="#C9B6FF" ${s}/><rect x="24" y="12" width="30" height="48" rx="6" fill="#fff" ${s}/><path d="M28 18 H50" stroke="#FF6FA3" stroke-width="3" stroke-linecap="round"/><path d="M31 48 V38 M37 48 V30 M43 48 V34 M49 48 V26" ${s}/>`,
    mic: `<rect x="22" y="6" width="20" height="32" rx="10" fill="#FFB3CE" ${s}/><path d="M14 30 A18 18 0 0 0 50 30 M32 48 V58 M22 58 H42" fill="none" ${s}/><path d="M26 18 H38 M26 25 H38" ${s} stroke-width="2"/>${heartPath(52, 14, 0.5)}`,
    sky: `<circle cx="32" cy="32" r="26" fill="#2A1D57" ${s}/><g fill="#FFF4C7"><circle cx="20" cy="22" r="2.6"/><circle cx="30" cy="16" r="2"/><circle cx="42" cy="24" r="2.8"/><circle cx="46" cy="38" r="2"/><circle cx="24" cy="40" r="2.4"/></g><path d="M20 22 L30 16 L42 24 L46 38" fill="none" stroke="#FFF4C7" stroke-width="1.4" opacity=".8"/><path d="M8 46 Q32 36 56 46" fill="none" stroke="#FF8FB8" stroke-width="2"/>`,
    question: `<path d="M8 12 H56 A4 4 0 0 1 60 16 V42 A4 4 0 0 1 56 46 H26 L14 56 V46 H8 A4 4 0 0 1 4 42 V16 A4 4 0 0 1 8 12 Z" fill="#FFE08A" ${s}/><path d="M26 24 A6 6 0 1 1 34 30 C32 31 32 33 32 35" fill="none" ${s}/><circle cx="32" cy="40" r="2.2" fill="${LINE}"/>`,
    party: `<path d="M10 56 L24 14 L50 40 Z" fill="#FFD34E" ${s}/><path d="M17 36 L34 24 M14 46 L42 32" stroke="#FF6FA3" stroke-width="3.2"/><circle cx="48" cy="12" r="3" fill="#8FD3FF"/><circle cx="56" cy="24" r="2.4" fill="#FF6FA3"/><path d="M36 8 L38 14 M52 32 L58 30" ${s} stroke-width="2.4"/>`,
    hourglass: `<path d="M16 6 H48 M16 58 H48" ${s} stroke-width="4"/><path d="M19 8 C19 24 30 26 30 32 C30 38 19 40 19 56 H45 C45 40 34 38 34 32 C34 26 45 24 45 8 Z" fill="#FFF1F6" ${s}/><path d="M23 14 H41 C39 22 33 25 32 29 C31 25 25 22 23 14 Z" fill="#FF8FB8"/><path d="M22 52 C24 44 30 42 32 40 C34 42 40 44 42 52 Z" fill="#FF8FB8"/><path d="M32 30 V40" stroke="#FF8FB8" stroke-width="2" stroke-dasharray="2 2"/>`,
    door: `<path d="M14 58 V20 A18 18 0 0 1 50 20 V58 Z" fill="#C98A5C" ${s}/><path d="M20 58 V22 A12 12 0 0 1 44 22 V58" fill="#2A1D57" ${s} stroke-width="2.4"/><path d="M24 58 L28 50 H36 L40 58" fill="#4A3A7A"/><path d="M26 50 H38 M28 44 H36" stroke="#FFF4C7" stroke-width="2" opacity=".8"/><circle cx="32" cy="30" r="5" fill="#FFF4C7" opacity=".85"/><text x="32" y="33" text-anchor="middle" font-family="Fredoka, sans-serif" font-weight="700" font-size="6" fill="#2A1D57">63</text>`,
    lily: `<path d="M32 58 C32 46 31 38 32 30" fill="none" stroke="#3FA37A" stroke-width="3.2" stroke-linecap="round"/><path d="M32 50 C24 46 20 40 22 34 C28 38 31 43 32 50 Z" fill="#7ED6A5" ${s} stroke-width="2"/><g transform="translate(32 24)"><path d="M0 4 C-6 -4 -18 -8 -24 -4 C-18 0 -8 4 0 4 Z" fill="#FF8FB8" ${s} stroke-width="2.2"/><path d="M0 4 C6 -4 18 -8 24 -4 C18 0 8 4 0 4 Z" fill="#FF8FB8" ${s} stroke-width="2.2"/><path d="M0 4 C-4 -6 -4 -16 0 -22 C4 -16 4 -6 0 4 Z" fill="#FFD0E1" ${s} stroke-width="2.2"/><path d="M0 4 C-10 2 -16 10 -16 16 C-8 14 -3 10 0 4 Z" fill="#FFB3CE" ${s} stroke-width="2.2"/><path d="M0 4 C10 2 16 10 16 16 C8 14 3 10 0 4 Z" fill="#FFB3CE" ${s} stroke-width="2.2"/><g fill="#C7386F"><circle cx="-12" cy="-3" r="1.2"/><circle cx="12" cy="-3" r="1.2"/><circle cx="-8" cy="-1" r="1"/><circle cx="8" cy="-1" r="1"/></g><path d="M0 4 L-4 -8 M0 4 L0 -10 M0 4 L4 -8" stroke="#C98A12" stroke-width="1.4"/><g fill="#C98A12"><circle cx="-4" cy="-9" r="1.6"/><circle cx="0" cy="-11" r="1.6"/><circle cx="4" cy="-9" r="1.6"/></g></g>`,
    pigeon: `<path d="M10 38 C14 28 26 24 36 28 L46 20 C50 16 56 18 56 22 L52 24 L58 28 L50 30 C50 42 40 50 26 50 C18 50 12 46 10 38 Z" fill="#fff" ${s}/><path d="M22 34 C28 22 40 14 52 12 C46 22 38 32 26 38 Z" fill="#DCE6F5" ${s} stroke-width="2.4"/><circle cx="50" cy="23" r="1.8" fill="${LINE}"/><path d="M24 50 L22 58 M30 50 L30 58" ${s} stroke-width="2.2"/><rect x="30" y="38" width="12" height="9" rx="1.5" fill="#FFE1EC" ${s} stroke-width="2" transform="rotate(-8 36 42)"/>${heartPath(36, 42, 0.35)}`,
    maze: `<path d="M32 56 C8 40 4 26 10 16 C16 6 28 8 32 18 C36 8 48 6 54 16 C60 26 56 40 32 56 Z" fill="#FFE1EC" ${s}/><path d="M32 48 V40 H22 V28 M28 20 H38 V32 H44 M16 22 V32 M48 22 V34 H40 M26 34 H36 V40" fill="none" stroke="#C7386F" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>${heartPath(32, 30, 0.5)}`,
    dance: `<path d="M12 44 C12 36 20 34 26 38 L30 42 C32 46 30 50 26 50 H16 C13 50 12 48 12 44 Z" fill="#E3174D" ${s}/><path d="M26 50 L28 58" ${s} stroke-width="3"/><path d="M34 34 C36 26 44 24 50 28 L54 32 C56 36 54 40 50 40 H40 C36 40 34 38 34 34 Z" fill="#4FA3E3" ${s}/><path d="M50 40 L52 48" ${s} stroke-width="3"/><path d="M40 12 V22 M40 12 L48 10 V20" fill="none" ${s} stroke-width="2.4"/><circle cx="38" cy="22" r="2.6" fill="${LINE}"/><circle cx="46" cy="20" r="2.6" fill="${LINE}"/><path d="M14 18 Q20 12 24 20" fill="none" ${s} stroke-width="2.2"/>`,
    week: `<rect x="6" y="12" width="52" height="44" rx="6" fill="#fff" ${s}/><path d="M6 22 H58" ${s}/><path d="M18 8 V16 M46 8 V16" ${s}/><rect x="12" y="28" width="10" height="16" rx="2" fill="#8FD3FF"/><rect x="27" y="28" width="10" height="10" rx="2" fill="#FF8FB8"/><rect x="42" y="34" width="10" height="16" rx="2" fill="#8FD3FF"/><rect x="27" y="42" width="10" height="8" rx="2" fill="#FFD34E"/>`,
    owl: `<path d="M38 8 A24 24 0 1 0 56 44 A19 19 0 1 1 38 8 Z" fill="#C9B6FF" ${s}/><text x="44" y="26" font-family="Fredoka, sans-serif" font-weight="700" font-size="11" fill="${LINE}">z</text><text x="50" y="16" font-family="Fredoka, sans-serif" font-weight="700" font-size="8" fill="${LINE}">z</text>`,
    dice: `<rect x="6" y="20" width="30" height="30" rx="6" transform="rotate(-10 21 35)" fill="#fff" ${s}/><g fill="${LINE}" transform="rotate(-10 21 35)"><circle cx="14" cy="27" r="2.6"/><circle cx="21" cy="35" r="2.6"/><circle cx="28" cy="43" r="2.6"/></g><rect x="30" y="14" width="28" height="28" rx="6" transform="rotate(12 44 28)" fill="#E3174D" ${s}/><g fill="#fff" transform="rotate(12 44 28)"><circle cx="37" cy="21" r="2.4"/><circle cx="51" cy="21" r="2.4"/><circle cx="44" cy="28" r="2.4"/><circle cx="37" cy="35" r="2.4"/><circle cx="51" cy="35" r="2.4"/></g>`,
    clapper: `<rect x="8" y="26" width="48" height="30" rx="4" fill="#fff" ${s}/><path d="M8 18 L52 8 L54 16 L10 26 Z" fill="#2B2024" ${s}/><path d="M17 16 L22 23 M29 13 L34 20 M41 10 L46 17" stroke="#fff" stroke-width="3" stroke-linecap="round"/><path d="M8 26 H56" ${s}/>${heartPath(32, 42, 1, '#E3174D')}<circle cx="16" cy="34" r="2" fill="#F6C9DA"/><circle cx="48" cy="50" r="2" fill="#F6C9DA"/>`,
    cloud: `<circle cx="42" cy="22" r="11" fill="#FFD34E" ${s}/><g ${s}><path d="M42 5 V8 M56 10 L54 12 M60 22 H57 M28 10 L30 12"/></g><path d="M14 52 C6 52 4 42 11 39 C10 30 20 26 25 31 C28 23 42 23 43 33 C51 32 55 40 50 46 C54 50 50 52 46 52 Z" fill="#fff" ${s}/>${heartPath(28, 42, 0.7, '#FF8FB8')}`,
    house: `<path d="M8 30 L32 10 L56 30" fill="none" ${s}/><path d="M14 26 V56 H50 V26" fill="#FFE2EC" ${s}/><rect x="42" y="12" width="7" height="12" fill="#fff" ${s}/><path d="M27 56 V42 A5 5 0 0 1 37 42 V56" fill="#fff" ${s}/><rect x="18" y="32" width="8" height="8" rx="1.5" fill="#BFE6FF" ${s} stroke-width="2.4"/>${heartPath(42, 36, 0.6, '#E3174D')}`,
    candle: `<path d="M22 20 C18 14 22 10 22 6 C26 10 28 14 22 20 Z M42 20 C38 14 42 10 42 6 C46 10 48 14 42 20 Z" fill="#FFB547" ${s} stroke-width="2.2"/><rect x="17" y="22" width="10" height="30" rx="3" fill="#fff" ${s}/><rect x="37" y="22" width="10" height="30" rx="3" fill="#FFD0E1" ${s}/><path d="M8 56 H56" ${s}/>${heartPath(32, 38, 0.6, '#E3174D')}`,
    first: `<path d="M20 36 L12 60 L20 56 L24 62 L30 40 M44 36 L52 60 L44 56 L40 62 L34 40" fill="#8FD3FF" ${s} stroke-width="2.4"/><circle cx="32" cy="26" r="20" fill="#FFD34E" ${s}/><circle cx="32" cy="26" r="14" fill="#fff" ${s} stroke-width="2.2"/><path d="M28 21 L33 17 V35" fill="none" stroke="#E3174D" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>`,
    bridge: `<path d="M2 50 Q10 46 18 50 T34 50 T50 50 T62 50" fill="none" stroke="#8FD3FF" stroke-width="3" stroke-linecap="round"/><path d="M4 42 Q32 12 60 42" fill="none" ${s}/><path d="M4 42 H60" ${s}/><path d="M14 42 V31 M23 42 V25 M32 42 V23 M41 42 V25 M50 42 V31" ${s} stroke-width="2.2"/>${heartPath(32, 12, 0.62, '#E3174D')}`,
    kintsugi: `${heartPath(32, 40, 2.3, '#FF8FB8')}<path d="M31 22 L27 30 L35 36 L29 44 L33 52 M35 36 L42 33" fill="none" stroke="#E8B53A" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>`,
    flag: `<path d="M16 60 V6" ${s}/><circle cx="16" cy="6" r="3" fill="#FFD34E" ${s} stroke-width="2"/><path d="M16 10 C26 4 34 16 46 10 C50 8 54 8 57 10 V34 C51 30 45 36 37 36 C29 36 25 30 16 34 Z" fill="#fff" ${s}/>${heartPath(36, 24, 0.55, '#FF8FB8')}`,
    pot: `<path d="M24 14 C22 10 26 8 24 4 M32 14 C30 10 34 8 32 4 M40 14 C38 10 42 8 40 4" fill="none" ${s} stroke-width="2.2"/><path d="M10 26 H54 V44 C54 52 48 56 40 56 H24 C16 56 10 52 10 44 Z" fill="#FF8FB8" ${s}/><rect x="8" y="20" width="48" height="8" rx="4" fill="#fff" ${s}/><path d="M10 34 H4 M54 34 H60" ${s}/>${heartPath(32, 42, 0.9, '#fff')}`,

    // ---- Kale 4.0 ikon ailesi: yeni odalar (aynı el, aynı çizgi) ----
    hanger: `<path d="M32 14 A5 5 0 1 1 37 9" fill="none" ${s}/><path d="M32 14 V18 L6 40 C4 42 5 46 8 46 H56 C59 46 60 42 58 40 L32 18" fill="#FFE2EC" ${s}/><path d="M18 46 C18 54 46 54 46 46" fill="#FF8FB8" ${s}/>${heartPath(32, 36, 0.55, '#E3174D')}`,
    lamp: `<path d="M18 8 H46 L54 32 H10 Z" fill="#FFD0E1" ${s}/><path d="M32 32 V50" ${s}/><path d="M20 56 C20 50 44 50 44 56 Z" fill="#fff" ${s}/><path class="i-isik" d="M14 40 L8 46 M50 40 L56 46 M32 38 V40" stroke="#FFCF3F" stroke-width="3.4" stroke-linecap="round"/>${heartPath(32, 21, 0.62, '#E3174D')}`,
    curtain: `<rect x="6" y="6" width="52" height="6" rx="3" fill="#fff" ${s}/><rect x="10" y="12" width="44" height="44" fill="#FFF3C4" ${s}/><circle cx="32" cy="30" r="8" fill="#FFCF3F" ${s} stroke-width="2.4"/><path class="i-perde-l" d="M10 12 H24 C22 26 26 40 20 56 H10 Z" fill="#FF8FB8" ${s}/><path class="i-perde-r" d="M54 12 H40 C42 26 38 40 44 56 H54 Z" fill="#FF8FB8" ${s}/>`,
    desk: `<path d="M4 34 H60" ${s}/><path d="M10 34 V58 M54 34 V58" ${s}/><rect x="14" y="18" width="20" height="16" rx="2" fill="#BFE6FF" ${s}/><path d="M40 34 V20 L52 16 V34" fill="#fff" ${s}/><path d="M44 24 H50 M44 29 H50" ${s} stroke-width="2"/><circle cx="24" cy="12" r="5" fill="#FFCF3F" ${s} stroke-width="2.4"/>${heartPath(24, 27, 0.5, '#E3174D')}`,
    clock: `<circle cx="32" cy="34" r="24" fill="#fff" ${s}/><path class="i-akrep" d="M32 34 V18" ${s}/><path class="i-yelkovan" d="M32 34 L44 40" ${s}/><circle cx="32" cy="34" r="3" fill="#E3174D"/><path d="M12 10 L20 16 M52 10 L44 16" ${s}/>${heartPath(32, 50, 0.4, '#FF8FB8')}`,
    window: `<rect x="8" y="8" width="48" height="48" rx="6" fill="#BFE6FF" ${s}/><path d="M8 40 C18 34 28 44 38 38 C46 34 52 38 56 36 V56 H8 Z" fill="#8FD3FF" ${s} stroke-width="2.4"/><path d="M32 8 V56 M8 30 H56" ${s}/><circle cx="20" cy="20" r="5" fill="#FFCF3F" ${s} stroke-width="2.2"/>`,
    headphones: `<path d="M10 40 V32 A22 22 0 0 1 54 32 V40" fill="none" ${s}/><rect x="6" y="36" width="12" height="20" rx="5" fill="#FF8FB8" ${s}/><rect x="46" y="36" width="12" height="20" rx="5" fill="#FF8FB8" ${s}/><path d="M26 30 C26 26 30 24 32 28 C34 24 38 26 38 30 C38 34 32 38 32 38 C32 38 26 34 26 30 Z" fill="#E3174D" ${s} stroke-width="2.2"/>`,
    shield: `<path d="M32 6 L54 14 V30 C54 44 44 54 32 58 C20 54 10 44 10 30 V14 Z" fill="#CDBBFF" ${s}/><path d="M32 14 V50 M18 26 H46" stroke="#fff" stroke-width="3" stroke-linecap="round"/>${heartPath(32, 33, 0.9, '#E3174D')}`,
    duet: `<rect x="8" y="10" width="14" height="24" rx="7" fill="#FF8FB8" ${s}/><rect x="42" y="10" width="14" height="24" rx="7" fill="#8FD3FF" ${s}/><path d="M15 34 V48 C15 54 22 56 32 56 C42 56 49 54 49 48 V34" fill="none" ${s}/>${heartPath(32, 30, 0.85, '#E3174D')}`,
    tea: `<path d="M22 22 C18 34 18 46 24 54 H40 C46 46 46 34 42 22 Z" fill="#FFB547" ${s}/><path d="M20 22 H44" ${s}/><path d="M14 56 H50" ${s}/><path class="i-buhar" d="M28 16 C26 12 30 10 28 6 M36 16 C34 12 38 10 36 6" fill="none" ${s} stroke-width="2.4"/><path d="M42 30 C50 30 50 42 42 42" fill="none" ${s}/>`,
    stars2: `<circle cx="20" cy="22" r="12" fill="#FFF2B8" ${s}/><circle cx="26" cy="18" r="10" fill="#2A2266" opacity=".9"/><path d="M44 10 L46.5 16 L53 16.5 L48 20.5 L49.5 27 L44 23.5 L38.5 27 L40 20.5 L35 16.5 L41.5 16 Z" fill="#FFD34E" ${s} stroke-width="2.2"/><path d="M8 50 C20 40 30 54 56 42" fill="none" ${s} stroke-dasharray="2 6"/>${heartPath(48, 48, 0.55, '#E3174D')}`,
    compass: `<circle cx="32" cy="32" r="25" fill="#fff" ${s}/><circle cx="32" cy="32" r="19" fill="#E0F8EC" ${s} stroke-width="2.2"/><path class="i-igne" d="M32 14 L38 32 L32 50 L26 32 Z" fill="#E3174D" ${s} stroke-width="2.2"/><path d="M32 32 L38 32 L32 50 L26 32 Z" fill="#fff" ${s} stroke-width="2.2"/><circle cx="32" cy="32" r="2.5" fill="${LINE}"/>`,
    comic: `<rect x="6" y="8" width="52" height="48" rx="4" fill="#fff" ${s}/><path d="M6 30 H58 M28 8 V30 M38 30 V56" ${s}/><path d="M12 22 Q16 14 22 20" fill="none" ${s} stroke-width="2.2"/><path d="M34 14 H52 V24 H40 L36 28 V24 H34 Z" fill="#FFF3C4" ${s} stroke-width="2.2"/>${heartPath(22, 46, 0.7, '#FF8FB8')}<circle cx="48" cy="44" r="5" fill="#8FD3FF" ${s} stroke-width="2.2"/>`,
    pin: `<circle cx="32" cy="34" r="24" fill="#BFE6FF" ${s}/><path d="M14 26 C22 30 26 22 34 26 C40 30 46 24 54 28 M12 42 C22 38 30 46 40 40" fill="none" stroke="#7ED6A5" stroke-width="5" stroke-linecap="round"/><path class="i-pin" d="M32 40 C24 30 22 26 22 22 A10 10 0 0 1 42 22 C42 26 40 30 32 40 Z" fill="#E3174D" ${s}/><circle cx="32" cy="22" r="3.5" fill="#fff"/>`,
    poster: `<rect x="12" y="6" width="40" height="52" rx="2" fill="#2A2266" ${s}/><circle cx="16" cy="10" r="2" fill="#FFCF3F"/><circle cx="48" cy="10" r="2" fill="#FFCF3F"/><path d="M18 44 L26 34 L32 40 L38 30 L46 44 Z" fill="#FF8FB8" ${s} stroke-width="2.2"/><circle cx="24" cy="20" r="1.6" fill="#fff"/><circle cx="40" cy="16" r="1.6" fill="#fff"/><circle cx="34" cy="24" r="1.2" fill="#fff"/><path d="M18 50 H46" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>`,
    island: `<path d="M4 46 Q14 42 24 46 T44 46 T60 46" fill="none" stroke="#8FD3FF" stroke-width="3" stroke-linecap="round"/><path d="M10 44 C14 32 50 32 54 44 Z" fill="#FFE27A" ${s}/><path d="M30 40 C30 30 32 22 36 14" fill="none" ${s}/><path d="M36 14 C30 8 22 10 18 16 C24 14 30 14 36 14 C40 8 48 8 52 14 C46 12 40 13 36 14 C38 18 38 24 36 28 C35 22 35 18 36 14" fill="#7ED6A5" ${s} stroke-width="2.4"/>${heartPath(20, 40, 0.45, '#E3174D')}`,
    palace: `<path d="M8 56 H56" ${s}/><rect x="12" y="28" width="40" height="28" fill="#FFF7FA" ${s}/><path d="M8 28 L32 10 L56 28 Z" fill="#CDBBFF" ${s}/><path d="M20 56 V40 M28 56 V40 M36 56 V40 M44 56 V40" ${s} stroke-width="2.4"/><circle cx="32" cy="21" r="4" fill="#FFD34E" ${s} stroke-width="2"/><path d="M32 10 V4" ${s}/>`,
    sword: `<path d="M44 6 L58 6 L58 20 L28 50 L14 36 Z" fill="#E1F3FF" ${s}/><path d="M10 32 L32 54" ${s} stroke-width="4"/><path d="M14 46 L6 54 L10 58 L18 50" fill="#FF8FB8" ${s}/>${heartPath(42, 22, 0.55, '#E3174D')}`,
    cube: `<path d="M32 6 L56 18 V46 L32 58 L8 46 V18 Z" fill="#FFE2EC" ${s}/><path d="M8 18 L32 30 L56 18 M32 30 V58" ${s}/><path d="M32 30 L56 18 V46 L32 58 Z" fill="#FF8FB8" opacity=".55"/><path d="M4 10 V4 H10 M54 4 H60 V10 M4 54 V60 H10 M54 60 H60 V54" fill="none" ${s} stroke-width="2.4"/>`,
    lines: `<path d="M6 54 C14 40 18 44 24 32 S36 14 58 10" fill="none" stroke="#FF8FB8" stroke-width="4" stroke-linecap="round"/><path d="M6 10 C14 22 22 18 28 30 S40 50 58 54" fill="none" stroke="#8FD3FF" stroke-width="4" stroke-linecap="round"/>${heartPath(26, 33, 0.85, '#E3174D')}<circle cx="6" cy="54" r="3" fill="${LINE}"/><circle cx="6" cy="10" r="3" fill="${LINE}"/>`,
    nfc: `<rect x="8" y="24" width="48" height="32" rx="4" fill="#FFD0E1" ${s}/><path d="M8 34 H56" ${s}/><path d="M32 24 C24 14 16 22 32 24 C48 22 40 14 32 24 Z" fill="#E3174D" ${s} stroke-width="2.2"/><path class="i-dalga" d="M42 8 Q46 12 42 16 M48 4 Q55 12 48 20" fill="none" ${s} stroke-width="2.4"/>`,
    swatch: `<rect x="6" y="20" width="18" height="36" rx="4" fill="#FF8FB8" ${s} transform="rotate(-14 15 38)"/><rect x="22" y="12" width="18" height="40" rx="4" fill="#FFE27A" ${s}/><rect x="40" y="18" width="18" height="36" rx="4" fill="#9FD8FF" ${s} transform="rotate(14 49 36)"/><circle cx="31" cy="44" r="3" fill="${LINE}"/>`,
    sunrise: `<path d="M4 44 H60" ${s}/><path d="M14 44 A18 18 0 0 1 50 44" fill="#FFD34E" ${s}/><path class="i-isik" d="M32 18 V10 M14 26 L9 21 M50 26 L55 21 M6 36 H1 M58 36 H63" stroke="#FFB547" stroke-width="3.4" stroke-linecap="round"/><path d="M12 52 H52 M20 58 H44" ${s} stroke-width="2.4"/>`,
    cam2: `<rect x="4" y="18" width="26" height="22" rx="5" fill="#FF8FB8" ${s}/><circle cx="17" cy="29" r="6" fill="#fff" ${s} stroke-width="2.2"/><rect x="34" y="24" width="26" height="22" rx="5" fill="#8FD3FF" ${s}/><circle cx="47" cy="35" r="6" fill="#fff" ${s} stroke-width="2.2"/>${heartPath(32, 52, 0.55, '#E3174D')}`,
    lens: `<circle cx="26" cy="26" r="16" fill="#E1F3FF" ${s}/><path d="M38 38 L56 56" ${s} stroke-width="5"/><path d="M18 20 Q22 14 28 14" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>${heartPath(26, 29, 0.6, '#E3174D')}`,
  };
  function icon(name, cls = '') {
    return `<svg class="ic i-${ICONS[name] ? name : 'heart'} ${cls}" viewBox="0 0 64 64" aria-hidden="true">${ICONS[name] || ICONS.heart}</svg>`;
  }

  /* ---------------- Arayüz ikonları (24×24, currentColor) ---------------- */
  const U = {
    back: '<path d="M15 5 L8 12 L15 19"/>',
    close: '<path d="M6 6 L18 18 M18 6 L6 18"/>',
    music: '<path d="M9 18 V6 L19 4 V16"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/>',
    musicOff: '<path d="M9 18 V6 L19 4 V16"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/><path d="M3 3 L21 21"/>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11 A7 7 0 0 0 19 11 M12 18 V21"/>',
    speaker: '<path d="M4 9 H8 L13 5 V19 L8 15 H4 Z"/><path d="M16 9 Q18 12 16 15 M18.5 6.5 Q22 12 18.5 17.5"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11 V8 A4 4 0 0 1 16 8 V11"/>',
    check: '<path d="M5 12 L10 17 L19 7"/>',
    share: '<path d="M12 3 V15 M7 8 L12 3 L17 8"/><path d="M5 13 V20 H19 V13"/>',
    download: '<path d="M12 4 V16 M7 11 L12 16 L17 11"/><path d="M5 20 H19"/>',
    trash: '<path d="M4 7 H20 M9 7 V4 H15 V7 M6 7 L7 20 H17 L18 7"/>',
    undo: '<path d="M9 7 L4 12 L9 17"/><path d="M4 12 H14 A6 6 0 0 1 14 24" transform="translate(0 -6)"/>',
    shuffle: '<path d="M4 7 H8 L16 17 H20 M4 17 H8 L10.5 14 M13.5 10 L16 7 H20 M17 4 L20 7 L17 10 M17 14 L20 17 L17 20"/>',
    play: '<path d="M7 4 L19 12 L7 20 Z"/>',
    pause: '<path d="M8 5 V19 M16 5 V19"/>',
    heart: '<path d="M12 20 C4 14 2 10 4 6.5 C6 3.5 10 4 12 7 C14 4 18 3.5 20 6.5 C22 10 20 14 12 20 Z"/>',
    eraser: '<path d="M4 16 L12 8 L18 14 L12 20 H8 Z M9 11 L15 17 M12 20 H20"/>',
    bucket: '<path d="M5 11 L11 5 L18 12 L12 18 Z M11 5 L9 3 M18 12 H19 M20 15 Q21 18 20 19 Q19 20 18 19 Q17 18 18 15 Z"/>',
    brush: '<path d="M4 20 C4 16 6 14 8 14 C10 14 11 16 10 18 C9 20 6 20 4 20 Z M9 13 L19 3 L21 5 L11 15"/>',
    plus: '<path d="M12 5 V19 M5 12 H19"/>',
    send: '<path d="M4 12 L20 4 L14 20 L11 13 Z M11 13 L20 4"/>',
    refresh: '<path d="M19 8 A8 8 0 1 0 20 13 M19 3 V8 H14"/>',
    next: '<path d="M9 5 L16 12 L9 19"/>',
    sparkle: '<path d="M12 3 L13.8 10.2 L21 12 L13.8 13.8 L12 21 L10.2 13.8 L3 12 L10.2 10.2 Z"/>',
    image: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M4 18 L10 13 L14 16 L17 13 L21 17"/>',
    camera: '<path d="M3 8 H7.5 L9.5 5 H14.5 L16.5 8 H21 V19 H3 Z"/><circle cx="12" cy="13" r="3.6"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8 V4 H4 V16 H8"/>',
    search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 L20 20"/>',
    home: '<path d="M4 11 L12 4 L20 11"/><path d="M6 10 V20 H18 V10"/><path d="M10 20 V15 H14 V20"/>',
    castle: '<path d="M4 20 V9 H7 V11 H9 V9 H11 V20 M13 20 V9 H15 V11 H17 V9 H20 V20 Z M4 20 H20"/><path d="M11 14 H13"/><path d="M7.5 9 V5 L9 6 L7.5 7"/>',
    cal: '<rect x="4" y="5" width="16" height="15" rx="3"/><path d="M4 10 H20 M8 3 V7 M16 3 V7"/><path d="M8 14 H9 M11.5 14 H12.5 M15 14 H16 M8 17 H9 M11.5 17 H12.5"/>',
    wave: '<path d="M7 11 C5 9 5 6 7.5 5.5 C9 5.2 10 6.5 10 7.5 V4.5 C10 3 12.5 3 12.5 4.5 V10 M12.5 5.5 C12.5 4 15 4 15 5.5 V10 M15 7 C15 5.5 17.5 5.5 17.5 7 V13 C17.5 18 14.5 20 11.5 20 C9 20 7.5 18.5 6 16 L4 12.5 C3.3 11.3 5 10 6 11 L7.5 13"/>',
  };
  function ui(name, cls = '') {
    return `<svg class="ui ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${U[name]}</svg>`;
  }

  /* ---------------- Ay evresi ---------------- */
  // p: 0 = yeni ay, 0.5 = dolunay
  function moonPhase(date) {
    const ref = Date.UTC(2000, 0, 6, 18, 14);
    const syn = 29.530588853;
    const days = (date.getTime() - ref) / 864e5;
    const p = (((days % syn) + syn) % syn) / syn;
    const illum = (1 - Math.cos(2 * Math.PI * p)) / 2;
    const names = ['Yeni Ay', 'Büyüyen Hilal', 'İlk Dördün', 'Büyüyen Şişkin Ay', 'Dolunay', 'Küçülen Şişkin Ay', 'Son Dördün', 'Küçülen Hilal'];
    const idx = Math.floor(((p + 1 / 16) % 1) * 8);
    return { p, illum, name: names[idx] };
  }
  function moonSvg(p, r = 44, cls = '') {
    const cx = 50,
      cy = 50;
    const k = Math.cos(2 * Math.PI * p);
    const waxing = p < 0.5;
    const rx = Math.abs(k) * r;
    const outer = waxing ? 1 : 0;
    const term = waxing ? (k > 0 ? 0 : 1) : k > 0 ? 1 : 0;
    const lit = `M${cx} ${cy - r} A${r} ${r} 0 0 ${outer} ${cx} ${cy + r} A${rx.toFixed(2)} ${r} 0 0 ${term} ${cx} ${cy - r} Z`;
    return `<svg class="moon ${cls}" viewBox="0 0 100 100" aria-hidden="true">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="#3B2F66"/>
      <path d="${lit}" fill="#FFF4C7"/>
      <g fill="#E9DBA8" opacity=".55"><circle cx="38" cy="36" r="6"/><circle cx="60" cy="58" r="8"/><circle cx="44" cy="68" r="4"/><circle cx="64" cy="32" r="3.5"/></g>
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#FFF4C7" stroke-opacity=".35" stroke-width="1.5"/>
    </svg>`;
  }

  /* ---------------- SVG → Image (canvas oyunlarında kullanmak için) ---------------- */
  function toImage(svg, w, h) {
    return new Promise((resolve) => {
      const img = new Image(w, h);
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      const src = svg.replace('<svg ', `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" `);
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(src);
    });
  }

  K.art = { kitty, bow, bowShape, angela, kopus, doghouse, island, kizKulesi, qizQalasi, flameTowers, garland, icon, ui, moonPhase, moonSvg, toImage, heartPath, ICONS };
})();
