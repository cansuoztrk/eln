"use server";

import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { fail, ok, type ActionResult } from "@/lib/result";
import { rateLimit, RATE_LIMITED_MESSAGE } from "@/lib/security/rate-limit";
import { beginUpload, finalizeUpload, type UploadTicket } from "./server";

const beginSchema = z.object({
  kind: z.enum(["image", "audio"]),
  filename: z.string().min(1).max(255),
  mimeType: z.string().min(3).max(100),
  size: z.number().int().positive(),
});

/** Step 1 of an upload: get a one-time URL to send the file to. */
export async function beginUploadAction(input: z.input<typeof beginSchema>): Promise<ActionResult<UploadTicket>> {
  const session = await getSession();
  if (!session) return fail("Oturumun kapanmış. Yeniden giriş yap.");

  const parsed = beginSchema.safeParse(input);
  if (!parsed.success) return fail("Bu dosya yüklenemiyor.");
  if (!(await rateLimit("upload", [session.userId]))) return fail(RATE_LIMITED_MESSAGE);

  const result = await beginUpload(session, parsed.data);
  return result.ok ? ok(result.ticket) : fail(result.error);
}

/** Step 2: verify what arrived and prepare it for display. */
export async function finalizeUploadAction(
  assetId: string,
): Promise<ActionResult<{ assetId: string; width: number | null; height: number | null }>> {
  const session = await getSession();
  if (!session) return fail("Oturumun kapanmış. Yeniden giriş yap.");
  if (!z.uuid().safeParse(assetId).success) return fail("Yükleme bulunamadı.");

  const result = await finalizeUpload(session, assetId);
  if (!result.ok) return fail(result.error);
  return ok({ assetId: result.asset.id, width: result.asset.width, height: result.asset.height });
}
