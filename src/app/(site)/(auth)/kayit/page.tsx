import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/auth/auth-forms";
import { getCurrentUser } from "@/server/auth/session";

export const metadata: Metadata = { title: "Hesap oluştur", robots: { index: false } };

export default async function RegisterPage(props: PageProps<"/kayit">) {
  const sp = await props.searchParams;
  const next = typeof sp.sonra === "string" ? sp.sonra : "/hesap";
  if (await getCurrentUser()) redirect("/hesap");
  return (
    <>
      <h1 className="font-display text-[24px] font-[680] tracking-tight">Ücretsiz hesap</h1>
      <p className="mb-6 mt-1 text-[13.5px] text-ink-2">Fiyat alarmları, favoriler ve kişiselleştirilmiş fırsatlar. Gereksiz kişisel bilgi istemiyoruz.</p>
      <RegisterForm next={next} />
      <p className="mt-6 text-center text-[13px] text-ink-2">
        Zaten hesabınız var mı?{" "}
        <Link href={`/giris?sonra=${encodeURIComponent(next)}`} className="font-medium text-brand-ink hover:underline">
          Giriş yapın
        </Link>
      </p>
    </>
  );
}
