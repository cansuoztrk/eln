/**
 * Fiyat geçmişi özeti — geçmiş verilere dayanan açıklamalar üretir; GELECEK TAHMİNİ YAPMAZ.
 * Yeterli veri yoksa bunu açıkça söyler.
 */
import { formatMoney, formatPercent } from "@/lib/money";
import type { OfferMetrics } from "./evaluate";

export type SummaryLine = { tone: "positive" | "neutral" | "warning"; text: string };

export function summarizePriceHistory(m: OfferMetrics | null, ctx: { currency: string; retailerName: string; retailersCompared: number; priceMinor: number }): SummaryLine[] {
  if (!m) return [{ tone: "neutral", text: "Bu ürün için henüz değerlendirme yapılmadı." }];
  const out: SummaryLine[] = [];
  const money = (v: number | null | undefined) => formatMoney(v ?? null, ctx.currency);

  if (m.historyDays < 7 || !m.d30.sufficient) {
    out.push({
      tone: "neutral",
      text: `Bu ürün ${Math.max(1, Math.round(m.historyDays))} gündür izleniyor (30 günün ${m.d30.coverageDays.toLocaleString("tr-TR")} günü için doğrulanmış kayıt var). Geçmiş fiyat karşılaştırması için yeterli veri henüz yok.`,
    });
  }
  if (m.recentDropPct && m.recentDropPct >= 1) out.push({ tone: "positive", text: `Fiyat son 7 günde ${formatPercent(m.recentDropPct, 1)} düştü.` });

  if (m.d30.sufficient && m.d30.medianMinor) {
    if (m.verifiedDiscount?.reference === "MEDIAN_30") {
      out.push({ tone: "positive", text: `Güncel fiyat, son 30 günün tipik fiyatından (${money(m.d30.medianMinor)}) ${formatPercent(m.verifiedDiscount.percent, 1)} daha düşük.` });
    } else if (ctx.priceMinor > m.d30.medianMinor) {
      const above = ((ctx.priceMinor - m.d30.medianMinor) / m.d30.medianMinor) * 100;
      out.push({ tone: "warning", text: `Güncel fiyat, 30 günlük tipik fiyatın (${money(m.d30.medianMinor)}) ${formatPercent(above, 1)} üzerinde.` });
    } else {
      out.push({ tone: "neutral", text: `Güncel fiyat 30 günlük tipik seviyesinde (${money(m.d30.medianMinor)}).` });
    }
  } else if (m.verifiedDiscount?.reference === "PREVIOUS_STABLE") {
    out.push({ tone: "positive", text: `Fiyat, ${m.previous?.heldDays.toLocaleString("tr-TR")} gün geçerli kalan önceki doğrulanmış fiyata (${money(m.verifiedDiscount.referenceMinor)}) göre ${formatPercent(m.verifiedDiscount.percent, 1)} düşük. Geçmiş kapsamı sınırlıdır.` });
  }

  if (m.d90.sufficient && m.d90.lowMinor !== null) {
    if (m.aboveLow90Pct !== null && m.aboveLow90Pct <= 0.1) out.push({ tone: "positive", text: `Son 90 günün en düşük seviyesinde (${money(m.d90.lowMinor)}).` });
    else if (m.aboveLow90Pct !== null) out.push({ tone: "neutral", text: `Son 90 günün en düşük fiyatı ${money(m.d90.lowMinor)}; güncel fiyat bunun ${formatPercent(m.aboveLow90Pct, 1)} üzerinde.` });
  }

  if (m.competitor) {
    out.push(
      m.competitor.isBest
        ? { tone: "positive", text: `Karşılaştırılan ${m.competitor.retailersCompared} mağaza arasında kargo dâhil en uygun teklif ${ctx.retailerName} mağazasında.` }
        : { tone: "warning", text: `Başka bir mağazada daha uygun bir teklif var (${money(m.competitor.bestOtherMinor)}).` },
    );
  } else if (ctx.retailersCompared <= 1) {
    out.push({ tone: "neutral", text: "Şu an yalnızca bir mağazada doğrulanmış teklif var; mağazalar arası karşılaştırma yapılamıyor." });
  }

  if (m.listDiscount?.credible === false) out.push({ tone: "warning", text: `Mağazanın gösterdiği eski fiyat (${money(m.listDiscount.referenceMinor)}) bizim kayıtlarımızda son 90 günde uygulanmamış görünüyor; bu “indirim”i dikkate almayın.` });

  const aboveTypical = m.d30.sufficient && m.d30.medianMinor !== null && ctx.priceMinor > m.d30.medianMinor;
  if (aboveTypical || (m.aboveLow90Pct !== null && m.aboveLow90Pct > 5)) {
    out.push({ tone: "neutral", text: "Fiyat geçmişteki düşük seviyelerinin üzerinde; hedef fiyatla alarm kurmak mantıklı olabilir." });
  }
  return out;
}
