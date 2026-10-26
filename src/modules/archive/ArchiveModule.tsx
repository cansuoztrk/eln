import { useRef, useState } from 'react';
import { useDesign } from '@/core/store/designStore';
import { useArchive, type ArchiveEntry } from '@/core/store/archiveStore';
import { useView } from '@/core/store/viewStore';
import { diffDesigns } from '@/core/model/design';
import { DNA_LABEL, KEY_LABEL, prettyValue } from '@/core/model/labels';
import { worldApi } from '@/world/worldApi';
import { Badge, Icon, Note, Section, downloadFile } from '@/ui/primitives';

const SUGGESTED = ['Red Halo Concept', 'Green Stadium Concept', 'Future Roof', 'Classic Evolution', 'European Night'];

const fmt = (t: number) => new Date(t).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' });

export async function captureThumb(): Promise<string | null> {
  if (!worldApi.ready || useView.getState().view2D) return null;
  return worldApi.capture({ width: 320, height: 180, mime: 'image/jpeg', quality: 0.72 });
}

export default function ArchiveModule() {
  const design = useDesign((s) => s.design);
  const setDesign = useDesign((s) => s.setDesign);
  const past = useDesign((s) => s.past);
  const revertTo = useDesign((s) => s.revertTo);
  const { entries, error, save, addVersion, rename, remove, removeVersion, importEntries } = useArchive();
  const toast = useView((s) => s.toast);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [compare, setCompare] = useState<string[]>([]);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const doSave = async () => {
    setBusy(true);
    const thumb = await captureThumb();
    const entry = save(name || `${DNA_LABEL[design.dna]} — ${new Date().toLocaleDateString('tr-TR')}`, design, thumb);
    setBusy(false);
    setName('');
    toast(`“${entry.name}” arşive kaydedildi (yalnızca bu tarayıcıda).`, 'success');
  };

  const newVersion = async (e: ArchiveEntry) => {
    setBusy(true);
    addVersion(e.id, design, await captureThumb(), 'Yeni sürüm');
    setBusy(false);
    toast(`“${e.name}” için yeni sürüm kaydedildi.`, 'success');
  };

  const toggleCompare = (id: string) => setCompare((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c.slice(-1), id]));
  const cmp = compare.map((id) => entries.find((e) => e.id === id)).filter((e): e is ArchiveEntry => !!e);
  const diffs = cmp.length === 2 ? diffDesigns(cmp[0].versions[0].config, cmp[1].versions[0].config).filter((d) => !d.key.startsWith('show.sequence')) : [];

  const onImport = async (f: File) => {
    try {
      if (f.size > 2_000_000) throw new Error('Dosya çok büyük');
      const n = importEntries(JSON.parse(await f.text()));
      toast(`${n} tasarım içe aktarıldı (doğrulanarak).`, 'success');
    } catch (e) {
      toast(`İçe aktarılamadı: ${(e as Error).message}`, 'error');
    }
  };

  return (
    <div>
      <Section title="Mevcut tasarımı kaydet" kicker="Design Archive">
        <div className="flex gap-2">
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Tasarım adı" aria-label="Tasarım adı" maxLength={80} />
          <button type="button" className="btn btn-primary shrink-0" onClick={doSave} disabled={busy}>
            <Icon name="Save" size={15} /> Kaydet
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {SUGGESTED.map((s) => (
            <button key={s} type="button" className="chip !min-h-[26px] text-[11.5px]" onClick={() => setName(s)}>
              {s}
            </button>
          ))}
        </div>
        {error && (
          <div className="mt-2">
            <Note kind="warn">{error}</Note>
          </div>
        )}
      </Section>

      <Section
        title={`Kayıtlı tasarımlar (${entries.length})`}
        actions={
          <div className="flex gap-1">
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => downloadFile('aslan2035-arsiv.json', JSON.stringify(entries.map((e) => ({ name: e.name, config: e.versions[0].config })), null, 2), 'application/json')} disabled={!entries.length}>
              <Icon name="Download" size={14} /> Dışa aktar
            </button>
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => fileRef.current?.click()}>
              <Icon name="Upload" size={14} /> İçe aktar
            </button>
            <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => e.target.files?.[0] && void onImport(e.target.files[0])} aria-label="Arşiv JSON dosyası seç" />
          </div>
        }
      >
        {entries.length === 0 ? (
          <p className="text-[12.5px] muted">Henüz kayıt yok. Tasarımınızı adlandırıp kaydedin; burada tekrar açabilir ve karşılaştırabilirsiniz.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {entries.map((e) => (
              <li key={e.id} className="card card-tight">
                <div className="flex gap-2.5">
                  {e.versions[0].thumb ? <img src={e.versions[0].thumb} alt="" className="w-24 h-[54px] object-cover rounded-md border border-line shrink-0" /> : <div className="w-24 h-[54px] rounded-md bg-surface-3 shrink-0" />}
                  <div className="min-w-0 flex-1">
                    <input className="bg-transparent text-[13.5px] font-semibold w-full focus:outline-none focus:border-b border-gold" defaultValue={e.name} onBlur={(ev) => rename(e.id, ev.target.value)} aria-label="Tasarım adını düzenle" />
                    <div className="text-[11px] muted">
                      {fmt(e.updatedAt)} · {e.versions.length} sürüm · {DNA_LABEL[e.versions[0].config.dna]}
                    </div>
                    <label className="text-[11px] flex items-center gap-1 mt-1 cursor-pointer">
                      <input type="checkbox" checked={compare.includes(e.id)} onChange={() => toggleCompare(e.id)} /> Karşılaştırmaya ekle
                    </label>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  <button type="button" className="btn btn-sm" onClick={() => (setDesign(e.versions[0].config, `Arşivden açıldı: ${e.name}`), toast(`“${e.name}” açıldı.`, 'success'))}>
                    <Icon name="RotateCcw" size={13} /> Aç
                  </button>
                  <button type="button" className="btn btn-sm" onClick={() => void newVersion(e)} disabled={busy}>
                    <Icon name="Plus" size={13} /> Yeni sürüm
                  </button>
                  <button type="button" className="btn btn-sm btn-ghost" aria-expanded={open === e.id} onClick={() => setOpen(open === e.id ? null : e.id)}>
                    <Icon name="History" size={13} /> Sürümler
                  </button>
                  {confirmDel === e.id ? (
                    <>
                      <button type="button" className="btn btn-sm btn-primary" onClick={() => (remove(e.id), setConfirmDel(null))}>
                        Silmeyi onayla
                      </button>
                      <button type="button" className="btn btn-sm" onClick={() => setConfirmDel(null)}>
                        Vazgeç
                      </button>
                    </>
                  ) : (
                    <button type="button" className="btn btn-sm btn-ghost" onClick={() => setConfirmDel(e.id)} aria-label={`${e.name} kaydını sil`}>
                      <Icon name="Trash2" size={13} />
                    </button>
                  )}
                </div>
                {open === e.id && (
                  <ol className="mt-2 flex flex-col gap-1 border-t border-line pt-2">
                    {e.versions.map((v, i) => (
                      <li key={v.id} className="flex items-center gap-2 text-[12px]">
                        <span className="tabular-nums muted w-6">v{e.versions.length - i}</span>
                        <span className="flex-1">
                          {fmt(v.at)}
                          {v.note ? ` · ${v.note}` : ''}
                        </span>
                        <button type="button" className="btn btn-sm !min-h-[24px]" onClick={() => setDesign(v.config, `Arşiv sürümüne dönüldü: ${e.name} v${e.versions.length - i}`)}>
                          Dön
                        </button>
                        {e.versions.length > 1 && (
                          <button type="button" className="btn btn-icon btn-sm btn-ghost !min-h-[24px]" onClick={() => removeVersion(e.id, v.id)} aria-label="Sürümü sil">
                            <Icon name="X" size={12} />
                          </button>
                        )}
                      </li>
                    ))}
                  </ol>
                )}
              </li>
            ))}
          </ul>
        )}
      </Section>

      {cmp.length === 2 && (
        <Section title="Sürüm karşılaştırması" kicker={`${cmp[0].name} ↔ ${cmp[1].name}`}>
          <div className="grid grid-cols-2 gap-2 mb-2">
            {cmp.map((e) => (
              <figure key={e.id} className="m-0">
                {e.versions[0].thumb ? <img src={e.versions[0].thumb} alt={e.name} className="rounded-md border border-line w-full" /> : <div className="aspect-video rounded-md bg-surface-3" />}
                <figcaption className="text-[11.5px] mt-1 truncate">{e.name}</figcaption>
              </figure>
            ))}
          </div>
          {diffs.length === 0 ? (
            <p className="text-[12.5px] muted">İki tasarım aynı.</p>
          ) : (
            <table className="tbl">
              <thead>
                <tr>
                  <th scope="col">Parametre</th>
                  <th scope="col">{cmp[0].name}</th>
                  <th scope="col">{cmp[1].name}</th>
                </tr>
              </thead>
              <tbody>
                {diffs.slice(0, 30).map((d) => (
                  <tr key={d.key}>
                    <th scope="row" className="!font-normal">
                      {KEY_LABEL[d.key] ?? d.key}
                    </th>
                    <td>{prettyValue(d.key, d.from)}</td>
                    <td>{prettyValue(d.key, d.to)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>
      )}

      <Section title="Bu oturumun değişiklik geçmişi" kicker={`${past.length} adım`} badges={<Badge kind="concept">Geri alınabilir</Badge>}>
        {past.length === 0 ? (
          <p className="text-[12.5px] muted">Henüz değişiklik yapılmadı.</p>
        ) : (
          <ol className="flex flex-col gap-1 max-h-64 scroll-y">
            {[...past].reverse().map((h) => (
              <li key={h.id} className="flex items-center gap-2 text-[12px]">
                <span className="flex-1 truncate" title={h.label}>
                  {h.label}
                </span>
                <span className="muted tabular-nums text-[11px]">{new Date(h.at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                <button type="button" className="btn btn-sm !min-h-[24px]" onClick={() => revertTo(h.id)} title="Bu değişiklikten önceki duruma dön">
                  Öncesine dön
                </button>
              </li>
            ))}
          </ol>
        )}
      </Section>

      <Note>Kayıtlar yalnızca bu tarayıcının yerel depolamasında tutulur. Hesap veya sunucu senkronizasyonu yoktur; başka bir cihaza taşımak için “Dışa aktar” dosyasını kullanın. Mevcut tasarım ayrıca otomatik olarak yerel kaydedilir.</Note>
    </div>
  );
}
