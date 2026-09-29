import { z } from "zod";
import type { Dictionary } from "@/lib/i18n";

/**
 * Client-side mirrors of lib/validators.ts with localised messages. The server
 * re-validates with the originals, so these only exist for friendly inline errors.
 */
export function authSchemas(t: Dictionary) {
  const email = z.string().trim().min(1, t.auth.required).email(t.auth.invalidEmail).max(160);
  const password = z
    .string()
    .min(8, t.auth.passwordWeak)
    .regex(/[a-z]/, t.auth.passwordWeak)
    .regex(/[A-Z]/, t.auth.passwordWeak)
    .regex(/[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/, t.auth.passwordWeak);

  return {
    login: z.object({
      email,
      password: z.string().min(1, t.auth.required),
      remember: z.boolean(),
    }),
    register: z
      .object({
        displayName: z.string().trim().min(2, t.auth.nameLength).max(40, t.auth.nameLength),
        email,
        password,
        confirmPassword: z.string().min(1, t.auth.required),
      })
      .refine((value) => value.password === value.confirmPassword, {
        path: ["confirmPassword"],
        message: t.auth.passwordMismatch,
      }),
    forgot: z.object({ email }),
    reset: z
      .object({
        otpCode: z.string().regex(/^\d{6}$/, t.auth.otpFormat),
        password,
        confirmPassword: z.string().min(1, t.auth.required),
      })
      .refine((value) => value.password === value.confirmPassword, {
        path: ["confirmPassword"],
        message: t.auth.passwordMismatch,
      }),
  };
}

/** 0–4 score used by the strength meter. */
export function passwordScore(value: string) {
  if (!value) return 0;
  let score = 0;
  if (value.length >= 8) score += 1;
  if (value.length >= 12) score += 1;
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score += 1;
  if (/[0-9]/.test(value)) score += 0.5;
  if (/[^A-Za-z0-9]/.test(value)) score += 0.5;
  return Math.min(4, Math.floor(score));
}
