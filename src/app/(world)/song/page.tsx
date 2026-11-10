import type { Metadata } from "next";
import { OwnerHint } from "@/components/layout/owner-hint";
import { Reveal } from "@/components/motion/reveal";
import { StarField } from "@/components/motion/star-field";
import { FACTS } from "@/content/facts";
import { getSection } from "@/features/content/queries";
import { SongPlayer } from "@/features/song/components/song-player";
import { spotifyEmbedUrl, youtubeId } from "@/features/song/youtube";
import { people, requireMember } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Şarkımız" };

export default async function SongPage() {
  const session = await requireMember();
  const song = await getSection(session, "song");
  const { owner } = people(session);
  const videoId = youtubeId(song.youtubeUrl);
  const spotify = spotifyEmbedUrl(song.spotifyUrl);

  return (
    <>
      <section className="dusk relative flex min-h-[100svh] items-center overflow-hidden py-28 md:py-36">
        <StarField tone="dusk" density={0.8} />
        <div className="shell relative">
          <SongPlayer
            title={FACTS.song.title}
            artist={FACTS.song.artist}
            youtubeVideoId={videoId}
            spotifyEmbed={spotify}
            youtubeUrl={videoId ? song.youtubeUrl : null}
            spotifyUrl={spotify ? song.spotifyUrl : null}
          />
        </div>
      </section>

      {song.note ? (
        <section className="shell-narrow py-20 text-center md:py-28">
          <Reveal>
            <p className="prose-letter font-display text-2xl leading-[1.75] text-ink-soft">{song.note}</p>
            <p className="mt-6 font-hand text-3xl text-accent">— {owner.name}</p>
          </Reveal>
        </section>
      ) : null}

      {session.role === "owner" && !videoId && !spotify ? (
        <div className="shell py-12">
          <OwnerHint href="/studio/texts" label="Bağlantıyı ekle">
            Şarkının resmî YouTube ya da Spotify bağlantısını eklediğinde burada oynatıcı açılır. Şimdilik yalnızca arama
            bağlantıları var.
          </OwnerHint>
        </div>
      ) : null}
    </>
  );
}
