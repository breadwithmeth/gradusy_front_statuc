import type { FastifyPluginAsync } from "fastify";
import { entryLinkInputSchema, entryLinkUpdateSchema } from "@gradusy24/shared";
import { authenticate } from "../../middlewares/authenticate.js";
import {
  ENTRY_VISIT_LINK_SLUG,
  ensureEntryVisitTrackingLink,
  visibleLinkWhere
} from "../../utils/entry-visit-tracking.js";
import {
  encodeEntryLinkDescription,
  parseEntryLinkDescription,
  publicEntryLink
} from "../../utils/entry-link-meta.js";

const entryLinkOrder = [{ sortOrder: "asc" as const }, { createdAt: "asc" as const }];
const sourceSlugPattern = /^[a-z0-9-]{2,80}$/;

function firstHeader(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function aggregateCount(count: unknown, field: string) {
  if (!count || typeof count !== "object") {
    return 0;
  }

  const record = count as Record<string, unknown>;
  const value = record[field] ?? record._all;
  return typeof value === "number" ? value : 0;
}

function parseDevice(userAgent: string | null | undefined) {
  const value = userAgent ?? "";
  const lowerValue = value.toLowerCase();

  const device = /ipad|tablet/.test(lowerValue)
    ? "tablet"
    : /mobile|iphone|android/.test(lowerValue)
      ? "mobile"
      : value
        ? "desktop"
        : "unknown";

  const os = /iphone|ipad|ios/.test(lowerValue)
    ? "iOS"
    : /android/.test(lowerValue)
      ? "Android"
      : /macintosh|mac os/.test(lowerValue)
        ? "macOS"
        : /windows/.test(lowerValue)
          ? "Windows"
          : /linux/.test(lowerValue)
            ? "Linux"
            : "unknown";

  const browser = /edg\//.test(lowerValue)
    ? "Edge"
    : /firefox\//.test(lowerValue)
      ? "Firefox"
      : /crios|chrome\//.test(lowerValue)
        ? "Chrome"
        : /safari\//.test(lowerValue)
          ? "Safari"
          : "unknown";

  return { device, os, browser };
}

export const entryLinksRoutes: FastifyPluginAsync = async (app) => {
  app.get("/public/entry-links", async () => {
    const entryLinks = await app.prisma.entryLink.findMany({
      where: { isActive: true },
      orderBy: entryLinkOrder
    });

    return { entryLinks: entryLinks.map(publicEntryLink) };
  });

  app.post("/entry-visits/:slug", async (request, reply) => {
    const { slug } = request.params as { slug: string };

    if (!sourceSlugPattern.test(slug)) {
      reply.code(400).send({ message: "Invalid source slug" });
      return;
    }

    const trackingLink = await ensureEntryVisitTrackingLink(app);

    await app.prisma.$transaction([
      app.prisma.click.create({
        data: {
          linkId: trackingLink.id,
          source: slug,
          ipAddress: request.ip,
          userAgent: request.headers["user-agent"],
          referer: firstHeader(request.headers.referer)
        }
      }),
      app.prisma.link.update({
        where: { id: trackingLink.id },
        data: { clickCount: { increment: 1 } }
      })
    ]);

    reply.code(201);
    return { ok: true };
  });

  app.get("/entry-analytics/:slug", { preHandler: authenticate }, async (request, reply) => {
    const { slug } = request.params as { slug: string };

    if (!sourceSlugPattern.test(slug)) {
      reply.code(400).send({ message: "Invalid source slug" });
      return;
    }

    const [visits, clicks, actionRows, events] = await app.prisma.$transaction([
      app.prisma.click.count({
        where: {
          source: slug,
          link: { slug: ENTRY_VISIT_LINK_SLUG }
        }
      }),
      app.prisma.click.count({
        where: {
          source: slug,
          link: visibleLinkWhere
        }
      }),
      app.prisma.click.groupBy({
        by: ["linkId"],
        where: {
          source: slug,
          link: visibleLinkWhere
        },
        orderBy: { linkId: "asc" },
        _count: { linkId: true }
      }),
      app.prisma.click.findMany({
        where: { source: slug },
        orderBy: { createdAt: "desc" },
        take: 200,
        include: {
          link: {
            select: {
              id: true,
              title: true,
              slug: true,
              kind: true
            }
          }
        }
      })
    ]);

    const actionLinkIds = actionRows.map((row) => row.linkId);
    const actionLinks = actionLinkIds.length
      ? await app.prisma.link.findMany({
          where: { id: { in: actionLinkIds } },
          select: {
            id: true,
            title: true,
            slug: true,
            kind: true
          }
        })
      : [];
    const actionLinkMap = new Map(actionLinks.map((link) => [link.id, link]));
    const actions = actionRows
      .flatMap((row) => {
        const link = actionLinkMap.get(row.linkId);
        return link ? [{ ...link, clicks: aggregateCount(row._count, "linkId") }] : [];
      })
      .sort((a, b) => b.clicks - a.clicks);

    return {
      source: slug,
      summary: {
        visits,
        clicks,
        totalEvents: visits + clicks
      },
      actions,
      events: events.map((event) => ({
        id: event.id,
        type: event.link.slug === ENTRY_VISIT_LINK_SLUG ? "entry" : "click",
        source: event.source,
        ipAddress: event.ipAddress,
        userAgent: event.userAgent,
        referer: event.referer,
        country: event.country,
        city: event.city,
        createdAt: event.createdAt,
        device: parseDevice(event.userAgent),
        link:
          event.link.slug === ENTRY_VISIT_LINK_SLUG
            ? null
            : {
                id: event.link.id,
                title: event.link.title,
                slug: event.link.slug,
                kind: event.link.kind
              }
      }))
    };
  });

  app.get("/entry-links", { preHandler: authenticate }, async () => {
    const entryLinks = await app.prisma.entryLink.findMany({
      orderBy: entryLinkOrder
    });

    return { entryLinks: entryLinks.map(publicEntryLink) };
  });

  app.post("/entry-links", { preHandler: authenticate }, async (request, reply) => {
    const body = entryLinkInputSchema.parse(request.body);
    const { actionIds, ...entryLinkData } = body;
    const entryLink = await app.prisma.entryLink.create({
      data: {
        ...entryLinkData,
        description: encodeEntryLinkDescription({
          description: body.description,
          actionIds
        })
      }
    });

    reply.code(201);
    return { entryLink: publicEntryLink(entryLink) };
  });

  app.patch("/entry-links/:id", { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const rawBody = request.body && typeof request.body === "object" ? (request.body as Record<string, unknown>) : {};
    const body = entryLinkUpdateSchema.parse(request.body);

    if (Object.keys(body).length === 0) {
      reply.code(400).send({ message: "Nothing to update" });
      return;
    }

    const { actionIds, description, ...entryLinkData } = body;
    const existingEntryLink = await app.prisma.entryLink.findUnique({ where: { id } });

    if (!existingEntryLink) {
      reply.code(404).send({ message: "Entry link not found" });
      return;
    }

    const existingMeta = parseEntryLinkDescription(existingEntryLink.description);
    const shouldUpdateMeta = "description" in rawBody || "actionIds" in rawBody;
    const entryLink = await app.prisma.entryLink.update({
      where: { id },
      data: {
        ...entryLinkData,
        ...(shouldUpdateMeta
          ? {
              description: encodeEntryLinkDescription({
                description: "description" in rawBody ? (description ?? "") : existingMeta.description,
                actionIds: "actionIds" in rawBody ? actionIds : existingMeta.actionIds
              })
            }
          : {})
      }
    });

    return { entryLink: publicEntryLink(entryLink) };
  });

  app.delete("/entry-links/:id", { preHandler: authenticate }, async (request) => {
    const { id } = request.params as { id: string };
    await app.prisma.entryLink.delete({ where: { id } });
    return { ok: true };
  });
};
