/**
 * Bildirim servisi. Her bildirim benzersiz bir `dedupeKey` taşır; aynı olay için ikinci kez
 * oluşturulmaya çalışıldığında veritabanı kısıtı bunu engeller (idempotent).
 */

import type { Prisma } from "@/generated/prisma/client";
import { brand, siteUrl } from "@/config/brand";
import { escapeHtml } from "@/lib/text";
import type { Db } from "../db";

export type NewNotification = {
  userId: string;
  type: "PRICE_ALERT" | "FLIGHT_ALERT" | "DIGEST" | "SYSTEM";
  title: string;
  body: string;
  link?: string;
  data?: Record<string, unknown>;
  dedupeKey: string;
  email?: { to: string; subject: string } | null;
};

/** true = yeni oluşturuldu; false = aynı dedupeKey ile zaten vardı. */
export async function createNotification(db: Db | Prisma.TransactionClient, n: NewNotification): Promise<boolean> {
  const result = await db.notification.createMany({
    data: [
      {
        userId: n.userId,
        type: n.type,
        title: n.title,
        body: n.body,
        link: n.link,
        data: (n.data ?? undefined) as Prisma.InputJsonValue | undefined,
        dedupeKey: n.dedupeKey,
      },
    ],
    skipDuplicates: true,
  });
  if (result.count === 0) return false;
  if (n.email) {
    const notification = await db.notification.findUnique({ where: { dedupeKey: n.dedupeKey }, select: { id: true } });
    await db.emailOutbox.createMany({
      data: [
        {
          toEmail: n.email.to,
          subject: n.email.subject,
          text: `${n.body}\n\n${n.link ? siteUrl(n.link) : ""}\n\nBildirim tercihlerinizi hesabınızdan değiştirebilirsiniz: ${siteUrl("/hesap/bildirimler")}`,
          html: renderEmail(n.title, n.body, n.link),
          kind: n.type,
          notificationId: notification?.id,
          dedupeKey: `email:${n.dedupeKey}`,
        },
      ],
      skipDuplicates: true,
    });
  }
  return true;
}

export function renderEmail(title: string, body: string, link?: string, footer?: string): string {
  const url = link ? siteUrl(link) : null;
  return `<!doctype html><html lang="tr"><body style="margin:0;background:#f4f5f7;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#14171c">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border:1px solid #e3e6eb;border-radius:12px" cellpadding="0" cellspacing="0">
<tr><td style="padding:28px 28px 8px;font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#3f5bd8;font-weight:700">${escapeHtml(brand.name)}</td></tr>
<tr><td style="padding:0 28px;font-size:20px;font-weight:700;line-height:1.3">${escapeHtml(title)}</td></tr>
<tr><td style="padding:12px 28px 4px;font-size:15px;line-height:1.6;color:#3b414b">${escapeHtml(body).replace(/\n/g, "<br>")}</td></tr>
${url ? `<tr><td style="padding:20px 28px"><a href="${escapeHtml(url)}" style="display:inline-block;background:#3f5bd8;color:#fff;text-decoration:none;padding:11px 18px;border-radius:8px;font-weight:600;font-size:14px">Ayrıntıları gör</a></td></tr>` : ""}
<tr><td style="padding:8px 28px 28px;font-size:12px;line-height:1.6;color:#6b7280">${escapeHtml(footer ?? "Fiyatlar mağaza tarafından değiştirilebilir; satın almadan önce mağaza sayfasındaki güncel fiyatı kontrol edin.")}<br>Bildirim tercihleri: <a href="${escapeHtml(siteUrl("/hesap/bildirimler"))}" style="color:#3f5bd8">hesabım</a></td></tr>
</table></td></tr></table></body></html>`;
}
