import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Heart } from "@/components/decor";
import { InviteForm } from "@/features/auth/components/invite-form";
import { previewInvite } from "@/features/auth/queries";
import { getSession } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Davet" };

export default async function InvitePage({ params }: PageProps<"/invite/[token]">) {
  const { token } = await params;

  // Already inside? Then there is nothing to accept.
  if (await getSession()) redirect("/");

  const invite = await previewInvite(token);

  if (!invite.valid) {
    return (
      <div className="paper p-8 text-center sm:p-10">
        <h1 className="font-display text-3xl text-ink">Bu bağlantı artık açılmıyor</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted">
          Davet bağlantıları tek kullanımlık ve süreli. Yenisini istemen yeterli.
        </p>
      </div>
    );
  }

  return (
    <div className="paper p-7 sm:p-9">
      <div className="mb-7 text-center">
        <Heart className="mx-auto mb-4 size-4 text-rose" />
        <h1 className="font-display text-4xl text-ink">{invite.displayName},</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
          Bu bağlantı yalnızca sana ait.
          <br />
          İçeri girmeden önce kendine bir anahtar belirle.
        </p>
      </div>
      <InviteForm token={token} />
    </div>
  );
}
