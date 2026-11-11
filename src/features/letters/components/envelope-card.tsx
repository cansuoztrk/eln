import { Lock } from "lucide-react";
import Link from "next/link";
import { formatDate, parseISODate } from "@/lib/dates";
import type { EnvelopeStyle, Seal } from "../schema";
import { Envelope } from "./envelope";

/** An envelope on the shelf. Tap it to open the letter. */
export function EnvelopeCard({
  href,
  title,
  writtenOn,
  envelopeStyle,
  seal,
  byline,
}: {
  href: string;
  title: string;
  writtenOn: string;
  envelopeStyle: EnvelopeStyle;
  seal: Seal;
  byline?: string;
}) {
  const date = parseISODate(writtenOn);
  return (
    <Link href={href} className="group block rounded-xl outline-offset-8">
      <div className="transition-transform duration-500 ease-soft group-hover:-translate-y-1.5">
        <Envelope styleName={envelopeStyle} seal={seal} interactive />
      </div>
      <div className="mt-5 text-center">
        <h3 className="font-display text-2xl leading-snug text-ink transition-colors group-hover:text-accent">{title}</h3>
        <p className="mt-1.5 text-[13px] text-taupe">
          {date ? formatDate(date) : null}
          {byline ? <span> · {byline}</span> : null}
        </p>
      </div>
    </Link>
  );
}

/** An envelope that is waiting for its day. It shows when — never what. */
export function SealedEnvelopeCard({
  title,
  envelopeStyle,
  seal,
  opensOn,
  daysLeft,
}: {
  title: string;
  envelopeStyle: EnvelopeStyle;
  seal: Seal;
  opensOn: string;
  daysLeft: number;
}) {
  return (
    <div>
      <div className="opacity-90 saturate-[0.85]">
        <Envelope styleName={envelopeStyle} seal={seal} sealed />
      </div>
      <div className="mt-5 text-center">
        <h3 className="font-display text-2xl leading-snug text-ink">{title}</h3>
        <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-plum/10 px-3 py-1 text-[12px] font-medium text-plum">
          <Lock className="size-3" aria-hidden="true" />
          {opensOn} · {daysLeft <= 0 ? "bugün açılıyor" : daysLeft === 1 ? "yarın açılıyor" : `${daysLeft} gün kaldı`}
        </p>
      </div>
    </div>
  );
}
