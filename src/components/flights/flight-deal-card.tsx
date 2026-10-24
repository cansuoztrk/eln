import Link from "next/link";
import { formatMoney } from "@/lib/money";
import { formatShortDate, formatWeekday } from "@/lib/time";
import { Icon } from "../icons";
import { Freshness } from "../price/freshness";
import { TestDataBadge } from "../ui/badge";

export type FlightDeal = {
  id: string;
  origin: string;
  destination: string;
  departAt: string;
  returnAt: string | null;
  priceMinor: number;
  currency: string;
  stops: number;
  checkedAt: string;
  priceKind: string;
  isTestData: boolean;
  oneWay: boolean;
};

export function FlightDealCard({ f }: { f: FlightDeal }) {
  const date = f.departAt.slice(0, 10);
  return (
    <Link href={`/ucak-bileti/rota/${f.origin}-${f.destination}`} className="card group flex items-center gap-4 p-4 transition-colors hover:border-line-strong">
      <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand-ink">
        <Icon name="plane" className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2 font-mono text-[15px] font-semibold tracking-wide">
          {f.origin}
          <Icon name="arrowRight" className="size-3.5 text-ink-3" />
          {f.destination}
          {f.isTestData ? <TestDataBadge /> : null}
        </span>
        <span className="mt-0.5 block text-[12.5px] text-ink-2">
          {formatWeekday(f.departAt)} {formatShortDate(f.departAt)} · {f.stops === 0 ? "Direkt" : `${f.stops} aktarma`} · {f.oneWay ? "Tek yön" : "Gidiş-dönüş"}
        </span>
        <span className="mt-1 block">
          <Freshness at={f.checkedAt} windowMinutes={720} />
        </span>
      </span>
      <span className="text-right">
        <span className="block font-display text-[19px] font-[680] tabular">{formatMoney(f.priceMinor, f.currency)}</span>
        <span className="block text-[11px] text-ink-3">{f.priceKind === "CACHED_INDICATIVE" ? "gösterge fiyat" : "canlı teklif"}</span>
        <span className="sr-only">Kalkış tarihi {date}</span>
      </span>
    </Link>
  );
}
