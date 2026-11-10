import "server-only";
import { listSpecialDays } from "@/features/days/queries";
import { whenText } from "@/features/days/when";
import { listLetters } from "@/features/letters/queries";
import { listMemories } from "@/features/story/queries";
import { memoryCategoryLabel, type StarTone } from "@/features/story/schema";
import type { Session } from "@/lib/auth/session";
import { formatDate, formatWithPrecision, parseISODate, todayIn } from "@/lib/dates";
import type { SignedImage } from "@/lib/media/server";

export type Star = {
  id: string;
  kind: "memory" | "letter" | "sealed" | "day";
  title: string;
  /** ISO date used for ordering along the spiral; null when unknown. */
  date: string | null;
  dateLabel: string;
  /** A short line shown when the star is opened. Never the body of a letter. */
  text: string;
  image: SignedImage | null;
  imageAlt: string;
  href: string | null;
  action: string;
  size: number;
  tone: StarTone;
  cluster: string;
  clusterLabel: string;
};

const excerpt = (text: string, max = 240) => (text.length > max ? `${text.slice(0, max).trimEnd()}…` : text);

/**
 * Everything that shines in the Memory Universe: memories, letters, the
 * special days. Each star is something that really exists on the site — the
 * sky is exactly as full as the story is.
 */
export async function listStars(session: Session): Promise<Star[]> {
  const [memories, letters, days] = await Promise.all([listMemories(session), listLetters(session), listSpecialDays(session)]);
  const tz = session.profile.timezone;

  const stars: Star[] = [];

  for (const memory of memories) {
    const date = parseISODate(memory.happenedOn);
    stars.push({
      id: `memory-${memory.id}`,
      kind: "memory",
      title: memory.title,
      date: memory.happenedOn,
      dateLabel: date ? formatWithPrecision(date, memory.datePrecision) : "",
      text: memory.summary || excerpt(memory.description),
      image: memory.cover?.image ?? null,
      imageAlt: memory.cover?.altText || memory.cover?.caption || memory.title,
      href: `/story/${memory.id}`,
      action: "Anıyı aç",
      size: memory.starSize,
      tone: memory.starTone,
      cluster: `memory-${memory.category}`,
      clusterLabel: memoryCategoryLabel(memory.category),
    });
  }

  for (const letter of letters.open) {
    const date = parseISODate(letter.writtenOn);
    stars.push({
      id: `letter-${letter.id}`,
      kind: "letter",
      title: letter.title,
      date: letter.writtenOn,
      dateLabel: date ? formatDate(date) : "",
      text: `${letter.authorName} yazdı.`,
      image: null,
      imageAlt: "",
      href: `/letters/${letter.id}`,
      action: "Zarfı aç",
      size: 2,
      tone: "pearl",
      cluster: "letters",
      clusterLabel: "Mektuplar",
    });
  }

  for (const letter of letters.sealed) {
    const opens = todayIn(tz, new Date(letter.unlockAt));
    stars.push({
      id: `sealed-${letter.id}`,
      kind: "sealed",
      title: letter.title,
      date: null,
      dateLabel: `${formatDate(opens)} günü açılacak`,
      text: "Mühürlü bir mektup. Günü gelince açılır.",
      image: null,
      imageAlt: "",
      href: null,
      action: "",
      size: 2,
      tone: "champagne",
      cluster: "letters",
      clusterLabel: "Mektuplar",
    });
  }

  for (const day of days) {
    const when = whenText(day);
    stars.push({
      id: `day-${day.id}`,
      kind: "day",
      title: day.title,
      date: null,
      dateLabel: when.dateText,
      text: [when.awayText, when.ordinal].filter(Boolean).join(" · "),
      image: null,
      imageAlt: "",
      href: `/days/${day.slug}`,
      action: "Günü aç",
      size: 3,
      tone: "gold",
      cluster: "days",
      clusterLabel: "Özel günler",
    });
  }

  return stars;
}
