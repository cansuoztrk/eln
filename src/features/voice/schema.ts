import { z } from "zod";

export const MAX_RECORDING_MS = 5 * 60 * 1000;
export const WAVEFORM_BARS = 64;

export const voiceSchema = z.object({
  id: z.uuid().optional(),
  /** Required when creating: the uploaded recording. */
  assetId: z.uuid().optional(),
  title: z.string().trim().min(1, "Kayda bir ad ver.").max(120),
  description: z.string().trim().max(2000),
  durationMs: z.number().int().min(0).max(MAX_RECORDING_MS + 5000).optional(),
  waveform: z.array(z.number().min(0).max(1)).max(WAVEFORM_BARS).optional(),
  publish: z.boolean(),
});

export type VoiceInput = z.input<typeof voiceSchema>;

/** "1:07" */
export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}
