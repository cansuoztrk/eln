import Link from "next/link";
import { brand } from "@/config/brand";
import { Logo } from "../brand/logo";

const COLS = [
  {
    title: "Keşfet",
    links: [
      ["/firsatlar", "Ürün fırsatları"],
      ["/karsilastir", "Fiyat karşılaştırma"],
      ["/kategoriler", "Kategoriler"],
      ["/kuponlar", "Kuponlar ve kampanyalar"],
      ["/ucak-bileti", "Uçak bileti fırsatları"],
      ["/rehber", "Rehberler"],
    ],
  },
  {
    title: "Güven",
    links: [
      ["/nasil-calisir", "Fırsat puanı nasıl hesaplanır?"],
      ["/veri-kaynaklari", "Veri kaynakları ve güncellik"],
      ["/satis-ortakligi", "Satış ortaklığı açıklaması"],
    ],
  },
  {
    title: "Hesap",
    links: [
      ["/alarmlar", "Fiyat alarmları"],
      ["/favoriler", "Favorilerim"],
      ["/hesap/bildirimler", "Bildirimler"],
      ["/kayit", "Ücretsiz hesap oluştur"],
    ],
  },
  {
    title: "Yasal",
    links: [
      ["/kvkk", "KVKK aydınlatma metni"],
      ["/gizlilik", "Gizlilik politikası"],
      ["/cerezler", "Çerez politikası"],
      ["/kullanim-kosullari", "Kullanım koşulları"],
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-line bg-surface pb-24 lg:pb-0">
      <div className="container-page grid gap-10 py-12 md:grid-cols-[1.3fr_repeat(4,1fr)]">
        <div className="max-w-xs">
          <Logo />
          <p className="mt-4 text-[13px] leading-relaxed text-ink-2">{brand.description}</p>
          <p className="mt-4 text-[12px] leading-relaxed text-ink-3">
            Fiyatlar mağazalar tarafından değiştirilebilir. Her fiyatın yanında son kontrol zamanı ve kaynağı gösterilir; satın almadan önce mağaza sayfasını kontrol edin.
          </p>
        </div>
        {COLS.map((c) => (
          <div key={c.title}>
            <p className="eyebrow mb-3">{c.title}</p>
            <ul className="space-y-2">
              {c.links.map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="text-[13px] text-ink-2 hover:text-ink">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-line">
        <div className="container-page flex flex-col gap-2 py-5 text-[12px] text-ink-3 md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} {brand.name} · Geçici çalışma adı. Bağlantıların bir kısmı satış ortaklığı bağlantısı olabilir; bu durum fiyatı ve sıralamayı etkilemez.
          </p>
          <p className="font-mono">Türkiye · TRY · Europe/Istanbul</p>
        </div>
      </div>
    </footer>
  );
}
