import type { FastifyPluginAsync } from "fastify";
import { authenticate } from "../../middlewares/authenticate.js";
import { ENTRY_VISIT_LINK_SLUG, visibleLinkWhere } from "../../utils/entry-visit-tracking.js";

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function daysBack(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(0, 0, 0, 0);
  return date;
}

function aggregateCount(count: unknown, field: string) {
  if (!count || typeof count !== "object") {
    return 0;
  }

  const record = count as Record<string, unknown>;
  const value = record[field] ?? record._all;
  return typeof value === "number" ? value : 0;
}

export const dashboardRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", { preHandler: authenticate }, async () => {
    const since = daysBack(13);
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [
      totalClicks,
      activeLinks,
      clicks24h,
      topLinks,
      recentClicks,
      trendClicks,
      sourceRows,
      sourceActionRows,
      entryVisitRows
    ] = await app.prisma.$transaction([
      app.prisma.click.count({ where: { link: visibleLinkWhere } }),
      app.prisma.link.count({ where: { isActive: true, ...visibleLinkWhere } }),
      app.prisma.click.count({
        where: {
          createdAt: { gte: yesterday },
          link: visibleLinkWhere
        }
      }),
      app.prisma.link.findMany({
        where: visibleLinkWhere,
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
        where: { link: visibleLinkWhere },
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
        where: {
          createdAt: { gte: since },
          link: visibleLinkWhere
        },
        select: { createdAt: true }
      }),
      app.prisma.click.groupBy({
        by: ["source"],
        where: {
          source: { not: null },
          link: visibleLinkWhere
        },
        orderBy: { source: "asc" },
        _count: { source: true }
      }),
      app.prisma.click.groupBy({
        by: ["source", "linkId"],
        where: {
          source: { not: null },
          link: visibleLinkWhere
        },
        orderBy: [{ source: "asc" }, { linkId: "asc" }],
        _count: { linkId: true }
      }),
      app.prisma.click.groupBy({
        by: ["source"],
        where: {
          source: { not: null },
          link: { slug: ENTRY_VISIT_LINK_SLUG }
        },
        orderBy: { source: "asc" },
        _count: { source: true }
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

    const sourceActionLinkIds = Array.from(new Set(sourceActionRows.map((row) => row.linkId)));
    const sourceActionLinks = sourceActionLinkIds.length
      ? await app.prisma.link.findMany({
          where: { id: { in: sourceActionLinkIds } },
          select: {
            id: true,
            title: true,
            slug: true,
            kind: true
          }
        })
      : [];
    const sourceActionLinkMap = new Map(sourceActionLinks.map((link) => [link.id, link]));
    const sourceStatsMap = new Map<
      string,
      {
        source: string;
        visits: number;
        clicks: number;
        actions: Array<{
          id: string;
          title: string;
          slug: string;
          kind: string;
          clicks: number;
        }>;
      }
    >();

    for (const row of entryVisitRows) {
      if (!row.source) {
        continue;
      }

      sourceStatsMap.set(row.source, {
        source: row.source,
        visits: aggregateCount(row._count, "source"),
        clicks: 0,
        actions: []
      });
    }

    for (const row of sourceRows) {
      if (!row.source) {
        continue;
      }

      const actions = sourceActionRows
        .filter((actionRow) => actionRow.source === row.source)
        .flatMap((actionRow) => {
          const link = sourceActionLinkMap.get(actionRow.linkId);
          return link ? [{ ...link, clicks: aggregateCount(actionRow._count, "linkId") }] : [];
        })
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 4);

      const existing = sourceStatsMap.get(row.source);
      sourceStatsMap.set(row.source, {
        source: row.source,
        visits: existing?.visits ?? 0,
        clicks: aggregateCount(row._count, "source"),
        actions
      });
    }

    const sourceStats = Array.from(sourceStatsMap.values())
      .sort((a, b) => b.visits + b.clicks - (a.visits + a.clicks))
      .slice(0, 8);

    return {
      summary: {
        totalClicks,
        activeLinks,
        clicks24h,
        qrScans:
          sourceStats.find((source) => source.source === "qr")?.visits ??
          topLinks.find((link) => link.slug === "qr")?.clickCount ??
          0
      },
      topLinks,
      recentClicks,
      sourceStats,
      trend: Array.from(trendMap.entries()).map(([date, clicks]) => ({ date, clicks }))
    };
  });
};
