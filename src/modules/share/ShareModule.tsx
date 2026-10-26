import { useMemo, useRef, useState } from 'react';
import { navigate, shareUrl } from '@/core/router';
import { useDesign } from '@/core/store/designStore';
import { useArchive } from '@/core/store/archiveStore';
import { useView } from '@/core/store/viewStore';
import { MAX_SHARE_LENGTH, encodeDesign, sanitizeDesign } from '@/core/model/sanitize';
import { worldApi } from '@/world/worldApi';
import { Badge, Icon, Note, Section, dataUrlToBlob, downloadFile } from '@/ui/primitives';
import { designSummary, preferenceRows } from './summary';

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export default function ShareModule() {
  const design = useDesign((s) => s.design);
  const setDesign = useDesign((s) => s.setDesign);
  const save = useArchive((s) => s.save);
  const toast = useView((s) => s.toast);
  const view2D = useView((s) => s.view2D);
  const [image, setImage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const link = useMemo(() => shareUrl('design', { d: encodeDesign(design) }), [design]);
  const summary = useMemo(() => designSummary(design, link), [design, link]);
  const rows = useMemo(() => preferenceRows(design), [design]);
  const encodedLen = link.split('d=')[1]?.length ?? 0;

  const makeImage = async () => {
    setBusy(true);
    const url = await worldApi.capture({ width: 1920, height: 1080, mime: 'image/png' });
    setBusy(false);
    if (url) setImage(url);
    else toast('Görsel oluşturulamadı. 3D görünümün açık olduğundan emin olun.', 'error');
  };

  const onImport = async (f: File) => {
    try {
      if (f.size > 200_000) throw new Error('Dosya çok büyük');
      const raw = JSON.parse(await f.text()) as unknown;
      const { config, warnings } = sanitizeDesign((raw as { config?: unknown })?.config ?? raw);
      save('İçe aktarma öncesi yedek', design, null);
      setDesign(config, 'Konfigürasyon içe aktarıldı');
      toast(`Konfigürasyon yüklendi${warnings.length ? ` (${warnings.length} geçersiz alan varsayılana döndü)` : ''}. Önceki tasarım arşivde.`, warnings.length ? 'warning' : 'success');
    } catch (e) {
      toast(`İçe aktarılamadı: ${(e as Error).message}`, 'error');
    }
  };

  return (
    <div>
      <Section title="Paylaşılabilir bağlantı" kicker="Collaborative Design" badges={<Badge kind="concept">Bağlantıda konfigürasyon taşınır</Badge>}>
        <div className="flex gap-2">
          <input className="input !text-[11.5px]" readOnly value={link} aria-label="Paylaşım bağlantısı" onFocus={(e) => e.target.select()} />
          <button type="button" className="btn shrink-0" onClick={async () => toast((await copy(link)) ? 'Bağlantı kopyalandı.' : 'Kopyalanamadı; bağlantıyı elle seçin.', 'success')}>
            <Icon name="Copy" size={15} /> Kopyala
          </button>
        </div>
        <p className="text-[11.5px] muted mt-1.5">
          Bağlantı açıldığında tasarım doğrulanır ve kullanıcıdan onay alınarak yüklenir. Sunucuya veri gönderilmez ({encodedLen} / {MAX_SHARE_LENGTH} karakter).
        </p>
      </Section>

      <Section title="Dışa ve içe aktarma">
        <div className="flex flex-wrap gap-1.5">
          <button type="button" className="btn btn-sm" onClick={() => downloadFile('aslan2035-tasarim.json', JSON.stringify({ app: 'ASLAN 2035 OMEGA', exportedAt: new Date().toISOString(), config: design }, null, 2), 'application/json')}>
            <Icon name="Download" size={14} /> Konfigürasyon (.json)
          </button>
          <button type="button" className="btn btn-sm" onClick={() => downloadFile('aslan2035-ozet.md', summary, 'text/markdown')}>
            <Icon name="FileText" size={14} /> Tasarım özeti (.md)
          </button>
          <button type="button" className="btn btn-sm" onClick={async () => toast((await copy(summary)) ? 'Özet panoya kopyalandı.' : 'Kopyalanamadı.', 'success')}>
            <Icon name="Copy" size={14} /> Özeti kopyala
          </button>
          <button type="button" className="btn btn-sm" onClick={() => fileRef.current?.click()}>
            <Icon name="Upload" size={14} /> JSON içe aktar
          </button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" aria-label="Konfigürasyon dosyası seç" onChange={(e) => e.target.files?.[0] && void onImport(e.target.files[0])} />
        </div>
      </Section>

      <Section title="Tasarım görseli">
        <button type="button" className="btn btn-primary" onClick={makeImage} disabled={busy || view2D}>
          <Icon name="Camera" size={15} /> {busy ? 'Oluşturuluyor…' : 'Mevcut görünümden 1920×1080 görsel oluştur'}
        </button>
        {view2D && <p className="text-[11.5px] muted mt-1">Görsel oluşturmak için 3D görünüme geçin.</p>}
        {image && (
          <figure className="m-0 mt-2">
            <img src={image} alt="Mevcut tasarımın 3D konsept görseli" className="rounded-lg border border-line w-full" />
            <figcaption className="flex justify-between items-center mt-1.5">
              <span className="text-[11px] muted">Konsept görselleştirme — ölçülmüş model değildir.</span>
              <button type="button" className="btn btn-sm" onClick={() => downloadFile('aslan2035-gorsel.png', dataUrlToBlob(image))}>
                <Icon name="Download" size={14} /> PNG indir
              </button>
            </figcaption>
          </figure>
        )}
      </Section>

      <Section title="Tasarım tercihleri" kicker={`${rows.length} parametre`}>
        <div className="max-h-72 scroll-y">
          <table className="tbl">
            <tbody>
              {rows.map((r) => (
                <tr key={r.key}>
                  <th scope="row" className="!font-normal">
                    {r.label}
                  </th>
                  <td>{r.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button type="button" className="btn btn-sm mt-2" onClick={() => navigate('archive')}>
          Alternatifleri karşılaştır (Design Archive) <Icon name="ArrowRight" size={14} />
        </button>
      </Section>

      <Note>Gerçek zamanlı çok kullanıcılı ortak düzenleme bu sürümde yoktur; sunucu ve senkronizasyon altyapısı gerektirir. Paylaşım, bağlantı veya dosya üzerinden konfigürasyon aktarımıyla sınırlıdır.</Note>
    </div>
  );
}
