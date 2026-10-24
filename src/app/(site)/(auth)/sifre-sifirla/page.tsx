import type { Metadata } from "next";
import { ResetForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = { title: "Parola sıfırla", robots: { index: false } };

export default async function ResetPage(props: PageProps<"/sifre-sifirla">) {
  const sp = await props.searchParams;
  const token = typeof sp.token === "string" ? sp.token : "";
  return (
    <>
      <h1 className="font-display text-[24px] font-[680] tracking-tight">Yeni parola</h1>
      <p className="mb-6 mt-1 text-[13.5px] text-ink-2">Parolanızı güncellediğinizde diğer cihazlardaki oturumlar kapatılır.</p>
      {token ? <ResetForm token={token} /> : <p className="text-[13.5px] text-bad-ink">Bağlantı eksik veya geçersiz.</p>}
    </>
  );
}
