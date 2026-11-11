import { Zip, ZipPassThrough } from "fflate";
import { collectExport } from "@/features/account/export";
import { getSession } from "@/lib/auth/session";
import { viewerToday } from "@/features/dates/queries";
import { toISODate } from "@/lib/dates";
import { rateLimit } from "@/lib/security/rate-limit";
import { createAdminClient, MEDIA_BUCKET } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
// Gathering every file into one archive is the slowest thing the site does.
export const maxDuration = 60;

/**
 * "Verimi indir". `?format=json` returns everything the person wrote as one
 * JSON file; `?format=zip` streams the original files they uploaded, exactly
 * as they were uploaded. Nobody is asked or told.
 */
export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return new Response("Oturum gerekli.", { status: 401 });
  if (!(await rateLimit("export", [session.userId]))) {
    return new Response("Çok fazla deneme yapıldı. Biraz bekleyip tekrar dene.", { status: 429 });
  }

  const format = new URL(request.url).searchParams.get("format");
  const name = `elnare-${session.role === "owner" ? "arda" : "eln"}-${toISODate(viewerToday(session))}`;
  const headers = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };

  if (format !== "zip") {
    return new Response(JSON.stringify(await collectExport(session), null, 2), {
      headers: { ...headers, "Content-Type": "application/json; charset=utf-8", "Content-Disposition": `attachment; filename="${name}.json"` },
    });
  }

  // The person's own uploads only; the query runs as them.
  const { data: assets } = await session.supabase
    .from("media_assets")
    .select("id, original_path, original_filename")
    .eq("uploaded_by", session.userId)
    .eq("state", "ready");
  const storage = createAdminClient().storage.from(MEDIA_BUCKET);

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const zip = new Zip((error, chunk, final) => {
        if (error) controller.error(error);
        else {
          controller.enqueue(chunk);
          if (final) controller.close();
        }
      });
      for (const asset of assets ?? []) {
        const { data } = await storage.download(asset.original_path);
        if (!data) continue;
        const extension = asset.original_path.split(".").pop();
        // Photos are already compressed: store them as they are.
        const file = new ZipPassThrough(`${asset.id}.${extension}`);
        zip.add(file);
        file.push(new Uint8Array(await data.arrayBuffer()), true);
      }
      zip.end();
    },
  });

  return new Response(stream, {
    headers: { ...headers, "Content-Type": "application/zip", "Content-Disposition": `attachment; filename="${name}-dosyalar.zip"` },
  });
}
