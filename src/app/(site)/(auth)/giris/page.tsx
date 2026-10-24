import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/auth-forms";
import { getCurrentUser } from "@/server/auth/session";

export const metadata: Metadata = { title: "Giriş yap", robots: { index: false } };

export default async function LoginPage(props: PageProps<"/giris">) {
  const sp = await props.searchParams;
  const next = typeof sp.sonra === "string" ? sp.sonra : "/hesap";
  if (await getCurrentUser()) redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/hesap");
  return (
    <>
      <h1 className="font-display text-[24px] font-[680] tracking-tight">Tekrar hoş geldiniz</h1>
      <p className="mb-6 mt-1 text-[13.5px] text-ink-2">Favorileriniz, alarmlarınız ve bildirimleriniz için giriş yapın.</p>
      <LoginForm next={next} />
      <p className="mt-6 text-center text-[13px] text-ink-2">
        Hesabınız yok mu?{" "}
        <Link href={`/kayit?sonra=${encodeURIComponent(next)}`} className="font-medium text-brand-ink hover:underline">
          Ücretsiz oluşturun
        </Link>
      </p>
    </>
  );
}
