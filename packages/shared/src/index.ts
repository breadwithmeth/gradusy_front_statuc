import { z } from "zod";

export const linkKindSchema = z.enum([
  "app",
  "store",
  "promo",
  "bonus",
  "messenger",
  "social",
  "phone",
  "website"
]);

export const linkInputSchema = z.object({
  title: z.string().min(2).max(80),
  description: z.string().max(180).optional().default(""),
  href: z.string().min(3).max(500),
  slug: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and hyphens"),
  kind: linkKindSchema,
  icon: z.string().min(2).max(48),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).max(1000).default(0)
});

export const linkUpdateSchema = linkInputSchema.partial();

export const settingsSchema = z.object({
  brandName: z.string().min(2).max(80).default("Градусы24"),
  headline: z.string().min(4).max(120).default("Всегда в вашем кругу"),
  description: z
    .string()
    .min(8)
    .max(300)
    .default("Круглосуточный маркет-бар. Доставка напитков, снеков и товаров для отдыха."),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#F97300"),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#7A1B12"),
  backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#FFFFFF"),
  appStoreUrl: z.string().url().optional().or(z.literal("")),
  googlePlayUrl: z.string().url().optional().or(z.literal("")),
  phone: z.string().min(3).max(40).default("+7 700 000 24 24"),
  whatsapp: z.string().min(3).max(120).default("https://wa.me/77000002424"),
  telegram: z.string().min(3).max(120).default("https://t.me/gradusy24"),
  instagram: z.string().min(3).max(120).default("https://instagram.com/gradusy24"),
  website: z.string().min(3).max(120).default("https://gradusy24.kz"),
  qrTargetUrl: z.string().min(3).max(500).default("https://gradusy24.kz")
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128)
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(20)
});

export const clickQuerySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  linkId: z.string().optional()
});

export type LinkKind = z.infer<typeof linkKindSchema>;
export type LinkInput = z.infer<typeof linkInputSchema>;
export type LinkUpdate = z.infer<typeof linkUpdateSchema>;
export type SiteSettings = z.infer<typeof settingsSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
