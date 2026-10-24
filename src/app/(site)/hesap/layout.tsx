import { AccountNav } from "@/components/account/account-nav";
import { requireUser } from "@/server/auth/guards";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("/hesap");
  return (
    <div className="container-page py-8 md:py-10">
      <div className="mb-6">
        <p className="eyebrow">Hesabım</p>
        <h1 className="mt-1 font-display text-[26px] font-[680] tracking-tight">{user.name ? `Merhaba ${user.name}` : "Hesabım"}</h1>
        <p className="text-[13px] text-ink-3">{user.email}</p>
      </div>
      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        <AccountNav />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
