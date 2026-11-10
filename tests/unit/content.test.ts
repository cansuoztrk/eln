import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { FACTS } from "@/content/facts";
import { WORLD_NAV } from "@/content/navigation";
import { resolveSection, SECTION_DEFAULTS, SECTION_KEYS, SECTION_SCHEMAS } from "@/content/sections";
import { STUDIO_NAV } from "@/content/studio-nav";
import { parseTags, tagList } from "@/features/gallery/schema";
import { dateSchema } from "@/features/days/schema";
import { letterSchema } from "@/features/letters/schema";
import { spotifyEmbedUrl, youtubeEmbedUrl, youtubeId } from "@/features/song/youtube";

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
    expect(FACTS.song).toEqual({ artist: "Onur Can Özcan", title: "Anılar Şarkısı" });
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

  it("open the gift with Arda's own four sentences", () => {
    expect(SECTION_DEFAULTS["gift.opening"].letter.split("\n\n")).toEqual([
      "Eln, bazen insanın anlatmak istediği çok fazla şey oluyor.",
      "Ben de bazılarını kelimelere, bazılarını fotoğraflara, bazılarını da küçük bir dünyaya dönüştürmek istedim.",
      "Burada sana ait bir köşe var.",
      "İstediğin zaman, istediğin kadar keşfedebilirsin.",
    ]);
    expect(SECTION_DEFAULTS["gift.opening"].headline).toBe("Bu küçük dünyayı senin için hazırladım.");
    expect(SECTION_DEFAULTS["gift.opening"].photoId).toBeNull();
  });

  it("leave every other piece of copy empty rather than invent it", () => {
    for (const key of ["story.intro", "story.interlude", "distance.intro", "meeting.note"] as const) {
      expect(SECTION_DEFAULTS[key].note).toBe("");
    }
    expect(SECTION_DEFAULTS.song).toEqual({ youtubeUrl: "", spotifyUrl: "", note: "" });
    expect(SECTION_DEFAULTS["corner.messages"].messages).toEqual([]);
  });

  it("merge stored data over defaults and fall back when it is invalid", () => {
    expect(resolveSection("home.hero", { note: "x" })).toEqual({ headline: FACTS.tagline, note: "x" });
    expect(resolveSection("home.hero", null)).toEqual(SECTION_DEFAULTS["home.hero"]);
    expect(resolveSection("gift.opening", { photoId: "not-a-uuid" })).toEqual(SECTION_DEFAULTS["gift.opening"]);
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
