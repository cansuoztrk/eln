"use client";

import { Plus, Trash2, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { Confirm } from "@/components/ui/confirm";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { describedBy, Field, Select, Textarea } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toast";
import { trashAction } from "@/features/trash/actions";
import { cn } from "@/lib/cn";
import { useAction } from "@/lib/use-action";
import { addQuestionAction, addStarterQuestionsAction, saveAnswerAction } from "../actions";
import type { QuestionCard } from "../queries";
import { QUESTION_CATEGORIES, type QuestionCategory } from "../schema";

/** Question cards for two. No score, no timer, no need to answer at all. */
export function Questions({ questions, myName, otherName }: { questions: QuestionCard[]; myName: string; otherName: string }) {
  const router = useRouter();
  const [category, setCategory] = useState<QuestionCategory | "all">("all");
  const [adding, setAdding] = useState(false);
  const [busy, start] = useTransition();

  const used = QUESTION_CATEGORIES.filter((c) => questions.some((q) => q.category === c.value));
  const shown = questions.filter((q) => category === "all" || q.category === category);

  function importStarter() {
    start(async () => {
      const result = await addStarterQuestionsAction();
      toast(result.ok ? (result.message ?? "Eklendi.") : result.error, result.ok ? "ok" : "error");
      router.refresh();
    });
  }

  return (
    <div className="space-y-12">
      <div className="flex flex-wrap justify-center gap-2">
        <Button variant="accent" onClick={() => setAdding(true)}>
          <Plus aria-hidden="true" />
          Soru ekle
        </Button>
        <Button variant="outline" onClick={importStarter} disabled={busy}>
          {busy ? <Spinner /> : null}
          Başlangıç sorularını ekle
        </Button>
      </div>

      {used.length > 1 ? (
        <nav aria-label="Soru kategorileri" className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 sm:mx-0 sm:flex-wrap sm:justify-center sm:px-0">
          {[{ value: "all" as const, label: "Hepsi" }, ...used].map((c) => (
            <button
              key={c.value}
              type="button"
              aria-pressed={category === c.value}
              onClick={() => setCategory(c.value)}
              className={cn("h-9 shrink-0 rounded-full px-4 text-[13px] whitespace-nowrap transition-colors", category === c.value ? "bg-ink text-pearl" : "border border-line-strong text-ink-soft hover:border-accent hover:text-accent")}
            >
              {c.label}
            </button>
          ))}
        </nav>
      ) : null}

      <ul className="grid gap-6 md:grid-cols-2">
        {shown.map((question, i) => (
          <li key={question.id}>
            <Reveal delay={(i % 2) * 0.08} className="h-full">
              <QuestionCardView question={question} myName={myName} otherName={otherName} />
            </Reveal>
          </li>
        ))}
      </ul>

      {adding ? <AddDialog onClose={() => setAdding(false)} /> : null}
    </div>
  );
}

function QuestionCardView({ question, myName, otherName }: { question: QuestionCard; myName: string; otherName: string }) {
  const router = useRouter();
  const [body, setBody] = useState(question.myAnswer?.body ?? "");
  const [editing, setEditing] = useState(!question.myAnswer);
  const { run, pending, fieldErrors } = useAction(saveAnswerAction, {
    onSuccess: () => {
      setEditing(false);
      router.refresh();
    },
  });
  const id = `answer-${question.id}`;

  function submit(event: FormEvent) {
    event.preventDefault();
    run({ questionId: question.id, body });
  }

  return (
    <article className="paper flex h-full flex-col p-6 sm:p-7">
      <header className="flex items-start justify-between gap-3">
        <p className="eyebrow text-[10px]">{QUESTION_CATEGORIES.find((c) => c.value === question.category)?.label ?? "Soru"}</p>
        <span className="flex items-center gap-1">
          {question.together ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-accent-wash px-2 py-0.5 text-[11px] font-medium text-accent" title="Önce sen yaz, sonra diğer cevap görünür">
              <Users className="size-3" aria-hidden="true" />
              Birlikte
            </span>
          ) : null}
          {question.mine ? (
            <Confirm
              trigger={
                <button type="button" aria-label="Soruyu kaldır" className="grid size-7 place-items-center rounded-full text-taupe/70 hover:bg-beige hover:text-[#8c3b3b]">
                  <Trash2 className="size-3.5" aria-hidden="true" />
                </button>
              }
              title="Soru kaldırılsın mı?"
              description="Soru ve cevapları sayfadan kalkar; çöp kutusundan geri alınabilir."
              confirmLabel="Kaldır"
              onConfirm={async () => {
                const result = await trashAction("questions", question.id);
                toast(result.ok ? "Soru kaldırıldı." : result.error, result.ok ? "ok" : "error");
                router.refresh();
              }}
            />
          ) : null}
        </span>
      </header>
      <h2 className="mt-3 font-display text-3xl leading-snug text-ink">{question.prompt}</h2>

      <div className="mt-6 space-y-5">
        <div>
          <p className="text-[12px] font-medium tracking-wide text-taupe">{myName}</p>
          {editing ? (
            <form method="post" onSubmit={submit} noValidate className="mt-2 space-y-2">
              <Field htmlFor={id} label={<span className="sr-only">Cevabın</span>} error={fieldErrors.body}>
                <Textarea {...describedBy(id, fieldErrors.body)} rows={3} className="min-h-24 font-display text-[18px]" value={body} maxLength={8000} placeholder="İstersen yaz…" onChange={(e) => setBody(e.target.value)} />
              </Field>
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={pending || body.trim().length === 0}>
                  {pending ? <Spinner /> : null}
                  Kaydet
                </Button>
                {question.myAnswer ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setBody(question.myAnswer!.body);
                      setEditing(false);
                    }}
                  >
                    Vazgeç
                  </Button>
                ) : null}
              </div>
            </form>
          ) : (
            <button type="button" onClick={() => setEditing(true)} className="prose-letter mt-1 block text-left font-display text-xl leading-relaxed text-ink-soft hover:text-accent" title="Düzenlemek için dokun">
              {question.myAnswer?.body}
            </button>
          )}
        </div>

        <div className="border-t border-line pt-4">
          <p className="text-[12px] font-medium tracking-wide text-taupe">{otherName}</p>
          {question.theirAnswer ? (
            <p className="prose-letter mt-1 font-display text-xl leading-relaxed text-ink-soft">{question.theirAnswer}</p>
          ) : (
            <p className="mt-1 text-[14px] text-muted">
              {question.together && !question.myAnswer ? `Bu bir "birlikte" sorusu: sen yazdıktan sonra ${otherName}'in cevabı (varsa) görünür.` : "Henüz bir cevap yok."}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}

function AddDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [category, setCategory] = useState<QuestionCategory>("daily");
  const [together, setTogether] = useState(false);
  const { run, pending, fieldErrors } = useAction(addQuestionAction, {
    onSuccess: () => {
      onClose();
      router.refresh();
    },
  });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="sm" title="Yeni soru">
        <form
          method="post"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            run({ prompt, category, together });
          }}
          className="space-y-4"
        >
          <Field htmlFor="q-prompt" label="Soru" error={fieldErrors.prompt}>
            <Textarea {...describedBy("q-prompt", fieldErrors.prompt)} rows={2} className="min-h-20" value={prompt} maxLength={500} onChange={(e) => setPrompt(e.target.value)} />
          </Field>
          <Field htmlFor="q-category" label="Kategori">
            <Select id="q-category" value={category} onChange={(e) => setCategory(e.target.value as QuestionCategory)}>
              {QUESTION_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </Select>
          </Field>
          <label className="flex items-start justify-between gap-4 text-[14px] text-ink-soft">
            <span>
              <span className="block font-medium text-ink">Birlikte oyna</span>
              <span className="mt-0.5 block text-[13px] leading-snug text-muted">Diğer cevap, sen kendi cevabını yazana kadar görünmez.</span>
            </span>
            <Switch checked={together} onCheckedChange={setTogether} />
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
