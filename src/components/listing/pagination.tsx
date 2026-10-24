import Link from "next/link";
import { cn } from "@/lib/cn";
import { Icon } from "../icons";

export function Pagination({ page, pageCount, hrefFor }: { page: number; pageCount: number; hrefFor: (p: number) => string }) {
  if (pageCount <= 1) return null;
  const pages = new Set([1, pageCount, page - 1, page, page + 1].filter((p) => p >= 1 && p <= pageCount));
  const list = [...pages].sort((a, b) => a - b);
  return (
    <nav aria-label="Sayfalar" className="mt-10 flex items-center justify-center gap-1.5">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} rel="prev" className="grid size-10 place-items-center rounded-md border border-line hover:border-line-strong" aria-label="Önceki sayfa">
          <Icon name="chevronLeft" className="size-4" />
        </Link>
      ) : null}
      {list.map((p, i) => (
        <span key={p} className="flex items-center gap-1.5">
          {i > 0 && p - list[i - 1] > 1 ? <span className="px-1 text-ink-3">…</span> : null}
          <Link href={hrefFor(p)} aria-current={p === page ? "page" : undefined} className={cn("grid h-10 min-w-10 place-items-center rounded-md border px-3 font-mono text-[13px] tabular", p === page ? "border-brand bg-brand text-on-brand" : "border-line hover:border-line-strong")}>
            {p}
          </Link>
        </span>
      ))}
      {page < pageCount ? (
        <Link href={hrefFor(page + 1)} rel="next" className="grid size-10 place-items-center rounded-md border border-line hover:border-line-strong" aria-label="Sonraki sayfa">
          <Icon name="chevronRight" className="size-4" />
        </Link>
      ) : null}
    </nav>
  );
}
