import { z } from "zod";
import { FACTS } from "./facts";

/**
 * Editable site copy. Each section has a schema and defaults; whatever Arda
 * saves in the Studio is stored in `content_sections` and laid over them.
 *
 * Defaults are either Arda's own words (the opening note is the example he
 * wrote himself) or left empty. An empty field renders nothing — the site
 * never fills silence with invented sentiment.
 */

const text = (max: number) => z.string().trim().max(max);

export const SECTION_SCHEMAS = {
  /** The Gift — the first encounter. */
  "gift.opening": z.object({
    greeting: text(80),
    headline: text(200),
    letter: text(6000),
    signature: text(80),
    enterLabel: text(40),
    /** A real photo of Eln, chosen by Arda. Null → the photo scene is skipped. */
    photoId: z.uuid().nullable(),
  }),
  "home.hero": z.object({
    headline: text(200),
    note: text(600),
  }),
  "story.intro": z.object({ note: text(2000) }),
  /** The 166 days between meeting and becoming a couple. */
  "story.interlude": z.object({ note: text(4000) }),
  "distance.intro": z.object({ note: text(2000) }),
  /** The Day We Finally Meet. */
  "meeting.note": z.object({ note: text(4000) }),
  song: z.object({
    youtubeUrl: z.union([z.literal(""), z.url().max(300)]),
    spotifyUrl: z.union([z.literal(""), z.url().max(300)]),
    note: text(2000),
  }),
  /** Short sweet lines for Eln's Little World. Written by Arda. */
  "corner.messages": z.object({
    messages: z.array(text(240)).max(120),
  }),
} as const;

export type SectionKey = keyof typeof SECTION_SCHEMAS;
export type SectionData<K extends SectionKey> = z.infer<(typeof SECTION_SCHEMAS)[K]>;

export const SECTION_DEFAULTS: { [K in SectionKey]: SectionData<K> } = {
  "gift.opening": {
    greeting: "Eln,",
    headline: "Bu küçük dünyayı senin için hazırladım.",
    // Arda's own example text, word for word. He can replace it in the Studio.
    letter: [
      "Eln, bazen insanın anlatmak istediği çok fazla şey oluyor.",
      "Ben de bazılarını kelimelere, bazılarını fotoğraflara, bazılarını da küçük bir dünyaya dönüştürmek istedim.",
      "Burada sana ait bir köşe var.",
      "İstediğin zaman, istediğin kadar keşfedebilirsin.",
    ].join("\n\n"),
    signature: "Arda",
    enterLabel: "İçeri gir",
    photoId: null,
  },
  "home.hero": {
    headline: FACTS.tagline,
    note: "",
  },
  "story.intro": { note: "" },
  "story.interlude": { note: "" },
  "distance.intro": { note: "" },
  "meeting.note": { note: "" },
  song: { youtubeUrl: "", spotifyUrl: "", note: "" },
  "corner.messages": { messages: [] },
};

export const SECTION_KEYS = Object.keys(SECTION_SCHEMAS) as SectionKey[];

/** Lays stored data over the defaults and validates the result. */
export function resolveSection<K extends SectionKey>(key: K, stored: unknown): SectionData<K> {
  const defaults = SECTION_DEFAULTS[key];
  const merged = { ...defaults, ...(stored && typeof stored === "object" ? stored : {}) };
  const parsed = SECTION_SCHEMAS[key].safeParse(merged);
  return (parsed.success ? parsed.data : defaults) as SectionData<K>;
}
