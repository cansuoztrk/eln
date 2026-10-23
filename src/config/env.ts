import "server-only";
import { z } from "zod";

/**
 * Sunucu tarafı ortam değişkenleri. Gizli değerler yalnızca burada okunur; istemci paketine
 * girmez ("server-only"). Eksik isteğe bağlı entegrasyonlar uygulamayı durdurmaz, ilgili veri
 * kaynağı "AWAITING_CREDENTIALS" durumunda kalır.
 */
const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1),
  SESSION_SECRET: z.string().min(32).optional(),
  CRON_SECRET: z.string().min(16).optional(),
  ANALYTICS_SALT: z.string().min(16).optional(),
  SHOW_TEST_DATA: z.enum(["true", "false"]).optional(),

  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_SECURE: z.enum(["true", "false"]).optional(),
  EMAIL_FROM: z.string().optional(),
});

export type ServerEnv = z.infer<typeof schema>;

let cached: ServerEnv | null = null;

export function env(): ServerEnv {
  if (!cached) {
    const parsed = schema.safeParse(process.env);
    if (!parsed.success) {
      throw new Error(`Geçersiz ortam değişkenleri: ${parsed.error.message}`);
    }
    cached = parsed.data;
  }
  return cached;
}

export { includeTestData as showTestData } from "@/server/visibility";
