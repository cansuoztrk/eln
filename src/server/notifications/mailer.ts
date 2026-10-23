/**
 * E-posta gönderimi (outbox deseni). Bildirimler önce EmailOutbox tablosuna yazılır; bu görev
 * bekleyenleri SMTP üzerinden gönderir. SMTP yapılandırılmamışsa kayıtlar SKIPPED olur ve
 * site içi bildirimler çalışmaya devam eder.
 */

import nodemailer, { type Transporter } from "nodemailer";
import type { Db } from "../db";

let transporter: Transporter | null | undefined;

function getTransport(): Transporter | null {
  if (transporter !== undefined) return transporter;
  const host = process.env.SMTP_HOST;
  if (!host) {
    transporter = null;
    return null;
  }
  transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    disableFileAccess: true,
    disableUrlAccess: true,
  });
  return transporter;
}

export function emailConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.EMAIL_FROM);
}

export async function sendPendingEmails(db: Db, limit = 50, now = new Date()): Promise<{ sent: number; failed: number; skipped: number }> {
  const pending = await db.emailOutbox.findMany({
    where: { status: "PENDING", scheduledAt: { lte: now } },
    orderBy: { scheduledAt: "asc" },
    take: limit,
  });
  let sent = 0;
  let failed = 0;
  let skipped = 0;
  const transport = getTransport();
  for (const mail of pending) {
    if (!transport || !process.env.EMAIL_FROM) {
      await db.emailOutbox.update({ where: { id: mail.id }, data: { status: "SKIPPED", lastError: "SMTP yapılandırılmamış (SMTP_HOST/EMAIL_FROM)", attempts: { increment: 1 } } });
      skipped++;
      continue;
    }
    try {
      await transport.sendMail({ from: process.env.EMAIL_FROM, to: mail.toEmail, subject: mail.subject, text: mail.text, html: mail.html });
      await db.emailOutbox.update({ where: { id: mail.id }, data: { status: "SENT", sentAt: new Date(), attempts: { increment: 1 }, lastError: null } });
      sent++;
    } catch (err) {
      const attempts = mail.attempts + 1;
      await db.emailOutbox.update({
        where: { id: mail.id },
        data: {
          attempts,
          lastError: (err as Error).message.slice(0, 500),
          status: attempts >= 5 ? "FAILED" : "PENDING",
          scheduledAt: new Date(Date.now() + Math.min(60, 2 ** attempts) * 60_000),
        },
      });
      failed++;
    }
  }
  return { sent, failed, skipped };
}
