import type { Metadata } from "next";
import { SettingsForm } from "@/features/studio/components/settings-form";
import { requireOwner } from "@/lib/auth/session";
import { StudioCard, StudioPage } from "../studio-page";

export const metadata: Metadata = { title: "Ayarlar" };

export default async function StudioSettingsPage() {
  const { space } = await requireOwner();

  return (
    <StudioPage
      title="Ayarlar"
      description="Sitenin konuştuğu adlar, şehirler ve saat dilimleri. Saatler, “bugün” ve bütün geri sayımlar burada yazan saat dilimlerine göre hesaplanır; kimsenin konumu kullanılmaz."
    >
      <StudioCard>
        <SettingsForm
          initial={{
            ownerName: space.owner_name,
            partnerName: space.partner_name,
            partnerFullName: space.partner_full_name ?? "",
            ownerCity: space.owner_city,
            partnerCity: space.partner_city,
            ownerTimezone: space.owner_timezone,
            partnerTimezone: space.partner_timezone,
          }}
        />
      </StudioCard>
    </StudioPage>
  );
}
