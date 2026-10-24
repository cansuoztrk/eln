import Link from "next/link";
import type { ProductCardData } from "@/server/catalog/queries";
import { cn } from "@/lib/cn";
import { formatPercent } from "@/lib/money";
import { Sparkline } from "../charts/sparkline";
import { Icon } from "../icons";
import { DealLabels } from "../price/deal-labels";
import { Freshness } from "../price/freshness";
import { Price, ShippingNote } from "../price/price";
import { SignalMeter } from "../price/signal-meter";
import { Badge, TestDataBadge } from "../ui/badge";
import { FavoriteButton } from "./favorite-button";
import { ProductImage } from "./product-image";

/**
 * Ürün kartı. Bilgi hiyerarşisi: fiyat > doğrulanmış indirim > kargo/mağaza > etiketler > tazelik.
 * Kartın tamamı detay sayfasına gider (genişletilmiş bağlantı); favori ve alarm düğmeleri ayrı
 * etkileşim hedefleridir.
 */
export function ProductCard({ p, loggedIn, favorited = false, priority = false, className }: { p: ProductCardData; loggedIn: boolean; favorited?: boolean; priority?: boolean; className?: string }) {
  const best = p.best;
  return (
    <article className={cn("group card relative flex flex-col overflow-hidden transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-pop", className)}>
      <div className="relative aspect-[4/3] overflow-hidden border-b border-line">
        <ProductImage src={p.imageUrl} alt={p.title} icon={p.category.icon} priority={priority} className="transition-transform duration-300 group-hover:scale-[1.02]" />
        <div className="absolute left-2.5 top-2.5 flex flex-col items-start gap-1">
          {p.isTestData ? <TestDataBadge /> : null}
          {best?.isSponsored ? <Badge tone="sponsor">Sponsorlu</Badge> : null}
        </div>
        <div className="absolute right-2.5 top-2.5 z-10 flex flex-col gap-1.5">
          <FavoriteButton productId={p.id} loggedIn={loggedIn} initial={favorited} size="sm" />
          <Link
            href={`/urun/${p.slug}#alarm`}
            className="grid size-8 place-items-center rounded-full border border-line bg-surface/90 text-ink-3 backdrop-blur transition-colors hover:border-line-strong hover:text-ink"
            aria-label={`${p.title} için fiyat alarmı kur`}
            title="Fiyat alarmı kur"
          >
            <Icon name="bellPlus" className="size-4" />
          </Link>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-3.5">
        <p className="mb-1 truncate font-mono text-[10.5px] uppercase tracking-[0.06em] text-ink-3">
          {p.brand ? `${p.brand} · ` : ""}
          {p.category.name}
        </p>
        <h3 className="line-clamp-2 min-h-[2.6em] text-[14px] font-medium leading-[1.3] text-ink">
          <Link href={`/urun/${p.slug}`} className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none">
            {p.title}
          </Link>
        </h3>

        {best ? (
          <>
            <div className="mt-2.5 flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span data-testid="card-price">
                <Price minor={best.totalMinor ?? best.priceMinor} currency={best.currency} className="text-[21px] leading-none" />
              </span>
              {p.discount ? (
                <span className="inline-flex items-center gap-0.5 rounded-sm bg-good-soft px-1.5 py-0.5 text-[12px] font-semibold text-good-ink tabular" title={`Doğrulanmış indirim: ${p.discount.caption}`}>
                  <Icon name="arrowDown" className="size-3" />
                  {formatPercent(p.discount.percent)}
                </span>
              ) : null}
            </div>
            {p.discount ? <p className="mt-0.5 text-[11px] text-ink-3">{p.discount.caption}</p> : null}
            <p className="mt-1.5 flex flex-wrap items-center gap-x-1.5 text-[12px] text-ink-2">
              {best.totalMinor !== null && best.shippingMinor ? <span>kargo dâhil</span> : <ShippingNote shippingMinor={best.shippingMinor} currency={best.currency} />}
              <span aria-hidden className="text-ink-3">·</span>
              <span className="font-medium text-ink">{best.retailer.name}</span>
              {p.retailerCount > 1 ? <span className="text-ink-3">· {p.retailerCount} mağaza</span> : null}
            </p>
            <DealLabels labels={best.labels} max={2} hideVerified className="mt-2.5" />
          </>
        ) : (
          <p className="mt-3 text-[13px] text-warn-ink">Güncel ve doğrulanmış teklif yok</p>
        )}

        <div className="min-h-3 flex-1" aria-hidden />
        <div className="flex items-end justify-between gap-2 border-t border-line pt-2.5">
          {p.sparkline.length ? <Sparkline values={p.sparkline} width={84} height={24} /> : <span className="font-mono text-[10.5px] text-ink-3">Geçmiş birikiyor</span>}
          <div className="flex flex-col items-end gap-1">
            <SignalMeter score={p.dealScore} />
            <Freshness at={best?.lastSuccessAt ?? p.lastVerifiedAt} compact />
          </div>
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({ items, loggedIn, favoriteIds = [], className, priorityCount = 0, layout = "wide" }: { items: ProductCardData[]; loggedIn: boolean; favoriteIds?: string[]; className?: string; priorityCount?: number; layout?: "wide" | "sidebar" }) {
  return (
    <div className={cn("grid grid-cols-2 gap-3 sm:gap-4", layout === "wide" ? "md:grid-cols-3 xl:grid-cols-4" : "md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4", className)}>
      {items.map((p, i) => (
        <ProductCard key={p.id} p={p} loggedIn={loggedIn} favorited={favoriteIds.includes(p.id)} priority={i < priorityCount} />
      ))}
    </div>
  );
}

export function ProductRail({ items, loggedIn, favoriteIds = [] }: { items: ProductCardData[]; loggedIn: boolean; favoriteIds?: string[] }) {
  return (
    <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:thin] md:mx-0 md:grid md:grid-cols-4 md:gap-4 md:overflow-visible md:px-0">
      {items.map((p) => (
        <ProductCard key={p.id} p={p} loggedIn={loggedIn} favorited={favoriteIds.includes(p.id)} className="w-[72vw] max-w-[280px] shrink-0 snap-start md:w-auto md:max-w-none" />
      ))}
    </div>
  );
}
