"use client";

import { Lock, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Confirm } from "@/components/ui/confirm";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { describedBy, Field, Input, Select, Textarea } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toast";
import type { RelationshipDate } from "@/features/dates/queries";
import { PhotoPicker } from "@/features/gallery/components/photo-picker";
import { trashAction } from "@/features/trash/actions";
import { formatDate, MONTHS_TR } from "@/lib/dates";
import type { ActionResult } from "@/lib/result";
import { useAction } from "@/lib/use-action";
import {
  createDayAction,
  deleteCustomDateAction,
  saveDateAction,
  saveEditionAction,
  saveSpecialDayAction,
  setHappenedAction,
} from "../actions";
import type { Edition, SpecialDay } from "../queries";
import { THEMES } from "../schema";

type Option = { id: string; title: string };
type Props = {
  dates: RelationshipDate[];
  days: SpecialDay[];
  editions: Edition[];
  letters: Option[];
  albums: Option[];
  /** Thumbnails for photos already chosen as covers. */
  thumbs: Record<string, string>;
  partnerName: string;
  /** The year of each day's next occurrence, for a sensible default. */
  nextYear: Record<string, number>;
};

function dateText(date: RelationshipDate): string {
  if (date.month === null || date.day === null) return "Tarihi henüz belli değil";
  return formatDate({ day: date.day, month: date.month, year: date.year });
}

function MonthSelect({ id, value, onChange, allowEmpty }: { id: string; value: string; onChange: (v: string) => void; allowEmpty?: boolean }) {
  return (
    <Select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
      {allowEmpty ? <option value="">—</option> : null}
      {MONTHS_TR.map((name, i) => (
        <option key={name} value={i + 1}>
          {name}
        </option>
      ))}
    </Select>
  );
}

/** Dates, the pages built around them, and each year's edition — all in one place. */
export function DaysStudio(props: Props) {
  const router = useRouter();
  const [dateDialog, setDateDialog] = useState<RelationshipDate | null>(null);
  const [dayDialog, setDayDialog] = useState<SpecialDay | null>(null);
  const [editionDialog, setEditionDialog] = useState<{ day: SpecialDay; edition: Edition | null } | null>(null);
  const [creating, setCreating] = useState(false);

  async function act(action: () => Promise<ActionResult<unknown>>) {
    const result = await action();
    toast(result.ok ? (result.message ?? "Kaydedildi.") : result.error, result.ok ? "ok" : "error");
    if (result.ok) router.refresh();
  }

  const close = () => {
    setDateDialog(null);
    setDayDialog(null);
    setEditionDialog(null);
    setCreating(false);
  };

  return (
    <div className="space-y-8">
      <section aria-labelledby="dates-title" className="paper p-5 sm:p-7">
        <div className="mb-2 flex items-center justify-between gap-3">
          <h2 id="dates-title" className="font-display text-2xl text-ink">
            Tarihler
          </h2>
          <Button variant="outline" size="sm" onClick={() => setCreating(true)}>
            <Plus aria-hidden="true" />
            Yeni özel gün
          </Button>
        </div>
        <p className="mb-5 max-w-2xl text-sm leading-relaxed text-muted">
          Sitedeki bütün sayaçlar ve yıldönümleri bu tarihlerden hesaplanır. Yılı bilinmeyen bir tarihte yaş ya da süre gösterilmez.
        </p>
        <ul className="divide-y divide-line">
          {props.dates.map((date) => (
            <li key={date.id} className="flex flex-wrap items-center justify-between gap-3 py-3.5">
              <div className="min-w-0">
                <p className="text-[15px] text-ink">{date.label}</p>
                <p className="mt-0.5 flex flex-wrap items-center gap-2 text-[13px] text-muted">
                  {dateText(date)}
                  {date.month !== null && date.year === null ? <Badge tone="gold">Yıl girilmedi</Badge> : null}
                  {date.kind === "future" ? <Badge tone={date.happened ? "live" : "draft"}>{date.happened ? "Gerçekleşti" : "Henüz olmadı"}</Badge> : null}
                </p>
              </div>
              <div className="flex items-center gap-1">
                {date.kind === "future" ? (
                  date.happened ? (
                    <Button variant="ghost" size="sm" onClick={() => act(() => setHappenedAction(date.id, false))}>
                      İşareti kaldır
                    </Button>
                  ) : (
                    <Confirm
                      trigger={
                        <Button variant="soft" size="sm" disabled={date.year === null}>
                          Buluşma gerçekleşti
                        </Button>
                      }
                      title="Buluşma gerçekleşti mi?"
                      description="Bunu yalnızca gerçekten buluştuysanız onayla. Onayladığında site ilk buluşmayı yaşanmış bir gün olarak gösterir."
                      confirmLabel="Evet, buluştuk"
                      onConfirm={() => act(() => setHappenedAction(date.id, true))}
                    />
                  )
                ) : null}
                <Button variant="ghost" size="icon-sm" aria-label={`${date.label}: düzenle`} onClick={() => setDateDialog(date)}>
                  <Pencil aria-hidden="true" />
                </Button>
                {date.kind === "custom" ? (
                  <Confirm
                    trigger={
                      <Button variant="ghost" size="icon-sm" aria-label={`${date.label}: sil`} className="text-taupe hover:text-[#8c3b3b]">
                        <Trash2 aria-hidden="true" />
                      </Button>
                    }
                    tone="danger"
                    title="Bu gün silinsin mi?"
                    description="Tarih, sayfası ve yıllık baskıları birlikte silinir. Bu işlem geri alınamaz."
                    confirmLabel="Kalıcı olarak sil"
                    onConfirm={() => act(() => deleteCustomDateAction(date.id))}
                  />
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {props.days.map((day) => {
        const own = props.editions.filter((e) => e.specialDayId === day.id);
        return (
          <section key={day.id} aria-label={day.title} className="paper p-5 sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-2xl text-ink">{day.title}</h2>
                <p className="mt-1 flex flex-wrap items-center gap-2 text-[13px] text-muted">
                  {dateText(day.date)}
                  <Badge tone={day.status === "published" ? "live" : "draft"}>{day.status === "published" ? "Yayında" : "Taslak"}</Badge>
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setDayDialog(day)}>
                  <Pencil aria-hidden="true" />
                  Sayfayı düzenle
                </Button>
                <Button variant="soft" size="sm" onClick={() => setEditionDialog({ day, edition: null })}>
                  <Plus aria-hidden="true" />
                  Yıl baskısı
                </Button>
              </div>
            </div>
            {own.length > 0 ? (
              <ul className="mt-5 divide-y divide-line border-t border-line">
                {own.map((edition) => (
                  <li key={edition.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <button type="button" onClick={() => setEditionDialog({ day, edition })} className="min-w-0 text-left hover:text-accent">
                      <span className="font-display text-xl text-ink tabular-nums">{edition.year}</span>
                      <span className="ml-3 text-[14px] text-muted">{edition.title || "Başlıksız"}</span>
                    </button>
                    <span className="flex items-center gap-1.5">
                      {edition.revealAt && new Date(edition.revealAt) > new Date() ? (
                        <Badge tone="sealed">
                          <Lock className="size-3" aria-hidden="true" />
                          Gününde açılacak
                        </Badge>
                      ) : null}
                      <Badge tone={edition.status === "published" ? "live" : "draft"}>{edition.status === "published" ? "Yayında" : "Taslak"}</Badge>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-[13px] text-muted">Bu gün için henüz yıl baskısı yok.</p>
            )}
          </section>
        );
      })}

      {dateDialog ? <DateDialog key={dateDialog.id} date={dateDialog} onClose={close} /> : null}
      {creating ? <NewDayDialog onClose={close} /> : null}
      {dayDialog ? <DayDialog key={dayDialog.id} day={dayDialog} thumb={dayDialog.coverPhotoId ? props.thumbs[dayDialog.coverPhotoId] : undefined} onClose={close} /> : null}
      {editionDialog ? (
        <EditionDialog
          key={editionDialog.edition?.id ?? `new-${editionDialog.day.id}`}
          day={editionDialog.day}
          edition={editionDialog.edition}
          defaultYear={props.nextYear[editionDialog.day.id] ?? new Date().getFullYear()}
          letters={props.letters}
          albums={props.albums}
          thumbs={props.thumbs}
          partnerName={props.partnerName}
          onClose={close}
        />
      ) : null}
    </div>
  );
}

function DateDialog({ date, onClose }: { date: RelationshipDate; onClose: () => void }) {
  const router = useRouter();
  const [form, setForm] = useState({
    label: date.label,
    day: date.day?.toString() ?? "",
    month: date.month?.toString() ?? "",
    year: date.year?.toString() ?? "",
    note: date.note,
  });
  const { run, pending, fieldErrors } = useAction(saveDateAction, {
    onSuccess: () => {
      onClose();
      router.refresh();
    },
  });
  const set = (key: keyof typeof form) => (value: string) => setForm((f) => ({ ...f, [key]: value }));
  const unplanned = date.kind === "future";

  function submit(event: FormEvent) {
    event.preventDefault();
    run({ id: date.id, ...form });
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        size="sm"
        title={date.label}
        description={
          unplanned
            ? "Tarih belli olana kadar boş bırak: site geri saymaz ve buluşmayı olmuş gibi göstermez."
            : "Bu tarih değişirse sitedeki bütün sayaçlar buna göre yeniden hesaplanır."
        }
      >
        <form method="post" onSubmit={submit} noValidate className="space-y-4">
          <Field htmlFor="d-label" label="Ad" error={fieldErrors.label}>
            <Input {...describedBy("d-label", fieldErrors.label)} value={form.label} maxLength={120} onChange={(e) => set("label")(e.target.value)} />
          </Field>
          <div className="grid grid-cols-[1fr_1.4fr_1.1fr] gap-3">
            <Field htmlFor="d-day" label="Gün" error={fieldErrors.day}>
              <Input {...describedBy("d-day", fieldErrors.day)} inputMode="numeric" value={form.day} onChange={(e) => set("day")(e.target.value.replace(/\D/g, "").slice(0, 2))} />
            </Field>
            <Field htmlFor="d-month" label="Ay" error={fieldErrors.month}>
              <MonthSelect id="d-month" value={form.month} onChange={set("month")} allowEmpty={unplanned} />
            </Field>
            <Field htmlFor="d-year" label="Yıl" error={fieldErrors.year}>
              <Input {...describedBy("d-year", fieldErrors.year)} inputMode="numeric" placeholder="—" value={form.year} onChange={(e) => set("year")(e.target.value.replace(/\D/g, "").slice(0, 4))} />
            </Field>
          </div>
          <p className="text-[13px] leading-snug text-muted">Yıl bilinmiyorsa boş bırak. Yılsız bir tarihte yaş ya da geçen süre hesaplanmaz.</p>
          <Field htmlFor="d-note" label="Not" optional error={fieldErrors.note}>
            <Textarea {...describedBy("d-note", fieldErrors.note)} rows={2} className="min-h-20" value={form.note} maxLength={2000} onChange={(e) => set("note")(e.target.value)} />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={onClose}>
              Vazgeç
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Spinner /> : null}
              Kaydet
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function NewDayDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [form, setForm] = useState({ label: "", day: "", month: "1", year: "", recursYearly: true });
  const { run, pending, fieldErrors } = useAction(createDayAction, {
    onSuccess: () => {
      onClose();
      router.refresh();
    },
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    run(form);
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="sm" title="Yeni özel gün" description="Kendi belirlediğin bir gün. Sayfası taslak olarak açılır.">
        <form method="post" onSubmit={submit} noValidate className="space-y-4">
          <Field htmlFor="n-label" label="Ad" error={fieldErrors.label}>
            <Input {...describedBy("n-label", fieldErrors.label)} value={form.label} maxLength={120} required onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} />
          </Field>
          <div className="grid grid-cols-[1fr_1.4fr_1.1fr] gap-3">
            <Field htmlFor="n-day" label="Gün" error={fieldErrors.day}>
              <Input {...describedBy("n-day", fieldErrors.day)} inputMode="numeric" value={form.day} onChange={(e) => setForm((f) => ({ ...f, day: e.target.value.replace(/\D/g, "").slice(0, 2) }))} />
            </Field>
            <Field htmlFor="n-month" label="Ay">
              <MonthSelect id="n-month" value={form.month} onChange={(v) => setForm((f) => ({ ...f, month: v }))} />
            </Field>
            <Field htmlFor="n-year" label="Yıl" error={fieldErrors.year}>
              <Input {...describedBy("n-year", fieldErrors.year)} inputMode="numeric" placeholder="—" value={form.year} onChange={(e) => setForm((f) => ({ ...f, year: e.target.value.replace(/\D/g, "").slice(0, 4) }))} />
            </Field>
          </div>
          <label className="flex items-center justify-between gap-4 text-[14px] text-ink-soft">
            Her yıl tekrarlansın
            <Switch checked={form.recursYearly} onCheckedChange={(v) => setForm((f) => ({ ...f, recursYearly: v }))} />
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={onClose}>
              Vazgeç
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Spinner /> : null}
              Ekle
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CoverField({ value, thumb, onChange }: { value: string | null; thumb?: string; onChange: (id: string | null, thumb: string | null) => void }) {
  return (
    <div>
      <p className="mb-2 text-[13px] font-medium text-ink-soft">Kapak fotoğrafı</p>
      <div className="flex items-center gap-3">
        <div className="size-16 shrink-0 overflow-hidden rounded-lg bg-beige">
          {value && thumb ? (
            // eslint-disable-next-line @next/next/no-img-element -- signed thumbnail
            <img src={thumb} alt="" className="size-full object-cover" />
          ) : null}
        </div>
        <PhotoPicker title="Kapak fotoğrafını seç" value={value ? [value] : []} onChange={(ids, photos) => onChange(ids[0] ?? null, photos[0]?.image.thumb ?? null)} />
        {value ? (
          <Button variant="ghost" size="sm" onClick={() => onChange(null, null)}>
            Kaldır
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function DayDialog({ day, thumb, onClose }: { day: SpecialDay; thumb?: string; onClose: () => void }) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: day.title,
    subtitle: day.subtitle,
    intro: day.intro,
    theme: day.theme,
    coverPhotoId: day.coverPhotoId,
    showCountdown: day.showCountdown,
  });
  const [coverThumb, setCoverThumb] = useState(thumb ?? null);
  const { run, pending, fieldErrors } = useAction(saveSpecialDayAction, {
    onSuccess: () => {
      onClose();
      router.refresh();
    },
  });
  const save = (publish: boolean) => (event?: FormEvent) => {
    event?.preventDefault();
    run({ id: day.id, ...form, publish });
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent title="Özel gün sayfası" description={dateText(day.date)}>
        <form method="post" onSubmit={save(day.status === "published")} noValidate className="space-y-4">
          <Field htmlFor="s-title" label="Başlık" error={fieldErrors.title}>
            <Input {...describedBy("s-title", fieldErrors.title)} value={form.title} maxLength={120} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          </Field>
          <Field htmlFor="s-subtitle" label="Alt başlık" optional error={fieldErrors.subtitle}>
            <Input {...describedBy("s-subtitle", fieldErrors.subtitle)} value={form.subtitle} maxLength={240} onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))} />
          </Field>
          <Field htmlFor="s-intro" label="Giriş yazısı" optional hint="Her yıl aynı kalan, bu güne dair yazı. Yıla özel olanı baskıya yaz." error={fieldErrors.intro}>
            <Textarea {...describedBy("s-intro", fieldErrors.intro, true)} rows={4} value={form.intro} maxLength={4000} onChange={(e) => setForm((f) => ({ ...f, intro: e.target.value }))} />
          </Field>
          <Field htmlFor="s-theme" label="Görünüm">
            <Select id="s-theme" value={form.theme} onChange={(e) => setForm((f) => ({ ...f, theme: e.target.value as SpecialDay["theme"] }))}>
              {THEMES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
          </Field>
          <CoverField
            value={form.coverPhotoId}
            thumb={coverThumb ?? undefined}
            onChange={(id, next) => {
              setForm((f) => ({ ...f, coverPhotoId: id }));
              setCoverThumb(next);
            }}
          />
          <label className="flex items-center justify-between gap-4 text-[14px] text-ink-soft">
            Geri sayım göster
            <Switch checked={form.showCountdown} onCheckedChange={(v) => setForm((f) => ({ ...f, showCountdown: v }))} />
          </label>
          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <Button variant="outline" onClick={save(false)} disabled={pending}>
              Taslak kaydet
            </Button>
            <Button variant="accent" onClick={save(true)} disabled={pending}>
              {pending ? <Spinner /> : null}
              Yayımla
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditionDialog({
  day,
  edition,
  defaultYear,
  letters,
  albums,
  thumbs,
  partnerName,
  onClose,
}: {
  day: SpecialDay;
  edition: Edition | null;
  defaultYear: number;
  letters: Option[];
  albums: Option[];
  thumbs: Record<string, string>;
  partnerName: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    year: String(edition?.year ?? defaultYear),
    title: edition?.title ?? "",
    note: edition?.note ?? "",
    coverPhotoId: edition?.coverPhotoId ?? null,
    letterId: edition?.letterId ?? "",
    albumId: edition?.albumId ?? "",
    revealOnDay: Boolean(edition?.revealAt),
  });
  const [coverThumb, setCoverThumb] = useState<string | null>(edition?.coverPhotoId ? (thumbs[edition.coverPhotoId] ?? null) : null);
  const { run, pending, fieldErrors } = useAction(saveEditionAction, {
    onSuccess: () => {
      onClose();
      router.refresh();
    },
  });
  const save = (publish: boolean) => (event?: FormEvent) => {
    event?.preventDefault();
    run({ id: edition?.id, specialDayId: day.id, ...form, letterId: form.letterId || null, albumId: form.albumId || null, publish });
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent title={`${day.title} — yıl baskısı`} description="Her yıl için ayrı bir not, fotoğraf ya da mektup hazırlayabilirsin.">
        <form method="post" onSubmit={save(edition?.status === "published")} noValidate className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-[7rem_1fr]">
            <Field htmlFor="e-year" label="Yıl" error={fieldErrors.year}>
              <Input {...describedBy("e-year", fieldErrors.year)} inputMode="numeric" value={form.year} onChange={(e) => setForm((f) => ({ ...f, year: e.target.value.replace(/\D/g, "").slice(0, 4) }))} />
            </Field>
            <Field htmlFor="e-title" label="Başlık" optional error={fieldErrors.title}>
              <Input {...describedBy("e-title", fieldErrors.title)} value={form.title} maxLength={160} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            </Field>
          </div>
          <Field htmlFor="e-note" label="Kişisel not" optional error={fieldErrors.note}>
            <Textarea {...describedBy("e-note", fieldErrors.note)} rows={7} className="font-display text-[17px] leading-[1.8]" value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} />
          </Field>
          <CoverField
            value={form.coverPhotoId}
            thumb={coverThumb ?? undefined}
            onChange={(id, next) => {
              setForm((f) => ({ ...f, coverPhotoId: id }));
              setCoverThumb(next);
            }}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field htmlFor="e-letter" label="Mektup" optional>
              <Select id="e-letter" value={form.letterId} onChange={(e) => setForm((f) => ({ ...f, letterId: e.target.value }))}>
                <option value="">Yok</option>
                {letters.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.title}
                  </option>
                ))}
              </Select>
            </Field>
            <Field htmlFor="e-album" label="Albüm" optional>
              <Select id="e-album" value={form.albumId} onChange={(e) => setForm((f) => ({ ...f, albumId: e.target.value }))}>
                <option value="">Yok</option>
                {albums.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.title}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <label className="flex items-start justify-between gap-4 rounded-xl bg-plum/5 p-4 text-[14px] text-ink-soft">
            <span>
              <span className="block font-medium text-ink">Gününde açılsın</span>
              <span className="mt-0.5 block text-[13px] leading-snug text-muted">
                Yayımlasan bile {partnerName} o gün başlayana kadar yalnızca bir sürprizin beklediğini görür; içeriği göremez.
              </span>
            </span>
            <Switch checked={form.revealOnDay} onCheckedChange={(v) => setForm((f) => ({ ...f, revealOnDay: v }))} />
          </label>
          <div className="flex flex-wrap items-center gap-2 pt-2">
            {edition ? (
              <Confirm
                trigger={
                  <Button variant="ghost" size="icon" className="text-taupe hover:text-[#8c3b3b]" aria-label="Çöp kutusuna taşı">
                    <Trash2 aria-hidden="true" />
                  </Button>
                }
                title="Baskı çöp kutusuna taşınsın mı?"
                description="Sayfadan kalkar ama silinmez; çöp kutusundan geri alabilirsin."
                confirmLabel="Çöp kutusuna taşı"
                onConfirm={async () => {
                  const result = await trashAction("special_day_editions", edition.id);
                  toast(result.ok ? (result.message ?? "Taşındı.") : result.error, result.ok ? "ok" : "error");
                  if (result.ok) {
                    onClose();
                    router.refresh();
                  }
                }}
              />
            ) : null}
            <span className="ml-auto flex gap-2">
              <Button variant="outline" onClick={save(false)} disabled={pending}>
                Taslak kaydet
              </Button>
              <Button variant="accent" onClick={save(true)} disabled={pending}>
                {pending ? <Spinner /> : null}
                Yayımla
              </Button>
            </span>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
