import type { FastifyPluginAsync } from "fastify";
import { authenticate } from "../../middlewares/authenticate.js";

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function daysBack(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(0, 0, 0, 0);
  return date;
}

export const dashboardRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", { preHandler: authenticate }, async () => {
    const since = daysBack(13);
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [totalClicks, activeLinks, clicks24h, topLinks, recentClicks, trendClicks] =
      await app.prisma.$transaction([
        app.prisma.click.count(),
        app.prisma.link.count({ where: { isActive: true } }),
        app.prisma.click.count({ where: { createdAt: { gte: yesterday } } }),
        app.prisma.link.findMany({
          orderBy: { clickCount: "desc" },
          take: 6,
          select: {
            id: true,
            title: true,
            slug: true,
            kind: true,
            clickCount: true
          }
        }),
        app.prisma.click.findMany({
          orderBy: { createdAt: "desc" },
          take: 12,
          include: {
            link: {
              select: {
                title: true,
                slug: true,
                kind: true
              }
            }
          }
        }),
        app.prisma.click.findMany({
          where: { createdAt: { gte: since } },
          select: { createdAt: true }
        })
      ]);

    const trendMap = new Map<string, number>();
    for (let offset = 13; offset >= 0; offset -= 1) {
      trendMap.set(dateKey(daysBack(offset)), 0);
    }

    for (const click of trendClicks) {
      const key = dateKey(click.createdAt);
      trendMap.set(key, (trendMap.get(key) ?? 0) + 1);
    }

    return {
      summary: {
        totalClicks,
        activeLinks,
        clicks24h,
        qrScans: topLinks.find((link) => link.slug === "qr")?.clickCount ?? 0
      },
      topLinks,
      recentClicks,
      trend: Array.from(trendMap.entries()).map(([date, clicks]) => ({ date, clicks }))
    };
  });
};
