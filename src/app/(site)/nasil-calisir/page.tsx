import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/section";
import { DEAL_LABELS } from "@/lib/deal-labels";
import { db } from "@/server/db";
import { WEIGHT_LABELS, type ScoringWeights } from "@/server/pricing/config";
import { loadScoringConfig } from "@/server/pricing/recompute";

export const metadata: Metadata = {
  title: "Fırsat puanı ve doğrulanmış indirim nasıl hesaplanır?",
  description: "Fırsat puanının faktörleri, doğrulanmış indirim ile liste fiyatı indirimi arasındaki fark ve etiketlerin koşulları.",
  alternates: { canonical: "/nasil-calisir" },
};

export default async function HowItWorks() {
  const cfg = await loadScoringConfig(db);
  const total = Object.values(cfg.weights).reduce((a, b) => a + b, 0) || 1;
  return (
    <>
      <PageHeader eyebrow="Şeffaflık" title="Fırsatları nasıl değerlendiriyoruz?" description="Bir ürünü öne çıkarmamızın nedeni her zaman açıklanabilir olmalı. Aşağıdaki kurallar sitede gördüğünüz her etiket ve puan için geçerlidir." />
      <div className="container-page prose-lite max-w-3xl py-10">
        <h2>Doğrulanmış indirim ≠ liste fiyatı indirimi</h2>
        <p>Mağazalar bir ürünün yanında “eski fiyat” gösterebilir; bu fiyat yakın zamanda gerçekten uygulanmamış olabilir. Bu yüzden iki ayrı metrik tutarız:</p>
        <ul>
          <li>
            <strong>Doğrulanmış indirim:</strong> Kendi topladığımız fiyat geçmişine göre hesaplanır. Referans, son 30 günün gün sonu fiyatlarının medyanıdır (“tipik fiyat”) ve bu dönemin en az üçte ikisi için doğrulanmış kayıt gerekir. Kayıt yetersizse, en az 3 gün geçerli kalmış önceki fiyat kullanılır ve bu açıkça belirtilir.
          </li>
          <li>
            <strong>Liste fiyatına göre indirim:</strong> Mağazanın beyanıdır. Ürün sayfasında ayrıca gösterilir; liste fiyatı son 90 günde doğruladığımız en yüksek fiyatın belirgin biçimde üzerindeyse uyarı veririz. Sıralamada kullanılmaz.
          </li>
        </ul>
        <p>Formül her ikisinde de aynıdır: <code>İndirim % = (Referans fiyat − Güncel fiyat) / Referans fiyat × 100</code>. Farkı yaratan, hangi fiyatın referans alındığıdır.</p>

        <h2>Fiyat geçmişi nasıl tutulur?</h2>
        <p>Her fiyat kontrolünde fiyat, stok veya kargo değiştiyse bir kayıt yazılır; değişmese bile günde en az bir kez “doğrulandı” kaydı eklenir. İki kayıt arasında 36 saatten uzun boşluk varsa o aralık “bilinmiyor” sayılır — kaynak erişilemediğinde fiyatı uydurmayız. Grafikler bu boşluklarda kesilir.</p>

        <h2>Fırsat puanı (0–100)</h2>
        <p>Puan, aşağıdaki faktörlerin ağırlıklı toplamıdır. Ağırlıklar yönetim panelinden sürümlenerek değiştirilebilir; şu an etkin olan yapılandırma sürüm {cfg.version}.</p>
        <table className="my-4 w-full text-[14px]">
          <thead>
            <tr className="border-b border-line text-left text-ink-3">
              <th className="py-2 font-medium">Faktör</th>
              <th className="py-2 text-right font-medium">Ağırlık</th>
            </tr>
          </thead>
          <tbody>
            {(Object.keys(cfg.weights) as (keyof ScoringWeights)[]).map((k) => (
              <tr key={k} className="border-b border-line align-top">
                <td className="py-2.5 pr-4">
                  <strong className="block text-ink">{WEIGHT_LABELS[k].label}</strong>
                  <span className="text-[13px] text-ink-2">{WEIGHT_LABELS[k].help}</span>
                </td>
                <td className="py-2.5 text-right font-mono tabular">%{Math.round((cfg.weights[k] / total) * 100)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p>Güncelliği doğrulanamayan, stokta olmayan veya şüpheli işaretlenmiş teklifler puan almaz. Tıklanma sayısı tek başına kalite ölçütü değildir ve tavanlıdır. <strong>Sponsorlu yerleşimler puanı etkilemez</strong> ve her zaman “Sponsorlu” olarak işaretlenir.</p>

        <h2>Etiketler ne anlama gelir?</h2>
        <ul>
          {Object.values(DEAL_LABELS).map((l) => (
            <li key={l.text}>
              <strong>{l.text}:</strong> {l.help}
            </li>
          ))}
        </ul>

        <h2>Ürün eşleştirme</h2>
        <p>Aynı ürün farklı mağazalarda farklı başlıklarla satılabilir. Eşleştirme sırası: GTIN/EAN barkodu (kontrol basamağı doğrulanır) → marka + üretici parça numarası → aynı marka ve birebir aynı model ailesi (renk, bağlantı tipi ve kapasite ayrı varyant olur). Yalnızca başlık benzerliğine dayanan eşleşmeler otomatik birleştirilmez; bir editör inceler.</p>

        <h2>Kuponlar</h2>
        <p>Yalnızca doğrulanmış ve geçerli kuponlar fiyat hesabına girer. Üyelik, ödeme yöntemi ve cashback avantajları koşullu olarak ayrı gösterilir. Birden fazla kuponun birlikte kullanılabileceği doğrulanmadıkça indirimler toplanmaz.</p>
      </div>
    </>
  );
}
