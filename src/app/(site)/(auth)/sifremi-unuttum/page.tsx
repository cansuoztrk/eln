import type { Metadata } from "next";
import { ForgotForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = { title: "Parolamı unuttum", robots: { index: false } };

export default function ForgotPage() {
  return (
    <>
      <h1 className="font-display text-[24px] font-[680] tracking-tight">Parolamı unuttum</h1>
      <p className="mb-6 mt-1 text-[13.5px] text-ink-2">E-posta adresinize 1 saat geçerli bir sıfırlama bağlantısı göndereceğiz.</p>
      <ForgotForm />
    </>
  );
}
