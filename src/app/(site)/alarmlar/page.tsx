import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Icon } from "@/components/icons";
import { ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/section";
import { getCurrentUser } from "@/server/auth/session";

export const metadata: Metadata = { title: "Fiyat alarmları", description: "Ürün veya uçuş fiyatı hedefinize indiğinde e-posta ve site içi bildirim alın.", alternates: { canonical: "/alarmlar" } };

export default async function AlertsLanding() {
  const user = await getCurrentUser();
  if (user) redirect("/hesap/alarmlar");
  const steps = [
    ["search", "Ürünü bulun", "Ürün sayfasında “Fiyat alarmı” bölümüne gidin."],
    ["tag", "Hedef fiyatı belirleyin", "İsterseniz varyant ve kargo dâhil/hariç seçimini yapın."],
    ["bell", "Biz takip edelim", "Fiyat her doğrulandığında kontrol edilir; hedefe inince bir kez bildirilir."],
  ];
  return (
    <>
      <PageHeader eyebrow="Alarmlar" title="Fiyat alarmları" description="“Bu ürün 2.000 TL'nin altına düşerse haber ver.” Alarmlar yalnızca son kontrolde doğrulanmış fiyatlarla tetiklenir; aynı düşüş için tekrar bildirim gönderilmez." />
      <div className="container-page py-10">
        <ol className="grid gap-4 md:grid-cols-3">
          {steps.map(([icon, title, text], i) => (
            <li key={title} className="card p-5">
              <span className="mb-3 flex items-center gap-2">
                <span className="grid size-9 place-items-center rounded-md bg-brand-soft text-brand-ink">
                  <Icon name={icon} className="size-[18px]" />
                </span>
                <span className="font-mono text-[12px] text-ink-3">0{i + 1}</span>
              </span>
              <p className="font-semibold">{title}</p>
              <p className="mt-1 text-[13.5px] text-ink-2">{text}</p>
            </li>
          ))}
        </ol>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/kayit?sonra=/hesap/alarmlar">Ücretsiz hesap oluştur</ButtonLink>
          <ButtonLink href="/giris?sonra=/hesap/alarmlar" variant="outline">
            Giriş yap
          </ButtonLink>
        </div>
        <p className="mt-4 text-[12.5px] text-ink-3">Alarm bildirimi için yalnızca e-posta adresiniz gerekir. Uçuş alarmları için uçak bileti sayfasındaki rota bölümünü kullanın.</p>
      </div>
    </>
  );
}
