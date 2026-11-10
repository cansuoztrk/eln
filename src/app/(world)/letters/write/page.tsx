import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { LetterEditor } from "@/features/letters/components/letter-editor";
import { getLetter, listMyLetters } from "@/features/letters/queries";
import { people, requireMember } from "@/lib/auth/session";
import { formatDate, parseISODate, todayIn, toISODate } from "@/lib/dates";

export const metadata: Metadata = { title: "Mektup yaz" };

const OPEN_SHELF = [{ value: "open", label: "Mektup" }] as const;

/** A writing desk for either of them. Nothing here is ever asked for. */
export default async function WriteLetterPage({ searchParams }: PageProps<"/letters/write">) {
  const session = await requireMember();
  const { id } = await searchParams;
  const { me, other } = people(session);

  const [existing, mine] = await Promise.all([
    typeof id === "string" ? getLetter(session, id) : null,
    listMyLetters(session),
  ]);
  if (typeof id === "string" && (!existing || !existing.mine)) notFound();

  const unlockDay = existing?.unlockAt ? todayIn(other.timezone, new Date(existing.unlockAt)) : null;

  return (
    <>
      <PageHeader eyebrow="Write" title={existing ? "Mektubu düzenle" : "Bir mektup yaz"} />
      <div className="shell space-y-16">
        <LetterEditor
          key={existing?.id ?? "new"}
          authorName={me.name}
          recipientName={other.name}
          backHref="/letters/write"
          categories={OPEN_SHELF}
          initial={
            existing
              ? {
                  id: existing.id,
                  title: existing.title,
                  body: existing.body,
                  category: "open",
                  writtenOn: existing.writtenOn,
                  fontStyle: existing.fontStyle,
                  envelopeStyle: existing.envelopeStyle,
                  seal: existing.seal,
                  unlockOn: unlockDay ? toISODate(unlockDay) : "",
                  status: existing.status,
                }
              : {
                  title: "",
                  body: "",
                  category: "open",
                  writtenOn: toISODate(todayIn(me.timezone, new Date())),
                  fontStyle: "hand",
                  envelopeStyle: "ivory",
                  seal: "heart",
                  unlockOn: "",
                  status: "draft",
                }
          }
        />

        {mine.length > 0 ? (
          <section aria-labelledby="my-letters">
            <h2 id="my-letters" className="font-display text-3xl text-ink">
              Yazdıkların
            </h2>
            <ul className="mt-5 divide-y divide-line border-y border-line">
              {mine.map((letter) => {
                const date = parseISODate(letter.writtenOn);
                return (
                  <li key={letter.id}>
                    <Link
                      href={`/letters/write?id=${letter.id}`}
                      className="flex items-center justify-between gap-4 py-4 transition-colors hover:text-accent"
                    >
                      <span className="font-display text-xl text-ink">{letter.title}</span>
                      <span className="flex shrink-0 items-center gap-3 text-[13px] text-taupe">
                        {date ? formatDate(date) : null}
                        <Badge tone={letter.status === "published" ? "live" : "draft"}>
                          {letter.status === "published" ? "Yayında" : "Taslak"}
                        </Badge>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}
      </div>
    </>
  );
}
