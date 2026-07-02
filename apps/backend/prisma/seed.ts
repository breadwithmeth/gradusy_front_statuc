import "dotenv/config";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const links = [
  {
    title: "Скачать приложение",
    description: "App Store и Google Play",
    href: "https://gradusy24.kz/app",
    slug: "app",
    kind: "app",
    target: "frontend",
    icon: "Smartphone",
    sortOrder: 10
  },
  {
    title: "Магазины",
    description: "Адреса маркет-баров рядом с вами",
    href: "https://gradusy24.kz/stores",
    slug: "stores",
    kind: "store",
    target: "frontend",
    icon: "MapPin",
    sortOrder: 20
  },
  {
    title: "Акции",
    description: "Свежие предложения и подборки",
    href: "https://gradusy24.kz/promos",
    slug: "promos",
    kind: "promo",
    target: "frontend",
    icon: "BadgePercent",
    sortOrder: 30
  },
  {
    title: "Бонусная система",
    description: "Копите бонусы и платите ими",
    href: "https://gradusy24.kz/bonus",
    slug: "bonus",
    kind: "bonus",
    target: "frontend",
    icon: "Gift",
    sortOrder: 40
  },
  {
    title: "WhatsApp",
    description: "Быстрый заказ и вопросы",
    href: "https://wa.me/77000002424",
    slug: "whatsapp",
    kind: "messenger",
    target: "direct",
    icon: "MessageCircle",
    sortOrder: 50
  },
  {
    title: "Telegram",
    description: "Новости, акции и поддержка",
    href: "https://t.me/gradusy24",
    slug: "telegram",
    kind: "messenger",
    target: "direct",
    icon: "Send",
    sortOrder: 60
  },
  {
    title: "Instagram",
    description: "Витрина, новинки и сторис",
    href: "https://instagram.com/gradusy24",
    slug: "instagram",
    kind: "social",
    target: "direct",
    icon: "Instagram",
    sortOrder: 70
  },
  {
    title: "Позвонить",
    description: "+7 700 000 24 24",
    href: "tel:+77000002424",
    slug: "call",
    kind: "phone",
    target: "direct",
    icon: "PhoneCall",
    sortOrder: 80
  },
  {
    title: "Сайт",
    description: "Основной сайт Градусы24",
    href: "https://gradusy24.kz",
    slug: "website",
    kind: "website",
    target: "direct",
    icon: "Globe2",
    sortOrder: 90
  }
] as const;

const entryLinks = [
  {
    title: "TapLink",
    description: "Основной вход на страницу ссылок",
    slug: "taplink",
    sortOrder: 10
  },
  {
    title: "QR вход",
    description: "Переходы из QR-кодов",
    slug: "qr",
    sortOrder: 20
  },
  {
    title: "Instagram",
    description: "Переходы из профиля Instagram",
    slug: "instagram",
    sortOrder: 30
  },
  {
    title: "Stories",
    description: "Переходы из stories и промо",
    slug: "stories",
    sortOrder: 40
  }
] as const;

async function main() {
  const email = process.env.ADMIN_EMAIL ?? "admin@gradusy24.kz";
  const password = process.env.ADMIN_PASSWORD ?? "ChangeMe24!";
  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.upsert({
    where: { email },
    update: { passwordHash, name: "Gradusy24 Admin", isActive: true },
    create: {
      email,
      passwordHash,
      name: "Gradusy24 Admin",
      role: "admin"
    }
  });

  await prisma.settings.upsert({
    where: { id: "site_settings" },
    update: {},
    create: { id: "site_settings" }
  });

  for (const link of links) {
    await prisma.link.upsert({
      where: { slug: link.slug },
      update: link,
      create: link
    });
  }

  for (const entryLink of entryLinks) {
    await prisma.entryLink.upsert({
      where: { slug: entryLink.slug },
      update: entryLink,
      create: entryLink
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
