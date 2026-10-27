import { useCallback, useEffect, useRef, useState } from 'react';
import { useView, type EnvMode, type SectionMode } from '@/core/store/viewStore';
import { useDesign } from '@/core/store/designStore';
import { applyPatch } from '@/core/model/design';
import { SHOW_BY_ID } from '@/core/model/lightshow';
import { worldApi, type CaptureOptions } from '@/world/worldApi';
import { Badge, Icon, Note, Section, dataUrlToBlob, downloadFile } from '@/ui/primitives';

interface Shot {
  id: string;
  title: string;
  caption: string;
  opts: CaptureOptions;
  env?: EnvMode;
  section?: SectionMode;
  show?: boolean;
}

const SHOTS: Shot[] = [
  { id: 'night', title: 'Gece silueti', caption: 'Çatı halkası ve cephe ışığıyla genel görünüm.', opts: { pose: { pos: [320, 140, 350], target: [0, 18, 0] } } },
  { id: 'dusk', title: 'Alacakaranlık', caption: 'Kütle, cephe ritmi ve çatı geometrisi.', opts: { pose: { pos: [-280, 90, 260], target: [0, 20, 0] } }, env: 'dusk' },
  { id: 'entrance', title: 'Ana giriş', caption: 'Kanopili giriş ve cephe kanatları.', opts: { pose: { pos: [40, 8, 175], target: [0, 14, 96] } } },
  { id: 'bowl', title: 'Kase', caption: 'Alt tribünden sahaya bakış.', opts: { pose: { pos: [30, 14, 52], target: [0, 1, 0], fov: 55 } } },
  { id: 'roof', title: 'Çatı ve ışık', caption: 'Sahadan çatı halkasına bakış.', opts: { pose: { pos: [-18, 2.2, 14], target: [30, 44, -52], fov: 60 } } },
  { id: 'show', title: 'Golden Halo', caption: 'Işık gösterisi önizlemesi (simülasyon).', opts: { pose: { pos: [170, 80, 230], target: [0, 25, 0] } }, show: true },
  { id: 'city', title: 'Stadium City', caption: 'Meydan, müze ve sosyal alanlar — şematik.', opts: { pose: { pos: [-40, 330, 420], target: [0, 0, 80] } }, env: 'day' },
  { id: 'section', title: 'Kavramsal kesit', caption: 'Mühendislik çizimi değildir.', opts: { pose: { pos: [20, 60, -300], target: [0, 20, 0] } }, env: 'day', section: 'long' },
];

export default function GalleryModule() {
  const design = useDesign((s) => s.design);
  const set = useView((s) => s.set);
  const view2D = useView((s) => s.view2D);
  const [images, setImages] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(0);
  const [open, setOpen] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const ready = SHOTS.filter((s) => images[s.id]);

  const generate = async () => {
    setBusy(true);
    const prev = useView.getState().env;
    const out: Record<string, string> = {};
    setDone(0);
    for (const s of SHOTS) {
      set({ env: s.env ?? 'night', section: s.section ?? 'off' });
      const preview = s.show ? applyPatch(design, { show: { ...SHOW_BY_ID['golden-halo'].look, active: true, preset: 'golden-halo' } }) : undefined;
      const url = await worldApi.capture({ ...s.opts, preview, width: 1280, height: 720 });
      if (url) out[s.id] = url;
      setDone((n) => n + 1);
    }
    set({ env: prev, section: 'off' });
    setImages(out);
    setBusy(false);
  };

  const close = useCallback(() => setOpen(null), []);
  useEffect(() => {
    if (open === null) return;
    dialogRef.current?.querySelector<HTMLButtonElement>('[data-autofocus]')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') setOpen((i) => (i === null ? i : (i + 1) % ready.length));
      if (e.key === 'ArrowLeft') setOpen((i) => (i === null ? i : (i - 1 + ready.length) % ready.length));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close, ready.length]);

  const current = open !== null ? ready[open] : null;
  return (
    <div>
      <Section title="Konsept görsel galerisi" kicker="Gallery" badges={<Badge kind="concept">Önerilen tasarım görselleri</Badge>}>
        <p className="text-[12.5px] muted mb-2.5">Görseller mevcut tasarımınızdan, aynı 3D model üzerinde sabit bakış noktalarıyla oluşturulur.</p>
        <button type="button" className="btn btn-primary w-full" onClick={generate} disabled={busy || view2D}>
          <Icon name="Camera" size={15} /> {busy ? `Görseller oluşturuluyor… ${done}/${SHOTS.length}` : ready.length ? 'Galeriyi yenile' : 'Galeriyi oluştur'}
        </button>
        {view2D && <p className="text-[11.5px] muted mt-1">Galeri 3D görünüm gerektirir.</p>}
      </Section>

      {ready.length > 0 && (
        <ul className="grid grid-cols-2 gap-2 mb-5">
          {ready.map((s, i) => (
            <li key={s.id}>
              <button type="button" className="block w-full text-left group" onClick={() => setOpen(i)} aria-label={`${s.title} görselini büyüt`}>
                <img src={images[s.id]} alt="" className="rounded-lg border border-line w-full aspect-video object-cover group-hover:border-gold" />
                <span className="text-[12px] font-semibold block mt-1">{s.title}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <Note>
        Gerçek stadyum fotoğrafları lisans gerektirdiği için bu galeriye eklenmemiştir; mevcut yapının fotoğrafları için{' '}
        <a className="underline" href="https://en.wikipedia.org/wiki/Rams_Park" target="_blank" rel="noopener noreferrer">
          Wikipedia sayfasına
        </a>{' '}
        bakabilirsiniz. Buradaki tüm görseller önerilen konsept tasarımlardır.
      </Note>

      {current && (
        <div ref={dialogRef} role="dialog" aria-modal="true" aria-label={`Galeri: ${current.title}`} className="fixed inset-0 z-[90] bg-ink/95 flex flex-col items-center justify-center p-4" onClick={close}>
          <figure className="m-0 max-w-[1200px] w-full" onClick={(e) => e.stopPropagation()}>
            <img src={images[current.id]} alt={`${current.title}: ${current.caption}`} className="w-full rounded-xl border border-line" />
            <figcaption className="flex flex-wrap items-center gap-2 mt-3">
              <span className="display text-lg font-semibold">{current.title}</span>
              <Badge kind={current.show ? 'sim' : 'concept'} />
              <span className="muted text-[13px]">{current.caption}</span>
              <span className="flex-1" />
              <button type="button" className="btn btn-sm" onClick={() => setOpen(((open ?? 0) - 1 + ready.length) % ready.length)} aria-label="Önceki görsel">
                <Icon name="ChevronLeft" size={15} />
              </button>
              <button type="button" className="btn btn-sm" onClick={() => setOpen(((open ?? 0) + 1) % ready.length)} aria-label="Sonraki görsel">
                <Icon name="ChevronRight" size={15} />
              </button>
              <button type="button" className="btn btn-sm" onClick={() => downloadFile(`aslan2035-${current.id}.jpg`, dataUrlToBlob(images[current.id]))}>
                <Icon name="Download" size={14} /> İndir
              </button>
              <button type="button" className="btn btn-sm btn-primary" data-autofocus onClick={close}>
                <Icon name="X" size={14} /> Kapat
              </button>
            </figcaption>
          </figure>
        </div>
      )}
    </div>
  );
}
