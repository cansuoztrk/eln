import { Lock, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Envelope } from "@/features/letters/components/envelope";
import { listMyLetters } from "@/features/letters/queries";
import { categoryLabel } from "@/features/letters/schema";
import { people, requireOwner } from "@/lib/auth/session";
import { formatDate, parseISODate, todayIn } from "@/lib/dates";
import { StudioPage } from "../studio-page";

export const metadata: Metadata = { title: "Mektuplar" };

export default async function StudioLettersPage() {
  const session = await requireOwner();
  const letters = await listMyLetters(session);
  const { partner } = people(session);
  const now = new Date();

  return (
    <StudioPage
      title="Mektuplar"
      description={`${partner.name}'e yazdıkların. Taslaklar yalnızca sende durur; yayımladığın an zarf olarak görünür.`}
      actions={
        <Button asChild variant="accent">
          <Link href="/studio/letters/new">
            <Plus aria-hidden="true" />
            Yeni mektup
          </Link>
        </Button>
      }
    >
      {letters.length === 0 ? (
        <div className="paper">
          <EmptyState art={<div className="w-36"><Envelope styleName="blush" seal="heart" /></div>} title="İlk mektubunu yaz">
            Uzun olmak zorunda değil. Bazen tek bir dürüst cümle yeter.
          </EmptyState>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {letters.map((letter) => {
            const date = parseISODate(letter.writtenOn);
            const locked = letter.unlockAt && new Date(letter.unlockAt) > now;
            return (
              <li key={letter.id}>
                <Link
                  href={`/studio/letters/${letter.id}`}
                  className="paper flex h-full items-center gap-5 p-5 transition-[transform,box-shadow] duration-300 ease-soft hover:-translate-y-0.5 hover:shadow-lift"
                >
                  <div className="w-24 shrink-0">
                    <Envelope styleName={letter.envelopeStyle} seal={letter.seal} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-display text-2xl leading-tight text-ink">{letter.title}</p>
                    <p className="mt-1 truncate text-[13px] text-muted">
                      {categoryLabel(letter.category)}
                      {date ? ` · ${formatDate(date)}` : ""}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <Badge tone={letter.status === "published" ? "live" : "draft"}>
                        {letter.status === "published" ? "Yayında" : "Taslak"}
                      </Badge>
                      {locked && letter.unlockAt ? (
                        <Badge tone="sealed">
                          <Lock className="size-3" aria-hidden="true" />
                          {formatDate(todayIn(partner.timezone, new Date(letter.unlockAt)))}
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </StudioPage>
  );
}
