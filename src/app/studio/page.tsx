import { ArrowRight, Check, Circle } from "lucide-react";
import Link from "next/link";
import { getSection } from "@/features/content/queries";
import { getOverview } from "@/features/studio/queries";
import { people, requireOwner } from "@/lib/auth/session";
import { StudioCard, StudioPage } from "./studio-page";

export default async function StudioHome() {
  const session = await requireOwner();
  const [overview, opening, song] = await Promise.all([
    getOverview(session),
    getSection(session, "gift.opening"),
    getSection(session, "song"),
  ]);
  const { partner } = people(session);

  const steps = [
    { done: Boolean(opening.photoId), label: "Hediye fotoğrafını seç", hint: "Açılışta beliren tek fotoğraf.", href: "/studio/opening" },
    { done: overview.photos.published > 0, label: "Fotoğrafları yükle ve yayımla", hint: `${overview.photos.published} yayında · ${overview.photos.draft} taslak`, href: "/studio/photos" },
    { done: overview.letters.published > 0, label: "En az bir mektup yayımla", hint: `${overview.letters.published} yayında · ${overview.letters.draft} taslak`, href: "/studio/letters" },
    { done: overview.memories.published > 2, label: "Hikâyeye anılar ekle", hint: "İki dönüm noktası hazır; gerisini sen yazarsın.", href: "/studio/story" },
    { done: Boolean(song.youtubeUrl || song.spotifyUrl), label: "Şarkının bağlantısını ekle", hint: "Resmî YouTube ya da Spotify bağlantısı.", href: "/studio/texts" },
    { done: overview.partnerJoined, label: `${partner.name}'i davet et`, hint: overview.partnerJoined ? "Katıldı." : "Hazır olduğunda tek kullanımlık bağlantı oluştur.", href: "/studio/invite" },
  ];
  const remaining = steps.filter((s) => !s.done).length;

  return (
    <StudioPage
      title="Genel bakış"
      description={`Burası senin atölyen. ${partner.name}'in gördüğü her şey buradan geçer; taslaklar yalnızca sende kalır.`}
    >
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <StudioCard title={overview.partnerJoined ? "Durum" : "Davet öncesi"}>
          <p className="mb-5 text-sm text-muted">
            {remaining === 0 ? "Her şey hazır görünüyor." : `${remaining} adım kaldı. Sıra önemli değil; istediğinden başla.`}
          </p>
          <ol className="divide-y divide-line">
            {steps.map((step) => (
              <li key={step.label}>
                <Link href={step.href} className="group flex items-center gap-4 py-3.5">
                  <span
                    className={`grid size-7 shrink-0 place-items-center rounded-full ${step.done ? "bg-[#e3efe4] text-[#3f6b46]" : "border border-line-strong text-taupe"}`}
                  >
                    {step.done ? <Check className="size-4" aria-hidden="true" /> : <Circle className="size-2" aria-hidden="true" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block text-[15px] ${step.done ? "text-muted line-through decoration-line-strong" : "text-ink"}`}>
                      {step.label}
                    </span>
                    <span className="block text-[13px] text-muted">{step.hint}</span>
                  </span>
                  <span className="sr-only">{step.done ? "tamamlandı" : "bekliyor"}</span>
                  <ArrowRight className="size-4 text-taupe transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ol>
        </StudioCard>

        <div className="space-y-6">
          <StudioCard title="İçerik">
            <dl className="grid grid-cols-2 gap-5">
              {[
                ["Fotoğraf", overview.photos],
                ["Mektup", overview.letters],
                ["Anı", overview.memories],
                ["Özel gün baskısı", overview.editions],
              ].map(([label, value]) => {
                const counts = value as { published: number; draft: number };
                return (
                  <div key={label as string}>
                    <dt className="text-[13px] text-muted">{label as string}</dt>
                    <dd className="mt-1 font-display text-4xl leading-none text-ink tabular-nums">{counts.published}</dd>
                    <dd className="mt-1 text-[12px] text-taupe">{counts.draft} taslak</dd>
                  </div>
                );
              })}
            </dl>
          </StudioCard>

          {overview.sectionDrafts.length > 0 ? (
            <StudioCard title="Yayımlanmamış metinler">
              <p className="text-sm text-muted">
                {overview.sectionDrafts.length} bölümde kaydedip yayımlamadığın değişiklik var.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href="/studio/opening" className="text-sm text-accent underline-offset-4 hover:underline">
                  Açılış
                </Link>
                <Link href="/studio/texts" className="text-sm text-accent underline-offset-4 hover:underline">
                  Metinler
                </Link>
              </div>
            </StudioCard>
          ) : null}

          <StudioCard title="Gizlilik notu">
            <p className="text-sm leading-relaxed text-muted">
              Bu site {partner.name}&apos;in ne zaman girdiğini, neyi okuduğunu ya da kaç kez baktığını kaydetmez. Burada
              göreceğin her sayı yalnızca senin eklediğin içerikle ilgilidir.
            </p>
          </StudioCard>
        </div>
      </div>
    </StudioPage>
  );
}
