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
    icon: "Smartphone",
    sortOrder: 10
  },
  {
    title: "Магазины",
    description: "Адреса маркет-баров рядом с вами",
    href: "https://gradusy24.kz/stores",
    slug: "stores",
    kind: "store",
    icon: "MapPin",
    sortOrder: 20
  },
  {
    title: "Акции",
    description: "Свежие предложения и подборки",
    href: "https://gradusy24.kz/promos",
    slug: "promos",
    kind: "promo",
    icon: "BadgePercent",
    sortOrder: 30
  },
  {
    title: "Бонусная система",
    description: "Копите бонусы и платите ими",
    href: "https://gradusy24.kz/bonus",
    slug: "bonus",
    kind: "bonus",
    icon: "Gift",
    sortOrder: 40
  },
  {
    title: "WhatsApp",
    description: "Быстрый заказ и вопросы",
    href: "https://wa.me/77000002424",
    slug: "whatsapp",
    kind: "messenger",
    icon: "MessageCircle",
    sortOrder: 50
  },
  {
    title: "Telegram",
    description: "Новости, акции и поддержка",
    href: "https://t.me/gradusy24",
    slug: "telegram",
    kind: "messenger",
    icon: "Send",
    sortOrder: 60
  },
  {
    title: "Instagram",
    description: "Витрина, новинки и сторис",
    href: "https://instagram.com/gradusy24",
    slug: "instagram",
    kind: "social",
    icon: "Instagram",
    sortOrder: 70
  },
  {
    title: "Позвонить",
    description: "+7 700 000 24 24",
    href: "tel:+77000002424",
    slug: "call",
    kind: "phone",
    icon: "PhoneCall",
    sortOrder: 80
  },
  {
    title: "Сайт",
    description: "Основной сайт Градусы24",
    href: "https://gradusy24.kz",
    slug: "website",
    kind: "website",
    icon: "Globe2",
    sortOrder: 90
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
