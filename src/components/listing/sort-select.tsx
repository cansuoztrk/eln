"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SORTS, type SortKey } from "@/lib/listing-constants";

export function SortSelect({ value, hasQuery }: { value: SortKey; hasQuery: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  return (
    <label className="inline-flex items-center gap-2 text-[13px] text-ink-2">
      <span className="hidden sm:inline">Sırala</span>
      <select
        value={value}
        onChange={(e) => {
          const params = new URLSearchParams(sp.toString());
          params.set("sirala", e.target.value);
          params.delete("sayfa");
          router.push(`${pathname}?${params.toString()}`);
        }}
        className="field h-10 w-auto pr-8 font-medium text-ink"
      >
        {(Object.keys(SORTS) as SortKey[])
          .filter((k) => k !== "ilgili" || hasQuery)
          .map((k) => (
            <option key={k} value={k}>
              {SORTS[k]}
            </option>
          ))}
      </select>
    </label>
  );
}
