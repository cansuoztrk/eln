"use client";

import { Paperclip, Pencil, Plus, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Confirm } from "@/components/ui/confirm";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { describedBy, Field, Input, Select, Textarea } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { trashAction } from "@/features/trash/actions";
import { AUDIO_TYPES, IMAGE_TYPES } from "@/lib/media/rules";
import { uploadFile } from "@/lib/media/upload-client";
import { useAction } from "@/lib/use-action";
import { saveCapsuleAction } from "../actions";
import type { Capsule } from "../queries";
import { COVER_STYLES, type CoverStyle } from "../schema";
import { CapsuleArt } from "./capsule-art";

type Row = { capsule: Capsule; unlockDay: string; unlockLabel: string };

/** Where capsules are prepared and sealed. */
export function CapsuleStudio({ rows, partnerName, tomorrow }: { rows: Row[]; partnerName: string; tomorrow: string }) {
  const [editing, setEditing] = useState<Row | "new" | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button variant="accent" onClick={() => setEditing("new")}>
          <Plus aria-hidden="true" />
          Yeni kapsül
        </Button>
      </div>
      {rows.length === 0 ? (
        <div className="paper">
          <EmptyState art={<div className="w-36"><CapsuleArt style="rose" sealed /></div>} title="Henüz kapsül yok">
            Gelecekteki bir güne bir mektup, birkaç fotoğraf ya da bir ses kaydı bırakabilirsin.
          </EmptyState>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((row) => (
            <li key={row.capsule.id} className="paper flex items-center gap-4 p-5">
              <div className="w-24 shrink-0">
                <CapsuleArt style={row.capsule.coverStyle} sealed={!row.capsule.open} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-2xl text-ink">{row.capsule.title}</p>
                <p className="mt-1 text-[13px] text-muted">{row.unlockLabel}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Badge tone={row.capsule.status === "published" ? "live" : "draft"}>{row.capsule.status === "published" ? "Mühürlendi" : "Taslak"}</Badge>
                  {row.capsule.open ? <Badge tone="gold">Açıldı</Badge> : null}
                </div>
              </div>
              <Button variant="ghost" size="icon-sm" aria-label={`${row.capsule.title}: düzenle`} onClick={() => setEditing(row)}>
                <Pencil aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      )}
      {editing ? <CapsuleDialog key={editing === "new" ? "new" : editing.capsule.id} row={editing === "new" ? null : editing} partnerName={partnerName} tomorrow={tomorrow} onClose={() => setEditing(null)} /> : null}
    </div>
  );
}

function CapsuleDialog({ row, partnerName, tomorrow, onClose }: { row: Row | null; partnerName: string; tomorrow: string; onClose: () => void }) {
  const router = useRouter();
  const capsule = row?.capsule ?? null;
  const [form, setForm] = useState({
    title: capsule?.title ?? "",
    message: capsule?.message ?? "",
    note: capsule?.note ?? "",
    videoUrl: capsule?.videoUrl ?? "",
    coverStyle: (capsule?.coverStyle ?? "rose") as CoverStyle,
    unlockOn: row?.unlockDay ?? "",
  });
  const [files, setFiles] = useState<{ assetId: string; label: string }[]>([
    ...(capsule?.images ?? []).map((item, i) => ({ assetId: item.assetId, label: `Fotoğraf ${i + 1}` })),
    ...(capsule?.audio ?? []).map((item, i) => ({ assetId: item.assetId, label: `Ses kaydı ${i + 1}` })),
  ]);
  const [uploading, setUploading] = useState(false);
  const { run, pending, fieldErrors } = useAction(saveCapsuleAction, {
    onSuccess: () => {
      onClose();
      router.refresh();
    },
  });

  async function attach(list: FileList | null) {
    if (!list?.length) return;
    setUploading(true);
    for (const file of Array.from(list)) {
      const kind = file.type.startsWith("audio/") ? "audio" : "image";
      const result = await uploadFile(kind, file);
      if (result.ok) setFiles((current) => [...current, { assetId: result.assetId, label: file.name }]);
      else toast(`${file.name}: ${result.error}`, "error");
    }
    setUploading(false);
  }

  const save = (publish: boolean) => (event?: FormEvent) => {
    event?.preventDefault();
    run({ id: capsule?.id, ...form, assetIds: files.map((f) => f.assetId), publish });
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="lg" title={capsule ? "Kapsülü düzenle" : "Yeni zaman kapsülü"} description={`Yayımladığın andan açılacağı güne kadar ${partnerName} yalnızca kapsülün adını ve tarihini görür.`}>
        <form method="post" onSubmit={save(capsule?.status === "published")} noValidate className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-[1fr_11rem]">
            <Field htmlFor="c-title" label="Ad" hint="Kilitliyken de görünür; sürprizi burada verme." error={fieldErrors.title}>
              <Input {...describedBy("c-title", fieldErrors.title, true)} value={form.title} maxLength={160} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            </Field>
            <Field htmlFor="c-unlock" label="Açılacağı gün" error={fieldErrors.unlockOn}>
              <Input {...describedBy("c-unlock", fieldErrors.unlockOn)} type="date" min={capsule ? undefined : tomorrow} value={form.unlockOn} onChange={(e) => setForm((f) => ({ ...f, unlockOn: e.target.value }))} />
            </Field>
          </div>
          <Field htmlFor="c-message" label="Mektup" optional error={fieldErrors.message}>
            <Textarea {...describedBy("c-message", fieldErrors.message)} rows={8} className="font-display text-[18px] leading-[1.8]" value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} />
          </Field>
          <Field htmlFor="c-note" label="Özel not" optional hint="Mektubun altında, el yazısıyla görünür." error={fieldErrors.note}>
            <Textarea {...describedBy("c-note", fieldErrors.note, true)} rows={2} className="min-h-20 font-hand text-2xl" value={form.note} maxLength={2000} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field htmlFor="c-video" label="Video bağlantısı" optional hint="Video siteye yüklenmez; bağlantı olarak açılır." error={fieldErrors.videoUrl}>
              <Input {...describedBy("c-video", fieldErrors.videoUrl, true)} type="url" inputMode="url" placeholder="https://…" value={form.videoUrl} onChange={(e) => setForm((f) => ({ ...f, videoUrl: e.target.value }))} />
            </Field>
            <Field htmlFor="c-cover" label="Kapak">
              <Select id="c-cover" value={form.coverStyle} onChange={(e) => setForm((f) => ({ ...f, coverStyle: e.target.value as CoverStyle }))}>
                {COVER_STYLES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div>
            <p className="mb-2 text-[13px] font-medium text-ink-soft">Fotoğraf ve ses</p>
            <label className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full border border-line-strong px-5 text-sm font-medium text-ink transition-colors hover:border-accent hover:text-accent">
              {uploading ? <Spinner /> : <Paperclip className="size-4" aria-hidden="true" />}
              Dosya ekle
              <input type="file" multiple accept={[...IMAGE_TYPES, ...AUDIO_TYPES].join(",")} disabled={uploading} className="sr-only" onChange={(e) => { void attach(e.target.files); e.target.value = ""; }} />
            </label>
            {files.length > 0 ? (
              <ul className="mt-3 flex flex-wrap gap-2" aria-live="polite">
                {files.map((file) => (
                  <li key={file.assetId} className="inline-flex items-center gap-1.5 rounded-full bg-beige py-1 pr-1.5 pl-3 text-[13px] text-ink-soft">
                    <span className="max-w-40 truncate">{file.label}</span>
                    <button type="button" onClick={() => setFiles((current) => current.filter((f) => f.assetId !== file.assetId))} aria-label={`${file.label}: çıkar`} className="grid size-6 place-items-center rounded-full hover:bg-nude">
                      <X className="size-3.5" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
            <p className="mt-2 text-[12px] text-muted">Bu dosyalar da kapsülle birlikte mühürlenir; gün gelmeden erişilemez.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2">
            {capsule ? (
              <Confirm
                trigger={
                  <Button variant="ghost" size="icon" className="text-taupe hover:text-[#8c3b3b]" aria-label="Çöp kutusuna taşı">
                    <Trash2 aria-hidden="true" />
                  </Button>
                }
                title="Kapsül çöp kutusuna taşınsın mı?"
                description="Listeden kalkar ama silinmez; çöp kutusundan geri alabilirsin."
                confirmLabel="Çöp kutusuna taşı"
                onConfirm={async () => {
                  const result = await trashAction("time_capsules", capsule.id);
                  toast(result.ok ? (result.message ?? "Taşındı.") : result.error, result.ok ? "ok" : "error");
                  if (result.ok) {
                    onClose();
                    router.refresh();
                  }
                }}
              />
            ) : null}
            <span className="ml-auto flex gap-2">
              <Button variant="outline" onClick={save(false)} disabled={pending || uploading}>
                Taslak kaydet
              </Button>
              <Button variant="accent" onClick={save(true)} disabled={pending || uploading}>
                {pending ? <Spinner /> : null}
                Mühürle
              </Button>
            </span>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
