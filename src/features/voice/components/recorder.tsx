"use client";

import { Mic, RotateCcw, Square } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { uploadFile } from "@/lib/media/upload-client";
import { saveVoiceAction } from "../actions";
import { formatDuration, MAX_RECORDING_MS, WAVEFORM_BARS } from "../schema";
import { Waveform } from "./waveform";

type Stage = "idle" | "recording" | "review" | "saving";

/** Squeezes any number of level samples into a fixed number of bars, normalised to 0..1. */
function toBars(levels: number[]): number[] {
  if (levels.length === 0) return [];
  const bars = Array.from({ length: WAVEFORM_BARS }, (_, i) => {
    const from = Math.floor((i / WAVEFORM_BARS) * levels.length);
    const to = Math.max(from + 1, Math.floor(((i + 1) / WAVEFORM_BARS) * levels.length));
    return Math.max(...levels.slice(from, to));
  });
  const peak = Math.max(...bars, 0.01);
  return bars.map((v) => Math.round((v / peak) * 100) / 100);
}

/**
 * Records a voice memory. The microphone is asked for only when "Kaydı
 * başlat" is pressed, and it is released the moment recording stops.
 */
export function Recorder() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [bars, setBars] = useState<number[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  const media = useRef<{ recorder: MediaRecorder; stream: MediaStream; audio: AudioContext; timer: number } | null>(null);
  const blob = useRef<Blob | null>(null);
  const levels = useRef<number[]>([]);
  const startedAt = useRef(0);

  const release = () => {
    if (!media.current) return;
    window.clearInterval(media.current.timer);
    media.current.stream.getTracks().forEach((track) => track.stop());
    void media.current.audio.close();
    media.current = null;
  };

  // Leaving the page always lets go of the microphone.
  useEffect(() => release, []);
  useEffect(() => () => void (previewUrl && URL.revokeObjectURL(previewUrl)), [previewUrl]);

  async function start() {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("Bu tarayıcı ses kaydını desteklemiyor.");
      return;
    }
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError("Mikrofona izin verilmedi. Kaydetmek istersen tarayıcının izin ayarından açabilirsin.");
      return;
    }

    const mimeType = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find((type) => MediaRecorder.isTypeSupported(type));
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    const chunks: Blob[] = [];
    recorder.ondataavailable = (event) => event.data.size > 0 && chunks.push(event.data);
    recorder.onstop = () => {
      blob.current = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
      setBars(toBars(levels.current));
      setPreviewUrl(URL.createObjectURL(blob.current));
      setStage("review");
    };

    const audio = new AudioContext();
    const analyser = audio.createAnalyser();
    analyser.fftSize = 512;
    audio.createMediaStreamSource(stream).connect(analyser);
    const samples = new Uint8Array(analyser.fftSize);
    levels.current = [];
    startedAt.current = performance.now();

    const timer = window.setInterval(() => {
      analyser.getByteTimeDomainData(samples);
      let peak = 0;
      for (const sample of samples) peak = Math.max(peak, Math.abs(sample - 128) / 128);
      levels.current.push(peak);
      setBars(toBars(levels.current.slice(-WAVEFORM_BARS)));
      const now = performance.now() - startedAt.current;
      setElapsed(now);
      if (now >= MAX_RECORDING_MS) stop();
    }, 90);

    media.current = { recorder, stream, audio, timer };
    recorder.start();
    setElapsed(0);
    setStage("recording");
  }

  function stop() {
    const current = media.current;
    if (!current) return;
    setElapsed(performance.now() - startedAt.current);
    if (current.recorder.state !== "inactive") current.recorder.stop();
    release();
  }

  function discard() {
    blob.current = null;
    setPreviewUrl(null);
    setBars([]);
    setElapsed(0);
    setTitle("");
    setDescription("");
    setStage("idle");
  }

  async function save(publish: boolean) {
    if (!blob.current) return;
    if (title.trim().length === 0) {
      setError("Kayda bir ad ver.");
      return;
    }
    setError(null);
    setStage("saving");
    const uploaded = await uploadFile("audio", blob.current);
    if (!uploaded.ok) {
      setError(uploaded.error);
      setStage("review");
      return;
    }
    const result = await saveVoiceAction({ assetId: uploaded.assetId, title, description, durationMs: Math.round(elapsed), waveform: bars, publish });
    if (!result.ok) {
      setError(result.error);
      setStage("review");
      return;
    }
    toast(result.message ?? "Kaydedildi.");
    discard();
    router.refresh();
  }

  return (
    <section aria-label="Ses kaydı" className="paper p-6 text-center sm:p-9">
      {stage === "idle" ? (
        <>
          <button
            type="button"
            onClick={start}
            aria-label="Kaydı başlat"
            className="mx-auto grid size-20 place-items-center rounded-full bg-accent text-pearl shadow-glow transition-transform duration-300 ease-soft hover:scale-105 active:scale-95"
          >
            <Mic className="size-8" aria-hidden="true" />
          </button>
          <p className="mt-5 font-display text-2xl text-ink">Kaydı başlat</p>
          <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-muted">
            Mikrofon izni yalnızca bu düğmeye bastığında istenir ve kayıt bitince bırakılır. En fazla {MAX_RECORDING_MS / 60000} dakika.
          </p>
        </>
      ) : null}

      {stage === "recording" ? (
        <>
          <p className="eyebrow flex items-center justify-center gap-2 text-[#a94442]" role="status">
            <span className="size-2 animate-pulse rounded-full bg-[#a94442]" aria-hidden="true" />
            Kaydediliyor
          </p>
          <p className="mt-3 font-display text-6xl text-ink tabular-nums">{formatDuration(elapsed)}</p>
          <Waveform bars={bars} className="mx-auto mt-6 h-16 max-w-md" />
          <Button variant="primary" size="lg" className="mt-7" onClick={stop}>
            <Square aria-hidden="true" />
            Durdur
          </Button>
        </>
      ) : null}

      {stage === "review" || stage === "saving" ? (
        <div className="mx-auto max-w-md space-y-5 text-left">
          <Waveform bars={bars} className="h-16" />
          {previewUrl ? <audio controls src={previewUrl} className="w-full" aria-label="Kaydın önizlemesi" /> : null}
          <p className="text-center text-[13px] text-taupe tabular-nums">{formatDuration(elapsed)}</p>
          <Field htmlFor="v-title" label="Kaydın adı">
            <Input id="v-title" value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <Field htmlFor="v-description" label="Not" optional>
            <Textarea id="v-description" rows={2} className="min-h-20" value={description} maxLength={2000} onChange={(e) => setDescription(e.target.value)} />
          </Field>
          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="ghost" onClick={discard} disabled={stage === "saving"}>
              <RotateCcw aria-hidden="true" />
              Sil, baştan al
            </Button>
            <Button variant="outline" onClick={() => save(false)} disabled={stage === "saving"}>
              Taslak sakla
            </Button>
            <Button variant="accent" onClick={() => save(true)} disabled={stage === "saving"}>
              {stage === "saving" ? <Spinner /> : null}
              Paylaş
            </Button>
          </div>
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="mx-auto mt-5 max-w-md rounded-xl bg-[#f8e9e7] px-4 py-3 text-sm text-[#8c3b3b]">
          {error}
        </p>
      ) : null}
    </section>
  );
}
