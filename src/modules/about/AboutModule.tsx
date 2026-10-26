import { ASSUMPTIONS, FACTS, SOURCES } from '@/content/facts';
import { Badge, Section } from '@/ui/primitives';

export default function AboutModule() {
  const src = Object.fromEntries(SOURCES.map((s) => [s.id, s]));
  return (
    <div>
      <Section title="Mevcut yapı hakkında doğrulanmış bilgiler" kicker="RAMS Park" badges={<Badge kind="verified" />}>
        <dl className="flex flex-col gap-2.5">
          {FACTS.map((f) => (
            <div key={f.label} className="card card-tight">
              <dt className="field-label mb-0.5">{f.label}</dt>
              <dd className="text-[13.5px] font-medium">{f.value}</dd>
              {f.note && <dd className="text-[12px] muted mt-1 leading-snug">{f.note}</dd>}
              <dd className="text-[11px] mt-1.5 text-faint">
                Kaynak:{' '}
                {f.sources.map((id, i) => (
                  <span key={id}>
                    {i > 0 && ', '}
                    <a className="underline hover:text-text" href={src[id].url} target="_blank" rel="noopener noreferrer">
                      {src[id].publisher}
                    </a>
                  </span>
                ))}
              </dd>
            </div>
          ))}
        </dl>
      </Section>
      <Section title="Varsayımlar ve sınırlar" kicker="Konsept ile gerçeğin ayrımı">
        <ul className="list-dots">
          {ASSUMPTIONS.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
      </Section>
      <Section title="Etiket sistemi">
        <div className="flex flex-col gap-2 text-[12.5px]">
          <div className="flex gap-2 items-center">
            <Badge kind="verified" /> Kaynağı belirtilmiş mevcut durum bilgisi
          </div>
          <div className="flex gap-2 items-center">
            <Badge kind="concept" /> Önerilen tasarım
          </div>
          <div className="flex gap-2 items-center">
            <Badge kind="sim" /> Örnek / simüle veri
          </div>
          <div className="flex gap-2 items-center flex-wrap">
            <Badge kind="eng" /> Yapısal veya teknik doğrulama gerektiren öneri
          </div>
        </div>
      </Section>
      <Section title="Kaynak listesi">
        <ul className="list-dots">
          {SOURCES.map((s) => (
            <li key={s.id}>
              <a className="underline" href={s.url} target="_blank" rel="noopener noreferrer">
                {s.title}
              </a>{' '}
              — {s.publisher}
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}
