import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .regex(/[a-z]/, "Password needs a lowercase letter.")
  .regex(/[A-Z]/, "Password needs an uppercase letter.")
  .regex(/[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/, "Password needs a number or special character.");

export const sendOtpSchema = z.object({
  email: z.string().email().max(160).transform((v) => v.toLowerCase()),
  purpose: z.enum(["REGISTER", "LOGIN", "RESET_PASSWORD"]).default("REGISTER"),
});

export const verifyOtpSchema = sendOtpSchema.extend({
  code: z.string().regex(/^\d{6}$/, "OTP must be 6 digits."),
});

export const registerSchema = z
  .object({
    displayName: z.string().min(2).max(40),
    email: z.string().email().max(160).transform((v) => v.toLowerCase()),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

export const loginSchema = z.object({
  email: z.string().min(1, "Email or username is required.").max(160).transform((v) => v.trim().toLowerCase()),
  password: z.string().min(1, "Password is required."),
  remember: z.boolean().default(false),
});

export const resetPasswordSchema = z
  .object({
    email: z.string().email().max(160).transform((v) => v.toLowerCase()),
    otpCode: z.string().regex(/^\d{6}$/, "OTP must be 6 digits."),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

export const slugSchema = z
  .string()
  .min(3)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug may only contain lowercase letters, numbers and hyphens.");

export const postInputSchema = z.object({
  title: z.string().min(5).max(150),
  slug: slugSchema.optional().or(z.literal("")),
  excerpt: z.string().max(300),
  content: z.string().min(1),
  coverImage: z.string().url().or(z.string().startsWith("/uploads/")).optional().or(z.literal("")),
  categoryId: z.string().min(1),
  tags: z.array(z.string().min(1).max(32)).max(10).default([]),
  language: z.enum(["vi", "en", "ja"]).default("vi"),
  difficulty: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).default("BEGINNER"),
  topicType: z.enum(["CTF", "TUTORIAL", "NOTE", "RESEARCH", "LAB", "TOOL"]).default("NOTE"),
  status: z.enum(["DRAFT", "PENDING", "PUBLISHED"]).default("DRAFT"),
  seoTitle: z.string().max(150).optional().or(z.literal("")),
  seoDescription: z.string().max(180).optional().or(z.literal("")),
});

export const postQuerySchema = z.object({
  search: z.string().max(80).optional(),
  category: z.string().max(80).optional(),
  tag: z.string().max(80).optional(),
  language: z.enum(["vi", "en", "ja", "all"]).default("all"),
  sort: z.enum(["latest", "popular"]).default("latest"),
  page: z.coerce.number().int().min(1).default(1),
});

export const commentSchema = z.object({
  postId: z.string().min(1),
  content: z.string().min(1).max(1200),
});

export const reviewSchema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
  reason: z.string().max(300).optional(),
});

export const categorySchema = z.object({
  name: z.string().min(2).max(80),
  slug: slugSchema.optional(),
  description: z.string().max(240).optional(),
  icon: z.string().max(40).optional(),
});

export const tagSchema = z.object({
  name: z.string().min(1).max(32),
});
