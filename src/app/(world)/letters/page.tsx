import type { Metadata } from "next";
import Link from "next/link";
import { OwnerHint } from "@/components/layout/owner-hint";
import { PageHeader } from "@/components/layout/page-header";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { EmptyState } from "@/components/ui/empty-state";
import { Envelope } from "@/features/letters/components/envelope";
import { EnvelopeCard, SealedEnvelopeCard } from "@/features/letters/components/envelope-card";
import { listLetters } from "@/features/letters/queries";
import { LETTER_CATEGORIES } from "@/features/letters/schema";
import { getMembers } from "@/lib/auth/members";
import { people, requireMember } from "@/lib/auth/session";
import { daysBetween, formatDate, todayIn } from "@/lib/dates";

export const metadata: Metadata = { title: "Mektuplar" };

export default async function LettersPage() {
  const session = await requireMember();
  const [{ open, sealed }, members] = await Promise.all([listLetters(session), getMembers(session)]);
  const { owner, partner, me } = people(session);
  const ownerId = members.find((m) => m.role === "owner")?.userId;
  const today = todayIn(me.timezone, new Date());

  const fromOwner = open.filter((letter) => letter.authorId === ownerId);
  const fromPartner = open.filter((letter) => letter.authorId !== ownerId);
  const shelves = LETTER_CATEGORIES.map((category) => ({
    ...category,
    letters: fromOwner.filter((letter) => letter.category === category.value),
  })).filter((shelf) => shelf.letters.length > 0);

  const nothing = open.length === 0 && sealed.length === 0;

  return (
    <>
      <PageHeader
        eyebrow="Letters"
        title="Mektuplar"
        lead={nothing ? undefined : "Her zarfın içinde bir mektup var. Açmak için birine dokunman yeterli."}
      />

      <div className="shell space-y-24 pb-8">
        {nothing ? (
          <EmptyState
            art={<div className="w-40"><Envelope styleName="blush" seal="heart" /></div>}
            title="Henüz bir mektup yok"
          >
            {session.role === "owner" ? "İlk mektubunu yazdığında burada bir zarf belirecek." : "Yazıldığında burada bir zarf belirecek."}
          </EmptyState>
        ) : null}

        {session.role === "owner" && fromOwner.length === 0 ? (
          <OwnerHint href="/studio/letters/new" label="Mektup yaz">
            Eln&apos;e yazdığın mektuplar burada raflara dizilir.
          </OwnerHint>
        ) : null}

        {sealed.length > 0 ? (
          <section aria-labelledby="sealed-heading">
            <Reveal>
              <p className="eyebrow">Sealed</p>
              <h2 id="sealed-heading" className="mt-3 font-display text-display-sm italic">
                Günü gelince
              </h2>
            </Reveal>
            <Stagger className="mt-10 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
              {sealed.map((letter) => {
                const opens = todayIn(me.timezone, new Date(letter.unlockAt));
                return (
                  <StaggerItem key={letter.id}>
                    <SealedEnvelopeCard
                      title={letter.title}
                      envelopeStyle={letter.envelopeStyle}
                      seal={letter.seal}
                      opensOn={formatDate(opens)}
                      daysLeft={daysBetween(today, opens)}
                    />
                  </StaggerItem>
                );
              })}
            </Stagger>
          </section>
        ) : null}

        {shelves.map((shelf) => (
          <section key={shelf.value} aria-labelledby={`shelf-${shelf.value}`}>
            <Reveal>
              <p className="eyebrow">
                {owner.name} → {partner.name}
              </p>
              <h2 id={`shelf-${shelf.value}`} className="mt-3 font-display text-display-sm italic">
                {shelf.label}
              </h2>
            </Reveal>
            <Stagger className="mt-10 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
              {shelf.letters.map((letter) => (
                <StaggerItem key={letter.id}>
                  <EnvelopeCard
                    href={`/letters/${letter.id}`}
                    title={letter.title}
                    writtenOn={letter.writtenOn}
                    envelopeStyle={letter.envelopeStyle}
                    seal={letter.seal}
                  />
                </StaggerItem>
              ))}
            </Stagger>
          </section>
        ))}

        {fromPartner.length > 0 ? (
          <section aria-labelledby="from-partner">
            <Reveal>
              <p className="eyebrow">
                {partner.name} → {owner.name}
              </p>
              <h2 id="from-partner" className="mt-3 font-display text-display-sm italic">
                {partner.name}&apos;den
              </h2>
            </Reveal>
            <Stagger className="mt-10 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
              {fromPartner.map((letter) => (
                <StaggerItem key={letter.id}>
                  <EnvelopeCard
                    href={`/letters/${letter.id}`}
                    title={letter.title}
                    writtenOn={letter.writtenOn}
                    envelopeStyle={letter.envelopeStyle}
                    seal={letter.seal}
                  />
                </StaggerItem>
              ))}
            </Stagger>
          </section>
        ) : null}

        {session.role === "partner" ? (
          <p className="text-center text-sm text-muted">
            İstersen sen de bir mektup bırakabilirsin.{" "}
            <Link href="/letters/write" className="text-accent underline-offset-4 hover:underline">
              Bir mektup yaz
            </Link>
          </p>
        ) : null}
      </div>
    </>
  );
}
