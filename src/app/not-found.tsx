import Link from "next/link";
import { LogoMark } from "@/components/brand/logo";

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center px-4">
      <div className="max-w-md text-center">
        <LogoMark className="mx-auto mb-6 size-12" />
        <p className="font-mono text-[12px] text-ink-3">404</p>
        <h1 className="mt-1 font-display text-[28px] font-[680] tracking-tight">Radarda böyle bir sayfa yok</h1>
        <p className="mt-2 text-[14px] text-ink-2">Ürün satıştan kalkmış veya bağlantı değişmiş olabilir.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/" className="inline-flex h-10 items-center rounded-md bg-brand px-4 text-[14px] font-semibold text-on-brand">
            Ana sayfa
          </Link>
          <Link href="/firsatlar" className="inline-flex h-10 items-center rounded-md border border-line-strong px-4 text-[14px]">
            Fırsatlar
          </Link>
        </div>
      </div>
    </div>
  );
}
