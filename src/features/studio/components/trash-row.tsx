"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Confirm } from "@/components/ui/confirm";
import { toast } from "@/components/ui/toast";
import { purgeAction, restoreAction } from "@/features/trash/actions";

export function TrashRowActions({ table, id }: { table: string; id: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const act = (action: typeof restoreAction) =>
    start(async () => {
      const result = await action(table, id);
      toast(result.ok ? (result.message ?? "Tamam.") : result.error, result.ok ? "ok" : "error");
      router.refresh();
    });

  return (
    <div className="flex shrink-0 gap-1">
      <Button variant="soft" size="sm" disabled={pending} onClick={() => act(restoreAction)}>
        Geri al
      </Button>
      <Confirm
        trigger={
          <Button variant="ghost" size="sm" disabled={pending} className="text-[#8c3b3b]">
            Kalıcı sil
          </Button>
        }
        tone="danger"
        title="Kalıcı olarak silinsin mi?"
        description="Bu işlem geri alınamaz. Dosyası varsa o da depodan silinir."
        confirmLabel="Kalıcı olarak sil"
        onConfirm={() => act(purgeAction)}
      />
    </div>
  );
}
