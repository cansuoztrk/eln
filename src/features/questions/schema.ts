import { z } from "zod";

export const QUESTION_CATEGORIES = [
  { value: "know", label: "Birbirimizi ne kadar tanıyoruz?" },
  { value: "firsts", label: "İlk anılar" },
  { value: "future", label: "Gelecek hayalleri" },
  { value: "funny", label: "Komik sorular" },
  { value: "romantic", label: "Romantik sorular" },
  { value: "daily", label: "Günlük sorular" },
  { value: "prefer", label: "Tercihlerimiz" },
] as const;

export type QuestionCategory = (typeof QUESTION_CATEGORIES)[number]["value"];

const category = z.enum(QUESTION_CATEGORIES.map((c) => c.value) as [QuestionCategory, ...QuestionCategory[]]);

export const questionSchema = z.object({
  prompt: z.string().trim().min(3, "Bir soru yaz.").max(500),
  category,
  /** "Together": the other answer stays hidden until you have written yours. */
  together: z.boolean(),
});

export const answerSchema = z.object({
  questionId: z.uuid(),
  body: z.string().trim().min(1, "Bir cevap yaz.").max(8000),
});

/**
 * A starter set of questions — only questions. Nobody's answers, feelings or
 * memories are suggested; the answers are theirs to write, or not.
 */
export const STARTER_QUESTIONS: { category: QuestionCategory; prompt: string; together?: boolean }[] = [
  { category: "know", prompt: "En sevdiğim yemek sence ne?", together: true },
  { category: "know", prompt: "Beni en çok ne güldürür?", together: true },
  { category: "know", prompt: "Moralim bozukken bana en iyi ne gelir?", together: true },
  { category: "firsts", prompt: "İlk konuşmamızdan aklında kalan şey ne?" },
  { category: "firsts", prompt: "Bende ilk fark ettiğin şey neydi?" },
  { category: "firsts", prompt: "Bana ilk ne zaman güvendiğini hissettin?" },
  { category: "future", prompt: "Birlikte ilk gitmek istediğin yer neresi?" },
  { category: "future", prompt: "Beş yıl sonra nasıl bir hayat hayal ediyorsun?" },
  { category: "future", prompt: "Yan yana geçireceğimiz sıradan bir gün nasıl olurdu?" },
  { category: "funny", prompt: "İkimizden hangisi yolda daha çok kaybolur?", together: true },
  { category: "funny", prompt: "Benim en garip alışkanlığım sence hangisi?" },
  { category: "funny", prompt: "Bir hayvan olsaydım hangisi olurdum?", together: true },
  { category: "romantic", prompt: "Sana en iyi gelen küçük jest hangisi?" },
  { category: "romantic", prompt: "Hangi şarkı sana beni hatırlatıyor?" },
  { category: "romantic", prompt: "Birlikte izlemek istediğin gün batımı nerede?" },
  { category: "daily", prompt: "Bugün seni en çok ne yordu?" },
  { category: "daily", prompt: "Bugün seni gülümseten küçük şey neydi?" },
  { category: "daily", prompt: "Bu hafta kendin için ne yaptın?" },
  { category: "prefer", prompt: "Deniz mi, dağ mı?", together: true },
  { category: "prefer", prompt: "Sabah insanı mısın, gece insanı mı?", together: true },
  { category: "prefer", prompt: "Çay mı, kahve mi?", together: true },
];
