import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SetupForm } from "@/features/auth/components/setup-form";
import { spaceExists } from "@/features/auth/queries";

export const metadata: Metadata = { title: "Kurulum" };
// Whether setup is still open depends on the database right now, never on build time.
export const dynamic = "force-dynamic";

export default async function SetupPage() {
  // Setup happens exactly once. Afterwards this page no longer exists.
  if (await spaceExists()) redirect("/login");

  return (
    <>
      <div className="mb-6 text-center">
        <h1 className="font-display text-3xl text-ink">İlk kurulum</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Bu adım yalnızca bir kez yapılır. Senin hesabın, özel alan ve doğrulanmış tarihler oluşturulur.
        </p>
      </div>
      <SetupForm />
    </>
  );
}
