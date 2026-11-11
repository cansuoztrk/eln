"use client";

import { Music2, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { youtubeEmbedUrl } from "@/features/song/youtube";

/**
 * The song is never started for anyone. This button appears only when a
 * YouTube link has been set, and the player — an official, privacy-enhanced
 * embed — is created only when it is pressed.
 */
export function MusicToggle({
  videoId,
  title,
  artist,
  tone = "dusk",
  className,
}: {
  videoId: string;
  title: string;
  artist: string;
  tone?: "dusk" | "day";
  className?: string;
}) {
  const [playing, setPlaying] = useState(false);

  if (!playing) {
    return (
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setPlaying(true);
        }}
        aria-label={`Şarkıyı aç: ${artist} — ${title}`}
        className={cn(
          "inline-flex h-10 items-center gap-2 rounded-full px-4 text-[13px] font-medium backdrop-blur transition-colors",
          tone === "dusk" ? "bg-pearl/10 text-pearl hover:bg-pearl/20" : "bg-ink/5 text-ink hover:bg-ink/10",
          className,
        )}
      >
        <Music2 className="size-4" aria-hidden="true" />
        Şarkımız
      </button>
    );
  }

  return (
    <div
      onClick={(event) => event.stopPropagation()}
      className={cn("w-64 overflow-hidden rounded-2xl border border-pearl/15 bg-night/80 shadow-lift backdrop-blur", className)}
    >
      <div className="flex items-center justify-between gap-2 px-3 py-2">
        <p className="min-w-0 truncate text-[12px] text-pearl/80">
          {artist} — {title}
        </p>
        <button
          type="button"
          onClick={() => setPlaying(false)}
          aria-label="Şarkıyı kapat"
          className="grid size-7 shrink-0 place-items-center rounded-full text-pearl/70 hover:bg-pearl/10 hover:text-pearl"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>
      <iframe
        src={youtubeEmbedUrl(videoId)}
        title={`${artist} — ${title}`}
        allow="autoplay; encrypted-media; picture-in-picture"
        referrerPolicy="no-referrer"
        className="aspect-video w-full"
      />
    </div>
  );
}
