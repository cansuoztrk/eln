import { NextResponse } from "next/server";
import { z } from "zod";
import { productCardsByIds } from "@/server/catalog/queries";

/** Anonim favoriler için kart verisi (yalnızca herkese açık ürün bilgisi). */
export async function GET(req: Request) {
  const raw = new URL(req.url).searchParams.get("ids") ?? "";
  const ids = z.array(z.string().regex(/^[a-z0-9]{10,40}$/)).max(100).safeParse(raw.split(",").filter(Boolean));
  if (!ids.success) return NextResponse.json([], { status: 400 });
  return NextResponse.json(await productCardsByIds(ids.data), { headers: { "cache-control": "private, max-age=60" } });
}
