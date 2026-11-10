import { z } from "zod";

const email = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "E-posta gerekli.")
  .max(254)
  .pipe(z.email("Geçerli bir e-posta yaz."));

const newPassword = z
  .string()
  .min(10, "Parola en az 10 karakter olmalı.")
  .max(128, "Parola en fazla 128 karakter olabilir.");

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Parola gerekli.").max(128),
  next: z.string().max(200).optional(),
});

export const setupSchema = z
  .object({
    secret: z.string().min(1, "Kurulum anahtarı gerekli.").max(200),
    email,
    password: newPassword,
    passwordConfirm: z.string(),
  })
  .refine((v) => v.password === v.passwordConfirm, {
    path: ["passwordConfirm"],
    message: "Parolalar aynı değil.",
  });

export const acceptInviteSchema = z
  .object({
    token: z.string().min(20).max(200),
    password: newPassword,
    passwordConfirm: z.string(),
  })
  .refine((v) => v.password === v.passwordConfirm, {
    path: ["passwordConfirm"],
    message: "Parolalar aynı değil.",
  });

export const createInviteSchema = z.object({
  email,
  displayName: z.string().trim().min(1, "Bir ad yaz.").max(60),
  expiresInDays: z.coerce.number().int().min(1).max(60),
});

export type LoginInput = z.input<typeof loginSchema>;
export type SetupInput = z.input<typeof setupSchema>;
export type AcceptInviteInput = z.input<typeof acceptInviteSchema>;
export type CreateInviteInput = z.input<typeof createInviteSchema>;
