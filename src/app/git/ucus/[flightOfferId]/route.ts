import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { buildOutboundUrl, visitorHash } from "@/server/outbound";

export async function GET(req: Request, ctx: RouteContext<"/git/ucus/[flightOfferId]">) {
  const { flightOfferId } = await ctx.params;
  const base = new URL(req.url);
  const f = await db.flightOffer.findUnique({ where: { id: flightOfferId }, include: { dataSource: { select: { isTestData: true } } } });
  if (!f || !f.deepLink) return NextResponse.redirect(new URL("/ucak-bileti", base), 302);
  if (f.dataSource.isTestData) return NextResponse.redirect(new URL("/test-baglanti?ucus=1", base), 302);
  const out = buildOutboundUrl(f.deepLink, { affiliateEnabled: false, affiliateConfig: null });
  if (!out) return NextResponse.redirect(new URL("/ucak-bileti", base), 302);
  await db.clickEvent.create({ data: { target: "FLIGHT", flightOfferId: f.id, isAffiliate: f.isAffiliateLink, visitorHash: await visitorHash(), placement: base.searchParams.get("yer")?.slice(0, 40) ?? null } }).catch(() => {});
  return NextResponse.redirect(out.url, 302);
}
