import { activateScoringVersion, saveScoring } from "@/app/admin/actions";
import { AdminPage, Field, Panel, SubmitButton, Table, Td } from "@/components/admin/ui";
import { ActionForm } from "@/components/forms/action-form";
import { formatDateTime } from "@/lib/time";
import { requireStaff } from "@/server/auth/guards";
import { db } from "@/server/db";
import { DEFAULT_SCORING, type ScoringThresholds, WEIGHT_LABELS, type ScoringWeights } from "@/server/pricing/config";
import { loadScoringConfig } from "@/server/pricing/recompute";

export const metadata = { title: "Fırsat puanı" };

const THRESHOLD_LABELS: Record<keyof ScoringThresholds, string> = {
  fullHistoricalDiscountPct: "Tam puan için tipik fiyata göre indirim (%)",
  fullCompetitorGapPct: "Tam puan için rakibe göre fark (%)",
  advantageousMinPct: "“Geçmişe göre avantajlı” etiketi için asgari indirim (%)",
  watchCloseToLowPct: "“Yakından takip et”: 90 gün en düşüğe yakınlık (%)",
  stablePreviousDays: "Önceki fiyatın kararlı sayılması (gün)",
  inflatedListPriceFactor: "Şişirilmiş liste fiyatı katsayısı",
  suspiciousDropPct: "Şüpheli düşüş eşiği (%)",
  suspiciousRisePct: "Şüpheli artış eşiği (%)",
  engagementCap: "Etkileşim tavanı (7 gün)",
};

export default async function AdminScoring() {
  await requireStaff("ADMIN");
  const [cfg, versions, sample] = await Promise.all([
    loadScoringConfig(db),
    db.scoringConfig.findMany({ orderBy: { version: "desc" }, take: 15 }),
    db.offer.findMany({ where: { status: "ACTIVE", dealScore: { not: null } }, orderBy: { dealScore: "desc" }, take: 8, include: { product: { select: { title: true } }, retailer: { select: { name: true } } } }),
  ]);
  return (
    <AdminPage title="Fırsat puanı yapılandırması" description="Ağırlıklar ve eşikler sürümlenir. Kaydetmek yeni bir sürüm oluşturur, etkinleştirir ve tüm puanları arka planda yeniden hesaplar. Sponsorluk puana hiçbir zaman girmez.">
      <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <Panel title={`Etkin sürüm: ${cfg.version}`}>
          <ActionForm action={saveScoring} submitLabel="Yeni sürüm olarak kaydet ve uygula">
            <p className="eyebrow">Ağırlıklar (0–100, oransal)</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {(Object.keys(DEFAULT_SCORING.weights) as (keyof ScoringWeights)[]).map((k) => (
                <Field key={k} label={WEIGHT_LABELS[k].label} hint={WEIGHT_LABELS[k].help}>
                  <input name={`w_${k}`} type="number" min={0} max={100} step={1} defaultValue={cfg.weights[k]} className="field" />
                </Field>
              ))}
            </div>
            <p className="eyebrow pt-2">Eşikler</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {(Object.keys(DEFAULT_SCORING.thresholds) as (keyof ScoringThresholds)[]).map((k) => (
                <Field key={k} label={THRESHOLD_LABELS[k]}>
                  <input name={`t_${k}`} type="number" min={0} step="0.01" defaultValue={cfg.thresholds[k]} className="field" />
                </Field>
              ))}
            </div>
            <Field label="Sürüm notu">
              <input name="note" placeholder="Ör. rakip avantajının ağırlığı artırıldı" className="field" />
            </Field>
          </ActionForm>
        </Panel>
        <div className="space-y-4">
          <Panel title="Şu an en yüksek puanlı teklifler">
            <ul className="space-y-2 text-[13px]">
              {sample.map((o) => (
                <li key={o.id} className="flex justify-between gap-2">
                  <span className="truncate">
                    {o.product.title} <span className="text-ink-3">· {o.retailer.name}</span>
                  </span>
                  <span className="font-mono">{o.dealScore?.toFixed(1)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[12px] text-ink-3">Her teklifin faktör dökümü ürün sayfasındaki “Neden bu puan?” bölümünde görünür.</p>
          </Panel>
          <Panel title="Sürüm geçmişi">
            <Table head={["Sürüm", "Not", "Tarih", ""]}>
              {versions.map((v) => (
                <tr key={v.id}>
                  <Td className="font-mono">{v.version}</Td>
                  <Td className="text-[12.5px]">{v.note ?? "—"}</Td>
                  <Td className="text-[12px]">{formatDateTime(v.createdAt)}</Td>
                  <Td>
                    {v.isActive ? (
                      <span className="text-[12px] font-semibold text-good-ink">Etkin</span>
                    ) : (
                      <form action={activateScoringVersion.bind(null, v.version)}>
                        <SubmitButton variant="secondary">Geri dön</SubmitButton>
                      </form>
                    )}
                  </Td>
                </tr>
              ))}
            </Table>
          </Panel>
        </div>
      </div>
    </AdminPage>
  );
}
