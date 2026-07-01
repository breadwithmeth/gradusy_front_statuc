import type { ApiLink, DashboardResponse } from "@/types/api";
import type { SiteSettings } from "@gradusy24/shared";

export const defaultSettings: SiteSettings = {
  brandName: "Градусы24",
  headline: "Всегда в вашем кругу",
  description: "Круглосуточный маркет-бар. Доставка напитков, снеков и товаров для отдыха.",
  primaryColor: "#F97300",
  accentColor: "#7A1B12",
  backgroundColor: "#FFFFFF",
  appStoreUrl: "https://apps.apple.com",
  googlePlayUrl: "https://play.google.com",
  phone: "+7 700 000 24 24",
  whatsapp: "https://wa.me/77000002424",
  telegram: "https://t.me/gradusy24",
  instagram: "https://instagram.com/gradusy24",
  website: "https://gradusy24.kz",
  qrTargetUrl: "https://gradusy24.kz"
};

export const defaultLinks: ApiLink[] = [
  {
    id: "app",
    title: "Скачать приложение",
    description: "App Store и Google Play",
    href: "https://gradusy24.kz/app",
    slug: "app",
    kind: "app",
    icon: "Smartphone",
    isActive: true,
    sortOrder: 10,
    clickCount: 12480,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "stores",
    title: "Магазины",
    description: "Адреса маркет-баров рядом с вами",
    href: "https://gradusy24.kz/stores",
    slug: "stores",
    kind: "store",
    icon: "MapPin",
    isActive: true,
    sortOrder: 20,
    clickCount: 8720,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "promos",
    title: "Акции",
    description: "Свежие предложения и подборки",
    href: "https://gradusy24.kz/promos",
    slug: "promos",
    kind: "promo",
    icon: "BadgePercent",
    isActive: true,
    sortOrder: 30,
    clickCount: 6930,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "bonus",
    title: "Бонусная система",
    description: "Копите бонусы и платите ими",
    href: "https://gradusy24.kz/bonus",
    slug: "bonus",
    kind: "bonus",
    icon: "Gift",
    isActive: true,
    sortOrder: 40,
    clickCount: 5482,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "whatsapp",
    title: "WhatsApp",
    description: "Быстрый заказ и вопросы",
    href: "https://wa.me/77000002424",
    slug: "whatsapp",
    kind: "messenger",
    icon: "MessageCircle",
    isActive: true,
    sortOrder: 50,
    clickCount: 14150,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "telegram",
    title: "Telegram",
    description: "Новости, акции и поддержка",
    href: "https://t.me/gradusy24",
    slug: "telegram",
    kind: "messenger",
    icon: "Send",
    isActive: true,
    sortOrder: 60,
    clickCount: 3930,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "instagram",
    title: "Instagram",
    description: "Витрина, новинки и сторис",
    href: "https://instagram.com/gradusy24",
    slug: "instagram",
    kind: "social",
    icon: "Instagram",
    isActive: true,
    sortOrder: 70,
    clickCount: 7880,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "call",
    title: "Позвонить",
    description: "+7 700 000 24 24",
    href: "tel:+77000002424",
    slug: "call",
    kind: "phone",
    icon: "PhoneCall",
    isActive: true,
    sortOrder: 80,
    clickCount: 3412,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "website",
    title: "Сайт",
    description: "Основной сайт Градусы24",
    href: "https://gradusy24.kz",
    slug: "website",
    kind: "website",
    icon: "Globe2",
    isActive: true,
    sortOrder: 90,
    clickCount: 6230,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const benefits = [
  { label: "24/7", value: "Работаем круглосуточно", icon: "Clock3" },
  { label: "35 минут", value: "Среднее время доставки", icon: "Timer" },
  { label: "3000+", value: "Товаров в ассортименте", icon: "PackageCheck" },
  { label: "Бонусы", value: "Система лояльности", icon: "Sparkles" },
  { label: "Свежо", value: "Регулярное обновление", icon: "RefreshCcw" },
  { label: "18+", value: "Ответственный сервис", icon: "ShieldCheck" }
];

export const fallbackDashboard: DashboardResponse = {
  summary: {
    totalClicks: 69214,
    activeLinks: 9,
    clicks24h: 1840,
    qrScans: 430
  },
  topLinks: defaultLinks.slice(0, 6).map((link) => ({
    id: link.id,
    title: link.title,
    slug: link.slug,
    kind: link.kind,
    clickCount: link.clickCount
  })),
  recentClicks: defaultLinks.slice(0, 6).map((link, index) => ({
    id: `click-${link.id}`,
    createdAt: new Date(Date.now() - index * 18 * 60 * 1000).toISOString(),
    link: {
      title: link.title,
      slug: link.slug,
      kind: link.kind
    },
    source: index % 2 === 0 ? "qr" : "taplink",
    referer: "gradusy24.kz",
    userAgent: "Mobile Safari",
    ipAddress: "127.0.0.1"
  })),
  trend: Array.from({ length: 14 }).map((_, index) => ({
    date: new Date(Date.now() - (13 - index) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    clicks: 620 + index * 52 + (index % 3) * 140
  }))
};
