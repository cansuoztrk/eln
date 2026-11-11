"use client";

import { Check, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { Sparkle } from "@/components/decor";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { Confirm } from "@/components/ui/confirm";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { describedBy, Field, Input, Select, Textarea } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toast";
import { trashAction } from "@/features/trash/actions";
import { cn } from "@/lib/cn";
import { formatDate, parseISODate } from "@/lib/dates";
import type { ActionResult } from "@/lib/result";
import { useAction } from "@/lib/use-action";
import { completePlanAction, savePlanAction, setPlanStateAction } from "../actions";
import type { Plan } from "../queries";
import { PLAN_CATEGORIES, STATE_LABEL, type PlanCategory } from "../schema";

const STATE_STYLE = {
  dream: "border-line-strong text-muted",
  planned: "border-gold/60 bg-champagne/40 text-[#6f5527]",
  done: "border-transparent bg-[#e3efe4] text-[#3f6b46]",
} as const;

/** The list of dreams, shelf by shelf. Either of them may add to it or change it. */
export function FutureBoard({ plans, memoryBase }: { plans: Plan[]; memoryBase: string }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Plan | "new" | null>(null);
  const [completing, setCompleting] = useState<Plan | null>(null);
  const [busy, start] = useTransition();

  function run(action: () => Promise<ActionResult<unknown>>) {
    start(async () => {
      const result = await action();
      toast(result.ok ? (result.message ?? "Kaydedildi.") : result.error, result.ok ? "ok" : "error");
      if (result.ok) router.refresh();
    });
  }

  const shelves = PLAN_CATEGORIES.map((c) => ({ ...c, plans: plans.filter((p) => p.category === c.value) })).filter((s) => s.plans.length > 0);

  return (
    <div className="space-y-16">
      <div className="flex justify-center">
        <Button variant="accent" size="lg" onClick={() => setEditing("new")}>
          <Plus aria-hidden="true" />
          Bir hayal ekle
        </Button>
      </div>

      {shelves.map((shelf) => (
        <section key={shelf.value} aria-labelledby={`shelf-${shelf.value}`}>
          <Reveal>
            <h2 id={`shelf-${shelf.value}`} className="font-display text-display-sm italic">
              {shelf.label}
            </h2>
          </Reveal>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {shelf.plans.map((plan) => {
              const target = parseISODate(plan.targetDate);
              const completed = parseISODate(plan.completedOn);
              return (
                <li key={plan.id} className={cn("paper flex flex-col gap-4 p-6", plan.state === "done" && "bg-[#f6faf5]")}>
                  <div className="flex items-start justify-between gap-3">
                    <h3 className={cn("font-display text-2xl leading-snug text-ink", plan.state === "done" && "text-ink-soft")}>{plan.title}</h3>
                    <span className={cn("shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-medium", STATE_STYLE[plan.state])}>{STATE_LABEL[plan.state]}</span>
                  </div>
                  {plan.description ? <p className="prose-letter text-[15px] leading-relaxed text-muted">{plan.description}</p> : null}
                  <p className="text-[12px] text-taupe">
                    {plan.authorName} ekledi
                    {plan.state === "done" && completed ? ` · ${formatDate(completed)} günü gerçekleşti` : target ? ` · ${formatDate(target)}` : ""}
                  </p>
                  <div className="mt-auto flex flex-wrap items-center gap-1.5 border-t border-line pt-3">
                    {plan.state === "dream" ? (
                      <Button size="sm" variant="soft" disabled={busy} onClick={() => run(() => setPlanStateAction(plan.id, "planned"))}>
                        Planlandı
                      </Button>
                    ) : null}
                    {plan.state === "planned" ? (
                      <Button size="sm" variant="ghost" disabled={busy} onClick={() => run(() => setPlanStateAction(plan.id, "dream"))}>
                        Hayale geri al
                      </Button>
                    ) : null}
                    {plan.state !== "done" ? (
                      <Button size="sm" variant="outline" disabled={busy} onClick={() => setCompleting(plan)}>
                        <Check aria-hidden="true" />
                        Gerçekleşti
                      </Button>
                    ) : plan.memoryId ? (
                      <Link href={`${memoryBase}${plan.memoryId}`} className="text-[13px] font-medium text-accent underline-offset-4 hover:underline">
                        Anısına git
                      </Link>
                    ) : (
                      <Button size="sm" variant="ghost" disabled={busy} onClick={() => run(() => setPlanStateAction(plan.id, "planned"))}>
                        İşareti geri al
                      </Button>
                    )}
                    <span className="ml-auto flex">
                      <Button size="icon-sm" variant="ghost" aria-label={`${plan.title}: düzenle`} onClick={() => setEditing(plan)}>
                        <Pencil aria-hidden="true" />
                      </Button>
                      {plan.mine ? (
                        <Confirm
                          trigger={
                            <Button size="icon-sm" variant="ghost" aria-label={`${plan.title}: çöp kutusuna taşı`} className="text-taupe hover:text-[#8c3b3b]">
                              <Trash2 aria-hidden="true" />
                            </Button>
                          }
                          title="Bu hayal listeden kaldırılsın mı?"
                          description="Çöp kutusuna taşınır; istersen geri alabilirsin."
                          confirmLabel="Kaldır"
                          onConfirm={() => run(() => trashAction("future_plans", plan.id))}
                        />
                      ) : null}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      {editing ? <PlanDialog key={editing === "new" ? "new" : editing.id} plan={editing === "new" ? null : editing} onClose={() => setEditing(null)} /> : null}
      {completing ? <CompleteDialog key={completing.id} plan={completing} onClose={() => setCompleting(null)} /> : null}
    </div>
  );
}

function PlanDialog({ plan, onClose }: { plan: Plan | null; onClose: () => void }) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: plan?.title ?? "",
    description: plan?.description ?? "",
    category: (plan?.category ?? "dream") as PlanCategory,
    targetDate: plan?.targetDate ?? "",
  });
  const { run, pending, fieldErrors } = useAction(savePlanAction, {
    onSuccess: () => {
      onClose();
      router.refresh();
    },
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    run({ id: plan?.id, ...form });
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="sm" title={plan ? "Hayali düzenle" : "Yeni bir hayal"}>
        <form method="post" onSubmit={submit} noValidate className="space-y-4">
          <Field htmlFor="f-title" label="Ne yapmak istiyoruz?" error={fieldErrors.title}>
            <Input {...describedBy("f-title", fieldErrors.title)} value={form.title} maxLength={160} required onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          </Field>
          <Field htmlFor="f-description" label="Biraz daha" optional error={fieldErrors.description}>
            <Textarea {...describedBy("f-description", fieldErrors.description)} rows={3} className="min-h-24" value={form.description} maxLength={4000} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </Field>
          <Field htmlFor="f-category" label="Raf">
            <Select id="f-category" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as PlanCategory }))}>
              {PLAN_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field htmlFor="f-date" label="Tarih" optional hint="Yalnızca gerçekten kararlaştırılmış bir gün varsa." error={fieldErrors.targetDate}>
            <Input {...describedBy("f-date", fieldErrors.targetDate, true)} type="date" value={form.targetDate} onChange={(e) => setForm((f) => ({ ...f, targetDate: e.target.value }))} />
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

function CompleteDialog({ plan, onClose }: { plan: Plan; onClose: () => void }) {
  const router = useRouter();
  const [asMemory, setAsMemory] = useState(true);
  const { run, pending } = useAction(completePlanAction, {
    onSuccess: () => {
      onClose();
      router.refresh();
    },
  });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="sm" title="Gerçekten oldu mu?" description="Bunu yalnızca hayal gerçekten yaşandıysa onayla.">
        <div className="rounded-2xl bg-accent-wash p-5 text-center">
          <Sparkle className="mx-auto mb-3 size-4 text-rose" />
          <p className="font-display text-2xl text-ink">{plan.title}</p>
        </div>
        <label className="mt-5 flex items-start justify-between gap-4 text-[14px] text-ink-soft">
          <span>
            <span className="block font-medium text-ink">Anı olarak da başlat</span>
            <span className="mt-0.5 block text-[13px] leading-snug text-muted">Bugünün tarihiyle bir taslak anı açılır; ne olduğunu sen yazarsın.</span>
          </span>
          <Switch checked={asMemory} onCheckedChange={setAsMemory} />
        </label>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Henüz değil
          </Button>
          <Button variant="accent" disabled={pending} onClick={() => run({ id: plan.id, confirmed: true, asMemory })}>
            {pending ? <Spinner /> : null}
            Evet, gerçekleşti
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
