import type { Metadata } from "next";
import { getSection } from "@/features/content/queries";
import { getPhoto } from "@/features/gallery/queries";
import { GiftExperience } from "@/features/gift/components/gift-experience";
import { youtubeId } from "@/features/song/youtube";
import { FACTS } from "@/content/facts";
import { people, requireMember } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Senin için" };

/**
 * The Gift. For Eln it is the first thing she meets; for Arda it is a preview
 * of exactly what she will see. Text and photo come from the Studio.
 */
export default async function GiftPage({ searchParams }: PageProps<"/gift">) {
  const session = await requireMember();
  const { from } = await searchParams;
  const [opening, song] = await Promise.all([getSection(session, "gift.opening"), getSection(session, "song")]);
  const photo = await getPhoto(session, opening.photoId);
  const { owner, partner } = people(session);
  const preview = session.role === "owner";

  return (
    <GiftExperience
      preview={preview}
      exitHref={preview && from === "studio" ? "/studio/opening" : "/"}
      content={{
        greeting: opening.greeting,
        headline: opening.headline,
        letter: opening.letter,
        signature: opening.signature,
        enterLabel: opening.enterLabel,
        photo: photo?.image ?? null,
        photoAlt: photo?.altText || photo?.caption || `${partner.fullName}`,
        cities: [owner.city, partner.city],
        song: { videoId: youtubeId(song.youtubeUrl), title: FACTS.song.title, artist: FACTS.song.artist },
      }}
    />
  );
}
