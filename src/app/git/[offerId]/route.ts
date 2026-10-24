import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { buildOutboundUrl, visitorHash } from "@/server/outbound";
import { clientIp, rateLimit } from "@/server/rate-limit";
import { headers } from "next/headers";

/** Mağazaya yönlendirme: tıklamayı anonim olarak kaydeder, sonra 302 ile yönlendirir. */
export async function GET(req: Request, ctx: RouteContext<"/git/[offerId]">) {
  const { offerId } = await ctx.params;
  const offer = await db.offer.findUnique({
    where: { id: offerId },
    select: { id: true, url: true, productId: true, retailerId: true, isSponsored: true, product: { select: { categoryId: true, slug: true } }, retailer: { select: { affiliateEnabled: true, affiliateConfig: true } }, dataSource: { select: { isTestData: true } } },
  });
  const base = new URL(req.url);
  if (!offer) return NextResponse.redirect(new URL("/firsatlar", base), 302);
  if (offer.dataSource.isTestData) return NextResponse.redirect(new URL(`/test-baglanti?urun=${offer.product.slug}`, base), 302);
  const out = buildOutboundUrl(offer.url, offer.retailer);
  if (!out) return NextResponse.redirect(new URL(`/urun/${offer.product.slug}`, base), 302);

  const h = await headers();
  // Bot/tekrar tıklama şişmesini sınırla (istatistik doğruluğu için; yönlendirme her durumda yapılır)
  if (rateLimit(`click:${clientIp(h)}`, 30, 60_000).ok && !/bot|crawler|spider|preview/i.test(h.get("user-agent") ?? "")) {
    const placement = base.searchParams.get("yer")?.slice(0, 40) ?? null;
    await db.clickEvent
      .create({
        data: {
          target: "OFFER",
          offerId: offer.id,
          productId: offer.productId,
          retailerId: offer.retailerId,
          categoryId: offer.product.categoryId,
          isSponsored: offer.isSponsored,
          isAffiliate: out.affiliate,
          visitorHash: await visitorHash(),
          placement,
        },
      })
      .catch(() => {});
  }
  return NextResponse.redirect(out.url, { status: 302, headers: { "referrer-policy": "strict-origin-when-cross-origin", "x-robots-tag": "noindex, nofollow" } });
}
