import type { Metadata } from "next";
import { WRITTEN_DAYS, WRITTEN_LETTERS, WRITTEN_MEMORIES, WRITTEN_NOTES } from "@/content/writing";
import { categoryLabel } from "@/features/letters/schema";
import { NOTE_CATEGORIES } from "@/features/reasons/schema";
import { AddWords } from "@/features/words/components/words-panel";
import { getWordsStatus } from "@/features/words/queries";
import { requireOwner } from "@/lib/auth/session";
import { StudioCard, StudioPage } from "../studio-page";

export const metadata: Metadata = { title: "Hazır metinler" };

const PREVIEW = "prose-letter font-display text-[17px] leading-[1.75] text-ink-soft";

export default async function StudioWordsPage() {
  const session = await requireOwner();
  const status = await getWordsStatus(session);

  return (
    <StudioPage
      title="Hazır metinler"
      description="Senin için, senin sesinden yazılmış metinler. Hepsi yalnızca hislerden ve kesin bilgilerden söz eder; hiçbir olay ya da anı uydurulmadı. Mektuplar ve notlar taslak olarak eklenir: sen okuyup yayımlamadan Eln hiçbirini görmez."
    >
      <div className="space-y-6">
        <StudioCard>
          <p className="text-[15px] leading-relaxed text-muted">
            Bunlar bir başlangıç. Sana benzemeyen bir cümle görürsen değiştir ya da sil; yalnızca senin bildiğin anıları, günleri ve
            ayrıntıları eklediğinde gerçekten senin olurlar. Açılış mektubu ve sayfa girişleri gibi kısa metinler zaten yerinde;
            onları <strong className="font-medium text-ink">Açılış</strong> ve <strong className="font-medium text-ink">Metinler</strong>{" "}
            bölümlerinden düzenleyebilirsin.
          </p>
        </StudioCard>

        <StudioCard title={`Mektuplar · ${status.letters.added} / ${status.letters.total} eklendi`}>
          <p className="text-[15px] leading-relaxed text-muted">
            Sekiz zarf, sekiz ayrı raf için. Taslak olarak gelir; her birini açıp okuyabilir, zarfını ve mührünü değiştirebilir, hazır
            olduğunda yayımlayabilirsin.
          </p>
          <ul className="mt-5 divide-y divide-line border-y border-line">
            {WRITTEN_LETTERS.map((letter) => (
              <li key={letter.title}>
                <details className="group py-3">
                  <summary className="flex cursor-pointer list-none items-baseline justify-between gap-4 [&::-webkit-details-marker]:hidden">
                    <span className="font-display text-xl text-ink group-open:text-accent">{letter.title}</span>
                    <span className="shrink-0 text-[12px] text-taupe">{categoryLabel(letter.category)}</span>
                  </summary>
                  <p className={`${PREVIEW} mt-4`}>{letter.body}</p>
                  {letter.hint ? <p className="mt-4 rounded-xl bg-accent-wash px-4 py-3 text-[13px] leading-relaxed text-ink-soft">{letter.hint}</p> : null}
                </details>
              </li>
            ))}
          </ul>
          <AddWords
            kind="letters"
            label="Mektupları taslak olarak ekle"
            done={status.letters.added >= status.letters.total}
            href="/studio/letters"
            hrefLabel="Mektuplara git"
          />
        </StudioCard>

        <StudioCard title={`365 Not · ${status.notes.added} / ${status.notes.total} eklendi`}>
          <p className="text-[15px] leading-relaxed text-muted">
            Bir yılın her gününe bir not. Yedi rafın her birinden sırayla gelirler, böylece art arda iki gün birbirine benzemez. Taslak
            olarak eklenir; 365 Not sayfasında hepsini gözden geçirip tek tek ya da topluca yayımlayabilirsin.
          </p>
          <div className="mt-5 grid gap-x-8 gap-y-5 sm:grid-cols-2">
            {NOTE_CATEGORIES.map((category) => {
              const lines = WRITTEN_NOTES.filter((note) => note.category === category.value);
              return (
                <details key={category.value} className="group border-t border-line pt-3">
                  <summary className="flex cursor-pointer list-none items-baseline justify-between gap-3 [&::-webkit-details-marker]:hidden">
                    <span className="text-[14px] font-medium text-ink group-open:text-accent">{category.label}</span>
                    <span className="text-[12px] text-taupe tabular-nums">{lines.length} not</span>
                  </summary>
                  <ol className="mt-3 max-h-72 space-y-2 overflow-y-auto pr-2">
                    {lines.map((note) => (
                      <li key={note.body} className="font-display text-[16px] leading-snug text-ink-soft">
                        {note.body}
                      </li>
                    ))}
                  </ol>
                </details>
              );
            })}
          </div>
          <AddWords kind="notes" label="Notları taslak olarak ekle" done={status.notes.added >= status.notes.total} href="/studio/reasons" hrefLabel="365 Not'a git" />
        </StudioCard>

        <StudioCard title="Dönüm noktaları ve özel günler">
          <p className="text-[15px] leading-relaxed text-muted">
            Tanıştığınız ve sevgili olduğunuz günün anı sayfaları ile dört özel günün girişleri. Yalnızca <em>boş olan</em> sayfalar
            doldurulur; senin yazdığın hiçbir satıra dokunulmaz. Bu ikisi taslak değildir, doldurulduğu anda sitede görünür — o yüzden
            önce aşağıdan oku.
            {status.memories.empty + status.days.empty === 0 ? " Şu an doldurulacak boş sayfa yok." : ` Şu an ${status.memories.empty + status.days.empty} sayfa boş.`}
          </p>
          <div className="mt-5 space-y-5">
            {(Object.entries(WRITTEN_MEMORIES) as [string, (typeof WRITTEN_MEMORIES)["met"]][]).map(([key, words]) => (
              <details key={key} className="group border-t border-line pt-3">
                <summary className="cursor-pointer list-none font-display text-xl text-ink group-open:text-accent [&::-webkit-details-marker]:hidden">
                  {key === "met" ? "Tanıştığımız gün" : "Sevgili olduğumuz gün"}
                </summary>
                <p className="mt-3 text-[15px] text-muted">{words.summary}</p>
                <p className={`${PREVIEW} mt-3`}>{words.description}</p>
              </details>
            ))}
            <details className="group border-t border-line pt-3">
              <summary className="cursor-pointer list-none font-display text-xl text-ink group-open:text-accent [&::-webkit-details-marker]:hidden">
                Özel gün girişleri
              </summary>
              <dl className="mt-3 space-y-4">
                {Object.entries(WRITTEN_DAYS).map(([slug, words]) => (
                  <div key={slug}>
                    <dt className="text-[14px] font-medium text-ink">{words.subtitle}</dt>
                    <dd className="mt-1 font-display text-[17px] leading-relaxed text-ink-soft">{words.intro}</dd>
                  </div>
                ))}
              </dl>
            </details>
          </div>
          <AddWords
            kind="pages"
            label="Boş sayfaları doldur"
            done={status.memories.empty + status.days.empty === 0}
            href="/studio/story"
            hrefLabel="Hikâyeye git"
          />
        </StudioCard>
      </div>
    </StudioPage>
  );
}
