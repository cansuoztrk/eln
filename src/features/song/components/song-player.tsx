"use client";

import { ExternalLink, Pause, Play, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { youtubeEmbedUrl } from "../youtube";

type Props = {
  title: string;
  artist: string;
  youtubeVideoId: string | null;
  spotifyEmbed: string | null;
  youtubeUrl: string | null;
  spotifyUrl: string | null;
};

const YT_ORIGIN = "https://www.youtube-nocookie.com";

/** A record drawn for this page: no cover art is borrowed from anywhere. */
function Record({ spinning, title, artist }: { spinning: boolean; title: string; artist: string }) {
  return (
    <svg
      viewBox="0 0 240 240"
      role="img"
      aria-label={`${artist} — ${title}`}
      className={cn("size-full drop-shadow-[0_24px_40px_rgb(0_0_0/0.45)]", spinning && "animate-[spin_9s_linear_infinite]")}
    >
      <circle cx="120" cy="120" r="118" fill="#1b1316" />
      {[104, 92, 80, 68].map((r) => (
        <circle key={r} cx="120" cy="120" r={r} fill="none" stroke="rgb(255 253 250 / 0.07)" strokeWidth="1" />
      ))}
      <path d="M120 2a118 118 0 0 1 100 56" fill="none" stroke="rgb(255 253 250 / 0.12)" strokeWidth="14" strokeLinecap="round" opacity=".5" />
      <circle cx="120" cy="120" r="50" fill="#f3c9d1" />
      <circle cx="120" cy="120" r="50" fill="none" stroke="#9c5565" strokeWidth="1" />
      <path id="record-arc" d="M82 120a38 38 0 0 1 76 0" fill="none" />
      <text fontFamily="var(--font-sans)" fontSize="7.5" letterSpacing="2.4" fill="#9c5565">
        <textPath href="#record-arc" startOffset="50%" textAnchor="middle">
          {artist.toLocaleUpperCase("tr-TR")}
        </textPath>
      </text>
      <text x="120" y="141" textAnchor="middle" fontFamily="var(--font-display)" fontStyle="italic" fontSize="12" fill="#4a3b37">
        {title}
      </text>
      <circle cx="120" cy="120" r="4" fill="#1b1316" />
    </svg>
  );
}

/**
 * "Anılar". Nothing is hosted here and nothing plays by itself: the
 * official embed is created only when play is pressed. With a YouTube link the
 * page's own controls drive the embed; with only a Spotify link the official
 * Spotify player is shown; with neither, the card simply links out.
 */
export function SongPlayer({ title, artist, youtubeVideoId, spotifyEmbed, youtubeUrl, spotifyUrl }: Props) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(80);
  const mode = youtubeVideoId ? "youtube" : spotifyEmbed ? "spotify" : "links";

  const command = (func: string, args: unknown[] = []) =>
    frame.current?.contentWindow?.postMessage(JSON.stringify({ event: "command", func, args }), YT_ORIGIN);

  // Follow the embed's own state so the button and the record never lie.
  useEffect(() => {
    if (!started || mode !== "youtube") return;
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== YT_ORIGIN || typeof event.data !== "string") return;
      try {
        const data = JSON.parse(event.data) as { info?: { playerState?: number } };
        const state = data.info?.playerState;
        if (state === 1) setPlaying(true);
        if (state === 2 || state === 0) setPlaying(false);
      } catch {
        // Not a player message.
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [started, mode]);

  function onFrameLoad() {
    frame.current?.contentWindow?.postMessage(JSON.stringify({ event: "listening", id: "elnare-song" }), YT_ORIGIN);
    command("setVolume", [volume]);
  }

  function toggle() {
    if (!started) {
      setStarted(true);
      setPlaying(true);
      return;
    }
    command(playing ? "pauseVideo" : "playVideo");
    setPlaying(!playing);
  }

  const search = encodeURIComponent(`${artist} ${title}`);

  return (
    <div className="grid items-center gap-12 md:grid-cols-2 md:gap-16">
      <div className="mx-auto w-full max-w-sm">
        <div className="aspect-square">
          <Record spinning={playing} title={title} artist={artist} />
        </div>
      </div>

      <div className="text-center md:text-left">
        <p className="eyebrow">Our Song</p>
        <h1 className="mt-4 font-display text-display leading-none italic">{title}</h1>
        <p className="mt-4 font-display text-2xl text-pearl/80">{artist}</p>

        {mode === "youtube" ? (
          <>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-5 md:justify-start">
              <button
                type="button"
                onClick={toggle}
                aria-label={playing ? "Duraklat" : "Oynat"}
                className="grid size-16 place-items-center rounded-full bg-pearl text-ink shadow-lift transition-transform duration-300 ease-soft hover:scale-105 active:scale-95"
              >
                {playing ? <Pause className="size-6" aria-hidden="true" /> : <Play className="ml-1 size-6" aria-hidden="true" />}
              </button>

              {/* A decorative pulse: the page cannot hear the embed, so this only shows whether it is playing. */}
              <div aria-hidden="true" className="flex h-10 items-center gap-[3px]">
                {Array.from({ length: 22 }, (_, i) => (
                  <span
                    key={i}
                    className={cn("w-[3px] rounded-full bg-powder/80", playing && "animate-[breathe_1.2s_ease-in-out_infinite]")}
                    style={{ height: `${28 + ((i * 37) % 62)}%`, animationDelay: `${(i % 7) * 0.12}s`, opacity: playing ? 1 : 0.35 }}
                  />
                ))}
              </div>

              {started ? (
                <label className="flex items-center gap-2 text-pearl/70">
                  <Volume2 className="size-4" aria-hidden="true" />
                  <span className="sr-only">Ses düzeyi</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={volume}
                    onChange={(event) => {
                      const next = Number(event.target.value);
                      setVolume(next);
                      command("setVolume", [next]);
                    }}
                    className="w-28 accent-[#f3c9d1]"
                  />
                </label>
              ) : null}
            </div>
            {started && youtubeVideoId ? (
              <div className="mx-auto mt-8 max-w-md overflow-hidden rounded-2xl border border-pearl/15 md:mx-0">
                <iframe
                  ref={frame}
                  onLoad={onFrameLoad}
                  src={`${youtubeEmbedUrl(youtubeVideoId)}&enablejsapi=1`}
                  title={`${artist} — ${title}`}
                  allow="autoplay; encrypted-media; picture-in-picture"
                  referrerPolicy="no-referrer"
                  className="aspect-video w-full"
                />
              </div>
            ) : (
              <p className="mt-6 text-[13px] text-pearl/55">Şarkı kendiliğinden başlamaz. Oynat&apos;a bastığında resmî YouTube oynatıcısı açılır.</p>
            )}
          </>
        ) : null}

        {mode === "spotify" && spotifyEmbed ? (
          started ? (
            <iframe
              src={spotifyEmbed}
              title={`${artist} — ${title} (Spotify)`}
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              className="mx-auto mt-9 h-[152px] w-full max-w-md rounded-2xl md:mx-0"
            />
          ) : (
            <div className="mt-9">
              <Button variant="light" size="lg" onClick={() => setStarted(true)}>
                <Play aria-hidden="true" />
                Spotify oynatıcısını aç
              </Button>
              <p className="mt-4 text-[13px] text-pearl/55">Bastığında resmî Spotify oynatıcısı yüklenir.</p>
            </div>
          )
        ) : null}

        <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-[13px] md:justify-start">
          {[
            ["YouTube", youtubeUrl ?? `https://www.youtube.com/results?search_query=${search}`, Boolean(youtubeUrl)],
            ["Spotify", spotifyUrl ?? `https://open.spotify.com/search/${search}`, Boolean(spotifyUrl)],
          ].map(([name, href, exact]) => (
            <a
              key={name as string}
              href={href as string}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-champagne/90 underline-offset-4 hover:underline"
            >
              {exact ? `${name}'da aç` : `${name}'da ara`}
              <ExternalLink className="size-3.5" aria-hidden="true" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
