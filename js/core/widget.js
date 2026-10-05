/* Kale 2.0 — Kale Widget'ı: telefonun ana ekranına (ve kilit ekranına) kalenin küçük bir penceresi. Ücretsiz Scriptable
   uygulaması için kod burada, kalenin kendi ayarlarından üretilir (isimler ve tarihler kasadan gelir, depoda yok):
   birlikte geçen gün, bir sonraki ayın 21'ine kalan gün, iki şehrin canlı saati (sayaç hilesiyle). Dokununca kale açılır. */
(function () {
  'use strict';
  const K = window.K;
  const A = K.art;
  const D = window.ELN;
  const C = D.config;

  const WG = () => D.widget || { title: "Kale Widget'ı", text: '', steps: [] };
  const q = (s) => JSON.stringify(String(s || ''));

  function code() {
    const her = K.isOwner();
    return `// ${C.herName}'in Krallığı · Kale Widget'ı (Scriptable)
// Küçük, orta ve kilit ekranı boyutlarında çalışır. Dokununca kale açılır.
const KALE = ${q(K.roomUrl(''))};
const BIRLIKTE = ${q(C.togetherDate)};
const ONUN = ${q(her ? C.herPet : C.myPet)};
const BENIM = ${q(her ? C.myPet : C.herPet)};
const SEHIR = [[${q(C.herCity)}, ${Number(C.tzBaku)}, "🌊"], [${q(C.myCity)}, ${Number(C.tzIstanbul)}, "🌉"]];
const BAKU = ${Number(C.tzBaku)};

const now = new Date();
const [y, m, d] = BIRLIKTE.split("-").map(Number);
const gun = Math.floor((now.getTime() - (Date.UTC(y, m - 1, d) - BAKU * 36e5)) / 864e5);
// Bakü takvimine göre ayın bir sonraki özel günü
const b = new Date(now.getTime() + BAKU * 36e5);
const bugun = Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate());
let hedef = Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), d);
if (hedef < bugun) hedef = Date.UTC(b.getUTCFullYear(), b.getUTCMonth() + 1, d);
const kalan = Math.round((hedef - bugun) / 864e5);
const ayYazi = kalan === 0 ? "Bugün " + d + "'imiz ♡" : d + "'imize " + kalan + " gün";
// Şehrin gece yarısından beri geçen süre = şehrin saati (canlı sayaç)
const geceYarisi = (tz) => {
  const t = new Date(now.getTime() + tz * 36e5);
  return new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate()) - tz * 36e5);
};
const pembe = new Color("#E3174D"), koyu = new Color("#4A2138");

const w = new ListWidget();
w.url = KALE;
w.refreshAfterDate = new Date(Math.min(...SEHIR.map(([, tz]) => geceYarisi(tz).getTime() + 864e5)) + 6e4);
const fam = config.widgetFamily || "medium";

if (fam === "accessoryCircular") {
  w.addAccessoryWidgetBackground = true;
  const h = w.addText("♡"); h.font = Font.boldSystemFont(12); h.centerAlignText();
  const t = w.addText(String(gun)); t.font = Font.boldRoundedSystemFont(18); t.centerAlignText(); t.minimumScaleFactor = 0.5;
} else if (fam === "accessoryRectangular" || fam === "accessoryInline") {
  const t = w.addText("♡ " + gun + " gün · " + ONUN); t.font = Font.boldSystemFont(14);
  if (fam === "accessoryRectangular") {
    const s = w.addText(ayYazi); s.font = Font.systemFont(12);
    const r = w.addStack(); r.spacing = 4;
    SEHIR.forEach(([ad, tz]) => { const l = r.addText(ad.slice(0, 3)); l.font = Font.systemFont(11); const c = r.addDate(geceYarisi(tz)); c.applyTimerStyle(); c.font = Font.regularMonospacedSystemFont(11); });
  }
} else {
  const g = new LinearGradient();
  g.colors = [new Color("#FFE3EE"), new Color("#FFB3CE")];
  g.locations = [0, 1];
  w.backgroundGradient = g;
  w.setPadding(14, 14, 12, 14);
  const ust = w.addText("🏰 " + ONUN + " · " + BENIM); ust.font = Font.semiboldRoundedSystemFont(12); ust.textColor = koyu; ust.lineLimit = 1;
  w.addSpacer(4);
  const say = w.addText(String(gun)); say.font = Font.heavyRoundedSystemFont(fam === "small" ? 38 : 44); say.textColor = pembe; say.minimumScaleFactor = 0.6;
  const alt = w.addText("gündür birlikte"); alt.font = Font.mediumRoundedSystemFont(12); alt.textColor = koyu;
  w.addSpacer();
  const ay = w.addText("💗 " + ayYazi); ay.font = Font.mediumRoundedSystemFont(11); ay.textColor = koyu;
  if (fam !== "small") {
    w.addSpacer(4);
    const r = w.addStack(); r.centerAlignContent(); r.spacing = 10;
    SEHIR.forEach(([ad, tz, e]) => {
      const s = r.addStack(); s.spacing = 3;
      const l = s.addText(e + " " + ad); l.font = Font.systemFont(11); l.textColor = koyu;
      const c = s.addDate(geceYarisi(tz)); c.applyTimerStyle(); c.font = Font.semiboldMonospacedSystemFont(11); c.textColor = pembe;
    });
  }
}
Script.setWidget(w);
if (!config.runsInWidget) await w.presentMedium();
Script.complete();
`;
  }

  function open() {
    K.kalp && K.kalp.closeMenu && K.kalp.closeMenu();
    const m = K.ui.modal({
      label: WG().title,
      cls: 'ky-sheet wg-sheet',
      html: `<div class="wg-demo" aria-hidden="true"><div class="wg-phone"><div class="wg-w"><small>🏰 ${K.esc(K.otherName())}</small><b>${K.num(K.time.daysSince(C.togetherDate))}</b><span>gündür birlikte</span></div><div class="wg-apps">${'<i></i>'.repeat(8)}</div></div></div>
        <h2>${K.esc(WG().title)}</h2><p class="muted">${K.esc(K.fill(WG().text || ''))}</p>
        <ol class="ky-steps">${(WG().steps || []).map((s, i) => `<li><b>${i + 1}</b><p>${K.esc(K.fill(s))}</p></li>`).join('')}</ol>
        <div class="wg-code"><pre><code>${K.esc(code())}</code></pre></div>
        <div class="row"><button type="button" class="btn red" data-wg-copy>${A.ui('copy')} Kodu kopyala</button><a class="btn ghost small" href="https://apps.apple.com/app/scriptable/id1405459188" target="_blank" rel="noopener">Scriptable'ı aç</a></div>
        <p class="muted small">Kodda kalenin adresi ve ikinizin isimleri var; başka bir şey yok. Kimseyle paylaşma.</p>`,
    });
    m.body.addEventListener('click', async (e) => {
      if (!e.target.closest('[data-wg-copy]')) return;
      const ok = await K.copy(code());
      K.fx.toast(ok ? '📋 Kod kopyalandı. Scriptable\'a yapıştır.' : 'Kopyalanamadı; kodu elle seç.', { duration: 2400 });
      ok && K.stickers.award('widget');
    });
  }
  K.widget = { open, code };
})();
