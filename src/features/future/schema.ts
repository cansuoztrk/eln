import { z } from "zod";

export const PLAN_CATEGORIES = [
  { value: "meeting", label: "İlk buluşmamız" },
  { value: "places", label: "Birlikte gitmek istediğimiz yerler" },
  { value: "birthdays", label: "Birlikte kutlayacağımız doğum günleri" },
  { value: "films", label: "İzlemek istediğimiz filmler" },
  { value: "songs", label: "Birlikte dinlemek istediğimiz şarkılar" },
  { value: "activities", label: "Yapmak istediğimiz etkinlikler" },
  { value: "food", label: "Birlikte yemek istediğimiz şeyler" },
  { value: "goals", label: "Gelecek hedefleri" },
  { value: "dream", label: "Küçük hayaller" },
] as const;

export type PlanCategory = (typeof PLAN_CATEGORIES)[number]["value"];
export type PlanState = "dream" | "planned" | "done";

export const STATE_LABEL: Record<PlanState, string> = { dream: "Hayalimiz", planned: "Planlandı", done: "Gerçekleşti" };

export const planSchema = z.object({
  id: z.uuid().optional(),
  title: z.string().trim().min(1, "Bir başlık yaz.").max(160),
  description: z.string().trim().max(4000),
  category: z.enum(PLAN_CATEGORIES.map((c) => c.value) as [PlanCategory, ...PlanCategory[]]),
  /** Optional. Left empty unless a real date has been agreed. */
  targetDate: z.union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Geçerli bir tarih seç.")]),
});

export type PlanInput = z.input<typeof planSchema>;
