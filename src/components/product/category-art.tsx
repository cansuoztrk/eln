import { cn } from "@/lib/cn";
import { Icon } from "../icons";

/**
 * Görsel yoksa veya yüklenemezse kullanılan özel yedek görsel: kategori ikonu + radar halkaları.
 * Kaynağın görseli olmadığı durumlarda uydurma ürün fotoğrafı kullanılmaz.
 */
export function CategoryArt({ icon, className, label }: { icon: string | null | undefined; className?: string; label?: string }) {
  return (
    <div className={cn("relative grid h-full w-full place-items-center overflow-hidden bg-surface-2", className)} role="img" aria-label={label ?? "Ürün görseli mevcut değil"}>
      <svg className="absolute inset-0 h-full w-full text-line-strong" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice" aria-hidden>
        <circle cx="100" cy="100" r="38" fill="none" stroke="currentColor" strokeOpacity="0.5" />
        <circle cx="100" cy="100" r="66" fill="none" stroke="currentColor" strokeOpacity="0.35" />
        <circle cx="100" cy="100" r="94" fill="none" stroke="currentColor" strokeOpacity="0.2" />
      </svg>
      <span className="relative grid size-16 place-items-center rounded-2xl border border-line bg-surface text-ink-3 shadow-card">
        <Icon name={icon ?? "spark"} className="size-8" strokeWidth={1.4} />
      </span>
    </div>
  );
}
