import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/money";
import { formatDuration, formatShortDate, formatTime, formatWeekday } from "@/lib/time";
import { Icon } from "../icons";
import { Freshness } from "../price/freshness";
import { Badge, TestDataBadge } from "../ui/badge";

export type FlightCardData = {
  id: string;
  origin: string;
  destination: string;
  originAirport: string;
  destinationAirport: string;
  departAt: string;
  returnAt: string | null;
  oneWay: boolean;
  airlineCode: string | null;
  airlineName: string | null;
  flightNumber: string | null;
  stops: number;
  returnStops: number | null;
  durationOutMinutes: number | null;
  durationBackMinutes: number | null;
  priceMinor: number;
  currency: string;
  priceKind: "LIVE_QUOTE" | "CACHED_INDICATIVE";
  priceIncludesTaxes: boolean | null;
  baggageIncluded: boolean | null;
  baggageInfo: string | null;
  fareConditions: string | null;
  deepLink: string | null;
  isAffiliateLink: boolean;
  checkedAt: string;
  providerName: string;
  isTestData: boolean;
  passengers: number;
  cheapest?: boolean;
  fastest?: boolean;
};

function Leg({ from, to, at, minutes, stops, label }: { from: string; to: string; at: string; minutes: number | null; stops: number | null; label: string }) {
  const arrive = minutes !== null ? new Date(new Date(at).getTime() + minutes * 60000).toISOString() : null;
  return (
    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
      <div>
        <p className="font-display text-[19px] font-[650] tabular">{formatTime(at)}</p>
        <p className="font-mono text-[12px] text-ink-3">{from}</p>
      </div>
      <div className="text-center">
        <p className="text-[11.5px] text-ink-3">
          {label} · {formatWeekday(at)} {formatShortDate(at)}
        </p>
        <div className="relative my-1 h-px bg-line-strong">
          <Icon name="plane" className="absolute left-1/2 top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-surface text-ink-3" />
        </div>
        <p className={cn("text-[11.5px]", stops === 0 ? "text-good-ink" : "text-ink-3")}>
          {formatDuration(minutes)} · {stops === null ? "aktarma bilgisi yok" : stops === 0 ? "Direkt" : `${stops} aktarma`}
        </p>
      </div>
      <div className="text-right">
        <p className="font-display text-[19px] font-[650] tabular">{arrive ? formatTime(arrive) : "—"}</p>
        <p className="font-mono text-[12px] text-ink-3">{to}</p>
      </div>
    </div>
  );
}

export function FlightResultCard({ f }: { f: FlightCardData }) {
  return (
    <article data-testid="flight-result" className="card grid gap-4 p-4 md:grid-cols-[1fr_210px] md:p-5">
      <div className="min-w-0 space-y-4">
        <div className="flex flex-wrap items-center gap-2 text-[12.5px]">
          <span className="grid size-7 place-items-center rounded-md bg-surface-2 font-mono text-[11px] font-bold text-ink-2">{f.airlineCode ?? "?"}</span>
          <span className="font-medium">{f.airlineName ?? f.airlineCode ?? "Havayolu bilgisi yok"}</span>
          {f.flightNumber ? <span className="font-mono text-ink-3">{f.flightNumber}</span> : null}
          {f.cheapest ? <Badge tone="positive">En ucuz</Badge> : null}
          {f.fastest ? <Badge tone="brand">En kısa</Badge> : null}
          {f.isTestData ? <TestDataBadge /> : null}
        </div>
        <Leg from={f.originAirport} to={f.destinationAirport} at={f.departAt} minutes={f.durationOutMinutes} stops={f.stops} label="Gidiş" />
        {!f.oneWay && f.returnAt ? <Leg from={f.destinationAirport} to={f.originAirport} at={f.returnAt} minutes={f.durationBackMinutes} stops={f.returnStops} label="Dönüş" /> : null}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-ink-2">
          <span className="inline-flex items-center gap-1">
            <Icon name="luggage" className="size-3.5 text-ink-3" />
            {f.baggageInfo ?? (f.baggageIncluded === null ? "Bagaj bilgisi sağlayıcıda yok" : f.baggageIncluded ? "Bagaj dâhil" : "Bagaj dâhil değil")}
          </span>
          {f.fareConditions ? <span>{f.fareConditions}</span> : null}
        </div>
      </div>
      <div className="flex flex-col justify-between gap-3 border-t border-line pt-3 md:border-l md:border-t-0 md:pl-5 md:pt-0">
        <div>
          <p className="font-display text-[26px] font-[700] leading-none tabular">{formatMoney(f.priceMinor, f.currency)}</p>
          <p className="mt-1 text-[11.5px] leading-snug text-ink-3">
            {f.passengers > 1 ? `${f.passengers} yolcu toplam · ` : ""}
            {f.priceKind === "CACHED_INDICATIVE" ? "Gösterge fiyat (önbellek)" : "Canlı teklif"}
            {f.priceIncludesTaxes === true ? " · vergiler dâhil" : f.priceIncludesTaxes === false ? " · vergiler hariç" : " · vergi dâhil olup olmadığı belirtilmiyor"}
          </p>
        </div>
        <div className="space-y-2">
          {f.deepLink ? (
            <a href={`/git/ucus/${f.id}`} target="_blank" rel="nofollow sponsored noopener" className="flex h-10 items-center justify-center gap-1.5 rounded-md bg-brand text-[13.5px] font-semibold text-on-brand hover:bg-brand-ink">
              Biletleri gör <Icon name="external" className="size-3.5" />
            </a>
          ) : (
            <p className="rounded-md bg-surface-2 px-2.5 py-2 text-[11.5px] text-ink-3">Bu sağlayıcı doğrudan satın alma bağlantısı sunmuyor.</p>
          )}
          <p className="flex flex-wrap items-center justify-between gap-1 text-[11px] text-ink-3">
            <span>{f.providerName}</span>
            <Freshness at={f.checkedAt} windowMinutes={720} compact />
          </p>
        </div>
      </div>
    </article>
  );
}
