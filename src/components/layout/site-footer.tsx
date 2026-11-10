import { Bow } from "@/components/decor";

export function SiteFooter({
  ownerName,
  partnerName,
  ownerCity,
  partnerCity,
}: {
  ownerName: string;
  partnerName: string;
  ownerCity: string;
  partnerCity: string;
}) {
  return (
    <footer className="shell pt-24 pb-32 text-center md:pb-16">
      <div className="hairline mb-12" />
      <Bow className="mx-auto mb-5 w-10 text-rose" />
      <p className="font-display text-2xl text-ink italic">
        {ownerName} tarafından, {partnerName} için.
      </p>
      <p className="eyebrow mt-4">
        {ownerCity} — {partnerCity}
      </p>
    </footer>
  );
}
