import { useEffect, useMemo, useRef, useState } from 'react';
import { navigate } from '@/core/router';
import { useDesign } from '@/core/store/designStore';
import { useView } from '@/core/store/viewStore';
import { DNA_BY_ID } from '@/core/model/dna';
import { DNA_LABEL } from '@/core/model/labels';
import { evaluateRules } from '@/core/model/rules';
import { PHASES } from '@/core/model/phases';
import { ASSUMPTIONS, FACTS, SOURCES } from '@/content/facts';
import { worldApi, type CaptureOptions } from '@/world/worldApi';
import { Icon, downloadFile } from '@/ui/primitives';
import { ROADMAP } from '@/modules/roadmap/RoadmapModule';
import { QUESTIONS } from '@/modules/whatif/scenarios';
import { preferenceRows } from '@/modules/share/summary';
import { Needs3D } from '@/shell/Needs3D';

const SHOTS: { id: string; caption: string; opts: CaptureOptions; section?: 'long' }[] = [
  { id: 'aerial', caption: 'Genel görünüm (gece)', opts: { pose: { pos: [300, 150, 340], target: [0, 15, 0] } } },
  { id: 'entrance', caption: 'Ana giriş ve cephe', opts: { pose: { pos: [80, 24, 190], target: [0, 16, 90] } } },
  { id: 'bowl', caption: 'Kase — alt tribünden görünüm', opts: { pose: { pos: [30, 14, 52], target: [0, 1, 0], fov: 55 } } },
  { id: 'roof', caption: 'Çatı, ışık halkası ve taşıyıcı ritim', opts: { pose: { pos: [-18, 2.2, 14], target: [30, 44, -52], fov: 60 } } },
  { id: 'plaza', caption: 'Stadium City — kuşbakışı', opts: { pose: { pos: [-40, 330, 420], target: [0, 0, 80] } } },
  { id: 'section', caption: 'Kavramsal kesit (mühendislik çizimi değildir)', opts: { pose: { pos: [20, 60, -300], target: [0, 20, 0] } }, section: 'long' },
];

const INNOVATIONS = [
  'Tek dijital ikiz: bütün modüller aynı model ve tasarım durumunu kullanır.',
  'Stadium DNA: ışık, malzeme, ekran, peyzaj ve koreografiyi birleştiren tutarlı tasarım sistemi; çakışma kontrolü.',
  'Time Machine: kullanıcının tasarımından türetilen aşamalı dönüşüm.',
  'What-If Engine: aynı model üzerinde 2–3 senaryonun görsel ve parametrik karşılaştırması.',
  'Light Show Composer: fotosensitiviteye karşı sınırlandırılmış gösteri sekansları.',
  'Seat Experience 360: konsept profil üzerinden görüş karşılaştırması.',
  'Crowd Flow Simulator: kavramsal yoğunluk ve güzergâh stratejileri.',
  'Fan Journey Builder ve Stadium City: maç günü ekosistemi.',
];

export default function ReportView() {
  const design = useDesign((s) => s.design);
  const set = useView((s) => s.set);
  const view2D = useView((s) => s.view2D);
  const [images, setImages] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const docRef = useRef<HTMLDivElement>(null);
  const findings = useMemo(() => evaluateRules(design), [design]);
  const date = new Date().toLocaleDateString('tr-TR', { dateStyle: 'long' });

  useEffect(() => () => useView.getState().set({ section: 'off' }), []);

  const generate = async () => {
    setBusy(true);
    const out: Record<string, string> = {};
    for (const s of SHOTS) {
      set({ section: s.section ?? 'off' });
      const url = await worldApi.capture({ ...s.opts, width: 1200, height: 675, mime: 'image/jpeg', quality: 0.86 });
      if (url) out[s.id] = url;
    }
    set({ section: 'off' });
    setImages(out);
    setBusy(false);
  };

  const downloadHtml = () => {
    const body = docRef.current?.innerHTML ?? '';
    const html = `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ASLAN 2035 OMEGA — Proje raporu</title><style>
      body{font-family:Inter,system-ui,sans-serif;color:#111;background:#fff;max-width:900px;margin:0 auto;padding:32px;line-height:1.55}
      h1{font-size:40px;margin:0 0 4px} h2{font-size:22px;margin:32px 0 8px;border-bottom:2px solid #c8102e;padding-bottom:4px} h3{font-size:15px;margin:16px 0 4px}
      img{max-width:100%;border-radius:6px} figure{margin:0} figcaption{font-size:12px;color:#555} .grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
      table{border-collapse:collapse;width:100%;font-size:13px} td,th{border-bottom:1px solid #ddd;padding:6px;text-align:left;vertical-align:top}
      .tag{display:inline-block;font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;border:1px solid #999;border-radius:99px;padding:2px 8px;margin-right:4px}
      .no-export{display:none}
    </style></head><body>${body}</body></html>`;
    downloadFile('aslan2035-proje-raporu.html', html, 'text/html');
  };

  return (
    <div className="print-root fixed inset-0 z-40 bg-[#f4f2ee] text-[#16171b] scroll-y">
      <div className="no-print sticky top-0 z-10 bg-ink/95 text-text border-b border-line px-4 py-2.5 flex flex-wrap items-center gap-2">
        <Icon name="FileText" size={18} className="text-gold" />
        <span className="display font-semibold mr-auto">Proje raporu</span>
        <button type="button" className="btn btn-sm btn-gold" onClick={generate} disabled={busy || view2D}>
          <Icon name="Camera" size={14} /> {busy ? 'Görseller oluşturuluyor…' : Object.keys(images).length ? 'Görselleri yenile' : '3D görselleri oluştur'}
        </button>
        <button type="button" className="btn btn-sm" onClick={() => window.print()}>
          <Icon name="Printer" size={14} /> Yazdır / PDF
        </button>
        <button type="button" className="btn btn-sm" onClick={downloadHtml}>
          <Icon name="Download" size={14} /> HTML indir
        </button>
        <button type="button" className="btn btn-sm btn-ghost" onClick={() => navigate('home')}>
          <Icon name="X" size={14} /> Kapat
        </button>
        {view2D && (
          <div className="basis-full">
            <Needs3D what="Rapordaki 3D görseller" />
          </div>
        )}
      </div>
      <article ref={docRef} className="max-w-[900px] mx-auto px-6 md:px-10 py-10 report-doc">
        <header className="print-section">
          <div className="text-[12px] font-bold tracking-[0.16em] uppercase text-[#a50e27]">Konsept proje raporu · {date}</div>
          <h1 className="display text-[44px] md:text-[56px] font-bold leading-none mt-2">ASLAN 2035 OMEGA</h1>
          <p className="text-[20px] mt-2">The Next Evolution of RAMS PARK — Bir Efsaneyi İzleme. Geleceğini Tasarla.</p>
          <p className="text-[13px] text-[#555] mt-3 max-w-[680px]">
            Bu rapor bağımsız bir konsept çalışmasından üretilmiştir. Galatasaray SK veya ilgili kurumlarca onaylanmış resmî bir dönüşüm projesi değildir. Doğrulanmış bilgiler kaynaklarıyla, öneriler “konsept”, örnek veriler “simülasyon” olarak ayrılmıştır.
          </p>
        </header>

        <section className="print-section">
          <h2 className="report-h2">1. Proje özeti</h2>
          <p>
            Tasarım, <strong>{DNA_LABEL[design.dna]}</strong> DNA’sı üzerine kuruludur{design.dna !== 'custom' ? ` (${DNA_BY_ID[design.dna].tagline.toLocaleLowerCase('tr')})` : ''}. ASLAN 2035 OMEGA, stadyumu tek bir bina olarak değil; keşfedilebilir bir dijital dünya, tasarım motoru, simülasyon sistemi ve taraftar deneyimi platformundan oluşan bir ekosistem olarak ele alır.
          </p>
        </section>

        <section className="print-section">
          <h2 className="report-h2">2. Mevcut yapı — doğrulanmış bilgiler</h2>
          <table>
            <tbody>
              {FACTS.map((f) => (
                <tr key={f.label}>
                  <th scope="row">{f.label}</th>
                  <td>
                    {f.value}
                    {f.note && <div className="text-[12px] text-[#666]">{f.note}</div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="print-section">
          <h2 className="report-h2">3. Ana mimari fikirler ve tercihler</h2>
          <table>
            <tbody>
              {preferenceRows(design)
                .filter((r) => !r.key.startsWith('show.') || r.key === 'show.active')
                .map((r) => (
                  <tr key={r.key}>
                    <th scope="row">{r.label}</th>
                    <td>{r.value}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </section>

        <section className="print-break">
          <h2 className="report-h2">4. 3D konsept görselleri</h2>
          {Object.keys(images).length === 0 ? (
            <p className="text-[13px] text-[#666] no-export">Görseller henüz oluşturulmadı. Üstteki “3D görselleri oluştur” düğmesini kullanın (3D görünüm gerektirir).</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-3 grid">
              {SHOTS.filter((s) => images[s.id]).map((s) => (
                <figure key={s.id} className="m-0 print-section">
                  <img src={images[s.id]} alt={s.caption} className="rounded-md w-full" />
                  <figcaption className="text-[12px] text-[#555] mt-1">{s.caption} — konsept görselleştirme</figcaption>
                </figure>
              ))}
            </div>
          )}
        </section>

        <section className="print-section">
          <h2 className="report-h2">5. Yenilikler</h2>
          <ul className="list-disc pl-5">
            {INNOVATIONS.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </section>

        <section className="print-section">
          <h2 className="report-h2">6. Tasarım senaryoları</h2>
          <h3 className="font-semibold mt-2">What-If soruları</h3>
          <ul className="list-disc pl-5">
            {QUESTIONS.map((q) => (
              <li key={q.id}>
                {q.text} <span className="text-[#666]">({q.names.join(' / ')})</span>
              </li>
            ))}
          </ul>
          <h3 className="font-semibold mt-3">Zaman aşamaları</h3>
          <ol className="list-decimal pl-5">
            {PHASES.map((p) => (
              <li key={p.id}>
                <strong>{p.title}</strong> — {p.summary}
              </li>
            ))}
          </ol>
        </section>

        <section className="print-section">
          <h2 className="report-h2">7. Teknik riskler</h2>
          <ul className="list-disc pl-5">
            {findings.map((f) => (
              <li key={f.id}>
                <strong>{f.severity === 'engineering' ? 'Mühendislik' : f.severity === 'conflict' ? 'Çakışma' : 'Bilgi'}:</strong> {f.title}. {f.detail}
              </li>
            ))}
            {PHASES[4].risks.map((r) => (
              <li key={r}>{r}</li>
            ))}
            <li>Kalabalık akışı simülasyonu bir tahliye veya güvenlik hesabı değildir; yetkin uzman değerlendirmesi gerekir.</li>
          </ul>
        </section>

        <section className="print-section">
          <h2 className="report-h2">8. Uygulama yol haritası</h2>
          <table>
            <tbody>
              {ROADMAP.map((r) => (
                <tr key={r.id}>
                  <th scope="row">{r.id}</th>
                  <td>
                    <strong>{r.title}</strong> — {r.text}
                    <div className="text-[12px] text-[#666]">
                      {r.requires.length ? `Gerektirir: ${r.requires.join(', ')}` : 'Bağımsız başlayabilir'}
                      {r.benefitsFrom.length ? ` · Faydalanır: ${r.benefitsFrom.join(', ')}` : ''}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-[12.5px] text-[#555] mt-2">Gerçek uygulama sırası teknik raporlar, bütçe, işletme gereksinimleri ve resmî onaylar doğrultusunda belirlenir.</p>
        </section>

        <section className="print-section">
          <h2 className="report-h2">9. Kaynaklar ve varsayımlar</h2>
          <ul className="list-disc pl-5">
            {ASSUMPTIONS.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
          <h3 className="font-semibold mt-3">Kaynaklar</h3>
          <ul className="list-disc pl-5">
            {SOURCES.map((s) => (
              <li key={s.id}>
                {s.title} — {s.publisher}. <a href={s.url}>{s.url}</a>
              </li>
            ))}
          </ul>
        </section>
      </article>
    </div>
  );
}
