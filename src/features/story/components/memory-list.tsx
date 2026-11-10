"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import { formatWithPrecision, parseISODate } from "@/lib/dates";
import { reorderMemoriesAction } from "../actions";
import type { Memory } from "../queries";
import { memoryCategoryLabel } from "../schema";

/** The Studio's list of memories, in timeline order, with a way to nudge that order. */
export function MemoryList({ memories, editBase }: { memories: Memory[]; editBase: string }) {
  const router = useRouter();
  const [busy, start] = useTransition();

  function move(index: number, step: -1 | 1) {
    const order = memories.map((m) => m.id);
    const to = index + step;
    if (to < 0 || to >= order.length) return;
    [order[index], order[to]] = [order[to], order[index]];
    start(async () => {
      const result = await reorderMemoriesAction(order);
      if (!result.ok) toast(result.error, "error");
      router.refresh();
    });
  }

  // Order only matters between memories that share a date.
  const sameDay = (a?: Memory, b?: Memory) => Boolean(a && b && a.happenedOn === b.happenedOn);

  return (
    <ul className="paper divide-y divide-line">
      {memories.map((memory, i) => {
        const date = parseISODate(memory.happenedOn);
        return (
          <li key={memory.id} className="flex items-center gap-4 px-4 py-3.5 sm:px-5">
            <div className="size-14 shrink-0 overflow-hidden rounded-lg bg-beige">
              {memory.cover ? (
                // eslint-disable-next-line @next/next/no-img-element -- signed thumbnail
                <img src={memory.cover.image.thumb} alt="" className="size-full object-cover" />
              ) : null}
            </div>
            <Link href={`${editBase}${memory.id}`} className="group min-w-0 flex-1">
              <p className="truncate font-display text-xl text-ink group-hover:text-accent">{memory.title}</p>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-muted">
                <span>{date ? formatWithPrecision(date, memory.datePrecision) : "Tarihsiz"}</span>
                <span aria-hidden="true">·</span>
                <span>{memoryCategoryLabel(memory.category)}</span>
                <Badge tone={memory.status === "published" ? "live" : "draft"}>{memory.status === "published" ? "Yayında" : "Taslak"}</Badge>
                {!memory.mine ? <Badge tone="blush">{memory.authorName}</Badge> : null}
                {!memory.description ? <Badge tone="gold">Açıklama yazılmadı</Badge> : null}
              </p>
            </Link>
            <div className="flex shrink-0">
              <button
                type="button"
                disabled={busy || !sameDay(memory, memories[i - 1])}
                onClick={() => move(i, -1)}
                aria-label={`${memory.title}: yukarı taşı`}
                className="grid size-8 place-items-center rounded-full text-taupe hover:bg-beige hover:text-ink disabled:opacity-25"
              >
                <ArrowUp className="size-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                disabled={busy || !sameDay(memory, memories[i + 1])}
                onClick={() => move(i, 1)}
                aria-label={`${memory.title}: aşağı taşı`}
                className="grid size-8 place-items-center rounded-full text-taupe hover:bg-beige hover:text-ink disabled:opacity-25"
              >
                <ArrowDown className="size-4" aria-hidden="true" />
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
