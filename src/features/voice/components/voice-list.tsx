"use client";

import { Pause, Play, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { Reveal } from "@/components/motion/reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Confirm } from "@/components/ui/confirm";
import { toast } from "@/components/ui/toast";
import { trashAction } from "@/features/trash/actions";
import { formatDate, parseISODate } from "@/lib/dates";
import { saveVoiceAction } from "../actions";
import type { Voice } from "../queries";
import { formatDuration } from "../schema";
import { Waveform } from "./waveform";

function VoiceCard({ voice }: { voice: Voice }) {
  const router = useRouter();
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [busy, start] = useTransition();
  const [loadedDuration, setLoadedDuration] = useState(0);
  const date = parseISODate(voice.recordedOn);
  const total = voice.durationMs / 1000 || loadedDuration;

  function toggle() {
    const element = audio.current;
    if (!element) return;
    if (element.paused) void element.play();
    else element.pause();
  }

  return (
    <article className="paper p-5 sm:p-7">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? `${voice.title}: duraklat` : `${voice.title}: oynat`}
          className="grid size-14 shrink-0 place-items-center rounded-full bg-ink text-pearl transition-transform duration-300 ease-soft hover:scale-105 active:scale-95"
        >
          {playing ? <Pause className="size-5" aria-hidden="true" /> : <Play className="ml-0.5 size-5" aria-hidden="true" />}
        </button>
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-display text-2xl text-ink">{voice.title}</h2>
          <p className="text-[12px] text-taupe">
            <span className={voice.authorRole === "owner" ? "text-rosegold" : "text-accent"}>{voice.authorName}</span>
            {date ? ` · ${formatDate(date)}` : ""}
          </p>
        </div>
        <span className="shrink-0 text-[13px] text-muted tabular-nums">
          {playing || position > 0 ? `${formatDuration(position * 1000)} / ` : ""}
          {formatDuration(voice.durationMs)}
        </span>
      </div>

      <button
        type="button"
        aria-label="Kayıtta ilerle"
        className="mt-5 block h-14 w-full"
        onClick={(event) => {
          const element = audio.current;
          if (!element || !total) return;
          const rect = event.currentTarget.getBoundingClientRect();
          element.currentTime = ((event.clientX - rect.left) / rect.width) * total;
        }}
      >
        <Waveform bars={voice.waveform} progress={total ? position / total : 0} className="h-full" />
      </button>
      {/* Loaded only when play is pressed. */}
      <audio
        ref={audio}
        src={voice.url}
        preload="none"
        onLoadedMetadata={(event) => setLoadedDuration(Number.isFinite(event.currentTarget.duration) ? event.currentTarget.duration : 0)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setPosition(0);
        }}
        onTimeUpdate={(event) => setPosition(event.currentTarget.currentTime)}
      />

      {voice.description ? <p className="prose-letter mt-4 text-[15px] leading-relaxed text-muted">{voice.description}</p> : null}

      {voice.mine ? (
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-3">
          <Badge tone={voice.status === "published" ? "live" : "draft"}>{voice.status === "published" ? "Paylaşıldı" : "Taslak"}</Badge>
          <Button
            size="sm"
            variant="ghost"
            disabled={busy}
            onClick={() =>
              start(async () => {
                const result = await saveVoiceAction({ id: voice.id, title: voice.title, description: voice.description, publish: voice.status !== "published" });
                toast(result.ok ? (result.message ?? "Kaydedildi.") : result.error, result.ok ? "ok" : "error");
                router.refresh();
              })
            }
          >
            {voice.status === "published" ? "Taslağa al" : "Paylaş"}
          </Button>
          <Confirm
            trigger={
              <Button size="icon-sm" variant="ghost" aria-label="Kaydı çöp kutusuna taşı" className="ml-auto text-taupe hover:text-[#8c3b3b]">
                <Trash2 aria-hidden="true" />
              </Button>
            }
            title="Ses kaydı çöp kutusuna taşınsın mı?"
            description="Sayfadan kalkar ama silinmez; çöp kutusundan geri alınabilir."
            confirmLabel="Çöp kutusuna taşı"
            onConfirm={async () => {
              const result = await trashAction("voice_memories", voice.id);
              toast(result.ok ? "Kayıt kaldırıldı." : result.error, result.ok ? "ok" : "error");
              router.refresh();
            }}
          />
        </div>
      ) : null}
    </article>
  );
}

export function VoiceList({ voices }: { voices: Voice[] }) {
  return (
    <ul className="space-y-5">
      {voices.map((voice, i) => (
        <li key={voice.id}>
          <Reveal delay={Math.min(i, 4) * 0.06}>
            <VoiceCard voice={voice} />
          </Reveal>
        </li>
      ))}
    </ul>
  );
}
