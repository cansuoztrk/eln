"use client";

import { History } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Confirm } from "@/components/ui/confirm";
import { toast } from "@/components/ui/toast";
import { restoreVersionAction } from "../actions";
import type { Version } from "../queries";

/**
 * Earlier versions of a piece of writing, with a way back to any of them.
 * Nothing written here is ever truly overwritten.
 */
export function VersionHistory({ table, versions, timeZone }: { table: string; versions: Version[]; timeZone: string }) {
  const router = useRouter();
  if (versions.length === 0) return null;
  const format = new Intl.DateTimeFormat("tr-TR", { timeZone, day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <details className="paper group mt-10 p-5 sm:p-7">
      <summary className="flex cursor-pointer list-none items-center gap-3 text-ink [&::-webkit-details-marker]:hidden">
        <History className="size-4 text-taupe" aria-hidden="true" />
        <span className="font-display text-2xl">Önceki sürümler</span>
        <span className="text-[13px] text-muted">({versions.length})</span>
        <span className="ml-auto text-[13px] text-accent group-open:hidden">Göster</span>
        <span className="ml-auto hidden text-[13px] text-accent group-open:inline">Gizle</span>
      </summary>
      <p className="mt-3 text-[13px] leading-relaxed text-muted">
        Her kaydedişte bir önceki hali burada saklanır. Geri döndüğünde şimdiki hali de bu listeye eklenir.
      </p>
      <ol className="mt-4 divide-y divide-line border-t border-line">
        {versions.map((version) => (
          <li key={version.id} className="flex flex-wrap items-start justify-between gap-3 py-4">
            <div className="min-w-0 flex-1">
              <p className="text-[13px] text-taupe">{format.format(new Date(version.savedAt))}</p>
              {version.title ? <p className="mt-0.5 font-display text-xl text-ink">{version.title}</p> : null}
              {version.preview ? <p className="prose-letter mt-1 line-clamp-3 text-[14px] leading-relaxed text-muted">{version.preview}</p> : null}
            </div>
            <Confirm
              trigger={
                <Button variant="outline" size="sm">
                  Bu sürüme dön
                </Button>
              }
              title="Bu sürüme dönülsün mü?"
              description="Yazının içeriği bu haline döner. Şimdiki hali kaybolmaz; o da sürümlere eklenir."
              confirmLabel="Geri dön"
              onConfirm={async () => {
                const result = await restoreVersionAction(table, version.id);
                toast(result.ok ? (result.message ?? "Geri dönüldü.") : result.error, result.ok ? "ok" : "error");
                if (result.ok) router.refresh();
              }}
            />
          </li>
        ))}
      </ol>
    </details>
  );
}
