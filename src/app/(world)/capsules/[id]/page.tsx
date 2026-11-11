import { ArrowLeft, PenLine } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { CapsuleOpener } from "@/features/capsules/components/capsule-opener";
import { getCapsule } from "@/features/capsules/queries";
import { people, requireMember } from "@/lib/auth/session";
import { formatDate, todayIn } from "@/lib/dates";

export const metadata: Metadata = { title: "Zaman kapsülü" };

export default async function CapsulePage({ params }: PageProps<"/capsules/[id]">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  const session = await requireMember();
  // A capsule that is still sealed for this viewer is not returned at all.
  const capsule = await getCapsule(session, id);
  if (!capsule) notFound();

  const day = formatDate(todayIn(people(session).me.timezone, new Date(capsule.unlockAt)));

  return (
    <div className="shell-narrow pt-24 pb-10 md:pt-32">
      <div className="mb-8 flex items-center justify-between gap-4">
        <Link href="/capsules" className="inline-flex items-center gap-2 text-[13px] font-medium tracking-wide text-taupe hover:text-accent">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Kapsüller
        </Link>
        {capsule.mine && session.role === "owner" ? (
          <Link href="/studio/capsules" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-taupe hover:text-accent">
            <PenLine className="size-3.5" aria-hidden="true" />
            Düzenle
          </Link>
        ) : null}
      </div>
      <CapsuleOpener capsule={capsule} openedLabel={capsule.open ? `${day} günü açıldı` : `${day} günü açılacak · önizleme`} />
    </div>
  );
}
