import type { Metadata } from "next";
import { Universe } from "@/features/universe/components/universe";
import { listStars } from "@/features/universe/queries";
import { requireMember } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Anı Evreni" };

export default async function UniversePage() {
  const session = await requireMember();
  const stars = await listStars(session);
  return <Universe stars={stars} />;
}
