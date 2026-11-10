import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { FACTS } from "@/content/facts";
import { WORLD_NAV } from "@/content/navigation";
import { resolveSection, SECTION_DEFAULTS, SECTION_KEYS, SECTION_SCHEMAS } from "@/content/sections";
import { STUDIO_NAV } from "@/content/studio-nav";
import { WRITTEN_DAYS, WRITTEN_LETTERS, WRITTEN_MEMORIES, WRITTEN_NOTES, WRITTEN_SECTIONS } from "@/content/writing";
import { parseTags, tagList } from "@/features/gallery/schema";
import { dateSchema } from "@/features/days/schema";
import { LETTER_CATEGORIES, letterSchema } from "@/features/letters/schema";
import { GOAL, NOTE_CATEGORIES, NOTE_MAX } from "@/features/reasons/schema";
import { spotifyEmbedUrl, youtubeEmbedUrl, youtubeId } from "@/features/song/youtube";
import { ablative, accusative, dative, genitive } from "@/lib/grammar";

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

const SOURCE = walk("src").filter((file) => /\.(ts|tsx|css)$/.test(file) && !file.endsWith("database.types.ts"));
const read = (file: string) => readFileSync(file, "utf8");

describe("the confirmed facts", () => {
  const date = (key: string) => FACTS.dates.find((d) => d.key === key)!;

  it("match what Arda confirmed", () => {
    expect(date("met")).toMatchObject({ day: 6, month: 12, year: 2025 });
    expect(date("together")).toMatchObject({ day: 21, month: 5, year: 2026 });
    expect(date("eln_birthday")).toMatchObject({ day: 23, month: 4, year: null, person: "partner" });
    expect(date("arda_birthday")).toMatchObject({ day: 7, month: 11, year: null, person: "owner" });
    expect(FACTS.owner).toMatchObject({ name: "Arda", city: "İstanbul", timezone: "Europe/Istanbul" });
    expect(FACTS.partner).toMatchObject({ name: "Eln", fullName: "Elnare", city: "Bakü", timezone: "Asia/Baku" });
    expect(FACTS.song).toMatchObject({ artist: "Onur Can Özcan", title: "Anılar Şarkısı" });
    // The official links, stored without share-tracking parameters.
    expect(youtubeId(FACTS.song.youtubeUrl)).toBe("bpMRUwYpNkM");
    expect(spotifyEmbedUrl(FACTS.song.spotifyUrl)).toBe("https://open.spotify.com/embed/track/4TJCZsX5VjPZwUfho4mknR");
    expect(FACTS.song.youtubeUrl + FACTS.song.spotifyUrl).not.toMatch(/[?&]si=/);
  });

  it("leave the first meeting undated and not yet happened", () => {
    expect(date("first_meeting")).toMatchObject({ day: null, month: null, year: null, happened: false, recursYearly: false });
  });

  it("seed only two memories, with a title and a date and nothing invented", () => {
    expect(FACTS.memories).toHaveLength(2);
    for (const memory of FACTS.memories) {
      expect(Object.keys(memory).sort()).toEqual(["category", "dateKey", "happenedOn", "sortOrder", "starSize", "starTone", "title"]);
    }
  });
});

describe("editable sections", () => {
  it("have defaults that satisfy their own schema", () => {
    for (const key of SECTION_KEYS) expect(SECTION_SCHEMAS[key].safeParse(SECTION_DEFAULTS[key]).success, key).toBe(true);
  });

  it("keep Arda's own four sentences inside the opening letter", () => {
    const letter = SECTION_DEFAULTS["gift.opening"].letter;
    for (const sentence of [
      "Eln, bazen insanın anlatmak istediği çok fazla şey oluyor.",
      "Ben de bazılarını kelimelere, bazılarını fotoğraflara, bazılarını da küçük bir dünyaya dönüştürmek istedim.",
      "Burada sana ait bir köşe var.",
      "İstediğin zaman, istediğin kadar keşfedebilirsin.",
    ]) {
      expect(letter, sentence).toContain(sentence);
    }
    expect(SECTION_DEFAULTS["gift.opening"].headline).toBe("Bu küçük dünyayı senin için hazırladım.");
    expect(SECTION_DEFAULTS["gift.opening"].photoId).toBeNull();
  });

  it("let Arda silence any passage by saving it empty", () => {
    expect(resolveSection("story.interlude", { note: "" }).note).toBe("");
    expect(resolveSection("corner.messages", { messages: [] }).messages).toEqual([]);
  });

  it("merge stored data over defaults and fall back when it is invalid", () => {
    expect(resolveSection("home.hero", { note: "x" })).toEqual({ headline: FACTS.tagline, note: "x" });
    expect(resolveSection("home.hero", null)).toEqual(SECTION_DEFAULTS["home.hero"]);
    expect(resolveSection("gift.opening", { photoId: "not-a-uuid" })).toEqual(SECTION_DEFAULTS["gift.opening"]);
  });
});

describe("the words written for Arda (src/content/writing.ts)", () => {
  const sections = [
    WRITTEN_SECTIONS.giftLetter,
    WRITTEN_SECTIONS.heroNote,
    WRITTEN_SECTIONS.storyIntro,
    WRITTEN_SECTIONS.storyInterlude,
    WRITTEN_SECTIONS.distanceIntro,
    WRITTEN_SECTIONS.meetingNote,
    WRITTEN_SECTIONS.songNote,
    ...WRITTEN_SECTIONS.cornerMessages,
  ];
  const memories = Object.values(WRITTEN_MEMORIES).flatMap((m) => [m.summary, m.description, m.specialNote]);
  const days = Object.values(WRITTEN_DAYS).flatMap((d) => [d.subtitle, d.intro]);
  const everything = [...sections, ...WRITTEN_LETTERS.flatMap((l) => [l.title, l.body]), ...WRITTEN_NOTES.map((n) => n.body), ...memories, ...days];
  const lower = (text: string) => text.toLocaleLowerCase("tr-TR");

  it("holds one note for every day of a year, none said twice", () => {
    expect(WRITTEN_NOTES).toHaveLength(GOAL);
    expect(new Set(WRITTEN_NOTES.map((n) => lower(n.body))).size).toBe(GOAL);
    const shelves = NOTE_CATEGORIES.map((c) => c.value as string);
    for (const note of WRITTEN_NOTES) {
      expect(shelves, note.body).toContain(note.category);
      expect(note.body.length, note.body).toBeLessThanOrEqual(NOTE_MAX);
      expect(note.body.trim(), note.body).toBe(note.body);
    }
    // Shelves take turns, so two days in a row never come from the same one.
    for (let i = 1; i < WRITTEN_NOTES.length; i++) expect(WRITTEN_NOTES[i].category === WRITTEN_NOTES[i - 1].category, `${i}`).toBe(false);
  });

  it("fits every letter to the shelves and limits the Studio enforces", () => {
    const shelves = LETTER_CATEGORIES.map((c) => c.value as string);
    expect(new Set(WRITTEN_LETTERS.map((l) => l.title)).size).toBe(WRITTEN_LETTERS.length);
    for (const letter of WRITTEN_LETTERS) {
      expect(shelves, letter.title).toContain(letter.category);
      expect(letterSchema.safeParse({ title: letter.title, body: letter.body, category: letter.category, envelopeStyle: letter.envelopeStyle, seal: letter.seal, fontStyle: "serif", writtenOn: "2026-11-10", unlockOn: "", publish: false }).success, letter.title).toBe(true);
    }
  });

  it("covers the two milestones and the four seeded special days", () => {
    expect(Object.keys(WRITTEN_MEMORIES).sort()).toEqual(FACTS.memories.map((m) => m.dateKey).sort());
    expect(Object.keys(WRITTEN_DAYS).sort()).toEqual(FACTS.specialDays.map((d) => d.slug).sort());
    for (const text of memories) expect(text.length).toBeGreaterThan(0);
  });

  it("asks for nothing and never pleads", () => {
    const pressure = [
      "sensiz yaşayamam", "beni asla bırakma", "bana dön", "affet", "özür", "sonsuza kadar benim", "benimsin", "söz ver", "cevap ver", "cevap yaz",
      "geri dön", "bırakıp gitme", "ne olur", "yalvar", "kırgın", "küs", "pişman", "hata yaptım", "seni bekliyorum", "haber ver", "neden yazmıyorsun",
    ];
    for (const text of everything) for (const phrase of pressure) expect(lower(text).includes(phrase), `"${phrase}" in: ${text.slice(0, 70)}`).toBe(false);
  });

  it("speaks only for Arda — never says what Eln feels, thinks or once said", () => {
    const claims = ["hissettiğini biliyorum", "beni sevdiğini", "özlediğini biliyorum", "demiştin", "söylemiştin", "yazmıştın", "anlatmıştın", "mesajında", "o gece", "ilk konuştuğumuz"];
    for (const text of everything) for (const phrase of claims) expect(lower(text).includes(phrase), `"${phrase}" in: ${text.slice(0, 70)}`).toBe(false);
  });

  it("claims nothing that is not known: no shared past in person, no voice, no call", () => {
    const unknown = ["sesini", "sesin ", "görüntülü", "aradığında", "telefonda konuş", "buluştuğumuz", "sarıldığımız", "el ele", "öptü"];
    for (const text of everything) for (const phrase of unknown) expect(lower(text).includes(phrase), `"${phrase}" in: ${text.slice(0, 70)}`).toBe(false);
  });

  it("writes no year, age or count by hand — numbers come from the facts", () => {
    const source = readFileSync("src/content/writing.ts", "utf8");
    const prose = source.slice(source.indexOf("export const WRITTEN_SECTIONS"));
    // Digits may appear only through the computed tokens (${GAP}, ${KM}, dates), never typed into a sentence.
    const typed = prose.replace(/\$\{[^}]+\}/g, "").match(/"[^"\n]*\d[^"\n]*"/g) ?? [];
    expect(typed).toEqual([]);
    expect(lower(everything.join(" "))).not.toMatch(/yaşında(sın|yım)|\d+ yaş/);
  });
});

describe("schemas", () => {
  it("clean tags", () => {
    expect(parseTags("bakü, #kış ,, gülüş\nilk")).toEqual(["bakü", "#kış", "gülüş", "ilk"]);
    expect(tagList.parse(["#Kış", " kış ", "", "İLK"])).toEqual(["kış", "ilk"]);
  });

  it("accept a date without a year and reject impossible days", () => {
    const base = { id: "3f2b8c1e-5d4a-4e6f-9a7b-1c2d3e4f5a6b", label: "x", note: "" };
    expect(dateSchema.safeParse({ ...base, day: 29, month: 2, year: "" }).success).toBe(true);
    expect(dateSchema.safeParse({ ...base, day: 29, month: 2, year: 2025 }).success).toBe(false);
    expect(dateSchema.safeParse({ ...base, day: 31, month: 4, year: null }).success).toBe(false);
    expect(dateSchema.safeParse({ ...base, day: "", month: "", year: "" }).success).toBe(true);
    expect(dateSchema.safeParse({ ...base, day: 5, month: "", year: "" }).success).toBe(false);
    expect(dateSchema.safeParse({ ...base, day: "", month: "", year: 2027 }).success).toBe(false);
  });

  it("require a title for a letter", () => {
    const letter = { title: " ", body: "", category: "say", writtenOn: "2026-11-10", fontStyle: "serif", envelopeStyle: "blush", seal: "heart", unlockOn: "", publish: false };
    expect(letterSchema.safeParse(letter).success).toBe(false);
    expect(letterSchema.safeParse({ ...letter, title: "Merhaba" }).success).toBe(true);
    expect(letterSchema.safeParse({ ...letter, title: "Merhaba", unlockOn: "23.04.2027" }).success).toBe(false);
  });

  it("read song links without trusting them", () => {
    expect(youtubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=3")).toBe("dQw4w9WgXcQ");
    expect(youtubeId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(youtubeId("https://music.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(youtubeId("https://evil.example/watch?v=dQw4w9WgXcQ")).toBeNull();
    expect(youtubeId("javascript:alert(1)")).toBeNull();
    expect(youtubeEmbedUrl("dQw4w9WgXcQ")).toContain("youtube-nocookie.com/embed/dQw4w9WgXcQ");
    expect(spotifyEmbedUrl("https://open.spotify.com/intl-tr/track/4cOdK2wGLETKBW3PvgPWqT?si=x")).toBe("https://open.spotify.com/embed/track/4cOdK2wGLETKBW3PvgPWqT");
    expect(spotifyEmbedUrl("https://spotify.evil.example/track/4cOdK2wGLETKBW3PvgPWqT")).toBeNull();
  });
});

describe("Turkish case endings", () => {
  it("follow vowel harmony for both names", () => {
    expect([genitive("Eln"), dative("Eln"), ablative("Eln"), accusative("Eln")]).toEqual(["Eln'in", "Eln'e", "Eln'den", "Eln'i"]);
    expect([genitive("Arda"), dative("Arda"), ablative("Arda"), accusative("Arda")]).toEqual(["Arda'nın", "Arda'ya", "Arda'dan", "Arda'yı"]);
    expect([genitive("Elnare"), ablative("Bakü"), ablative("İstanbul"), ablative("Mert")]).toEqual(["Elnare'nin", "Bakü'den", "İstanbul'dan", "Mert'ten"]);
  });
});

describe("rules the code must keep (see CLAUDE.md)", () => {
  it("never uses the forbidden, possessive phrases", () => {
    const forbidden = ["Sensiz yaşayamam", "Beni asla bırakma", "Bana dön", "Beni affetmek zorundasın", "Sonsuza kadar benim ol"];
    for (const file of SOURCE) {
      const text = read(file).toLocaleLowerCase("tr-TR");
      for (const phrase of forbidden) expect(text.includes(phrase.toLocaleLowerCase("tr-TR")), `${phrase} in ${file}`).toBe(false);
    }
  });

  it("never exposes a backend key to the browser", () => {
    for (const file of SOURCE) expect(/NEXT_PUBLIC_[A-Z_]*SUPABASE/.test(read(file)), file).toBe(false);
  });

  it("keeps the service-role client out of read queries and client components", () => {
    for (const file of SOURCE) {
      const text = read(file);
      if (!text.includes("createAdminClient")) continue;
      expect(text.includes('"use client"'), `${file} is a client component`).toBe(false);
      const allowed = ["src/lib/supabase/admin.ts", "src/lib/media/server.ts", "src/lib/security/rate-limit.ts", "src/features/auth/", "src/features/account/", "src/app/api/"];
      expect(allowed.some((prefix) => file.replaceAll("\\", "/").startsWith(prefix)), `${file} may not use the admin client`).toBe(true);
    }
  });

  it("loads nothing from third parties and tracks nothing", () => {
    const hosts = ["fonts.googleapis.com", "fonts.gstatic.com", "googletagmanager", "google-analytics", "plausible.io", "segment.com", "hotjar", "mixpanel"];
    for (const file of SOURCE) {
      const text = read(file);
      for (const host of hosts) expect(text.includes(host), `${host} in ${file}`).toBe(false);
    }
  });

  it("has no column anywhere that could record a read, a view or a visit", () => {
    const sql = walk("supabase/migrations").map(read).join("\n").toLowerCase();
    for (const column of ["read_at", "opened_at", "seen_at", "viewed_at", "last_seen", "last_visit", "view_count", "visit_count", "last_sign_in", "ip_address", "user_agent", "latitude", "longitude"]) {
      expect(sql.includes(column), column).toBe(false);
    }
  });

  it("backs up every table the migrations create", async () => {
    const sql = walk("supabase/migrations").map(read).join("\n");
    const created = [...sql.matchAll(/create table public\.([a-z_]+)/g)].map((m) => m[1]).sort();
    const { TABLES } = (await import("../../scripts/_env.mjs")) as { TABLES: string[] };
    expect([...TABLES].sort()).toEqual(created);
    // Parents must come before the rows that point at them.
    const before = (a: string, b: string) => TABLES.indexOf(a) < TABLES.indexOf(b);
    for (const [parent, child] of [["private_spaces", "profiles"], ["media_assets", "photos"], ["albums", "photos"], ["photos", "memory_photos"], ["memories", "memory_photos"], ["voice_memories", "memories"], ["letters", "special_day_editions"], ["time_capsules", "time_capsule_items"], ["questions", "answers"], ["daily_notes", "daily_note_schedule"], ["memories", "future_plans"]]) {
      expect(before(parent, child), `${parent} before ${child}`).toBe(true);
    }
  });

  it("never renders user text as HTML", () => {
    for (const file of SOURCE) expect(read(file).includes("dangerouslySetInnerHTML"), file).toBe(false);
  });

  it("links only to rooms and Studio screens that have a page", () => {
    const pages = new Set(walk("src/app").filter((f) => f.endsWith("page.tsx")).map((f) => f.replaceAll("\\", "/")));
    const has = (route: string, group: string) => pages.has(`src/app/${group}${route === "/" ? "" : route}/page.tsx`.replace("//", "/"));
    for (const room of WORLD_NAV) expect(has(room.href, "(world)"), room.href).toBe(true);
    for (const item of STUDIO_NAV.flatMap((g) => g.items)) expect(pages.has(`src/app${item.href}/page.tsx`), item.href).toBe(true);
  });
});
