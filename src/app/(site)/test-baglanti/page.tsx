import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Test verisi", robots: { index: false } };

export default async function TestLinkPage(props: PageProps<"/test-baglanti">) {
  const sp = await props.searchParams;
  const slug = typeof sp.urun === "string" ? sp.urun : null;
  return (
    <div className="container-page py-16">
      <EmptyState
        icon="info"
        title="Bu bir test kaydıdır"
        action={
          <Link href={slug ? `/urun/${slug}` : "/"} className="text-sm font-medium text-brand-ink underline underline-offset-4">
            Geri dön
          </Link>
        }
      >
        Seçtiğiniz teklif kurgusal test verisidir; gerçek bir mağaza veya satın alma bağlantısı yoktur. Gerçek teklifler yetkili veri kaynakları bağlandığında görünür.
      </EmptyState>
    </div>
  );
}
