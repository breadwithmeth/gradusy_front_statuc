import type { FastifyPluginAsync, FastifyRequest } from "fastify";
import { clickQuerySchema } from "@gradusy24/shared";
import { authenticate } from "../../middlewares/authenticate.js";
import { allowedOrigins, env } from "../../utils/env.js";

function firstHeader(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function frontendOrigin() {
  return env.FRONTEND_ORIGIN.split(",")[0]?.trim().replace(/\/$/, "") || "http://localhost:5173";
}

function allowedFrontendOrigin(origin: string | undefined) {
  const normalizedOrigin = origin?.trim().replace(/\/$/, "");
  return normalizedOrigin && allowedOrigins.map((allowedOrigin) => allowedOrigin.replace(/\/$/, "")).includes(normalizedOrigin)
    ? normalizedOrigin
    : null;
}

function requestFrontendOrigin(request: FastifyRequest) {
  const origin = allowedFrontendOrigin(firstHeader(request.headers.origin));

  if (origin) {
    return origin;
  }

  const referer = firstHeader(request.headers.referer);

  if (!referer) {
    return null;
  }

  try {
    return allowedFrontendOrigin(new URL(referer).origin);
  } catch {
    return null;
  }
}

function frontendHref(href: string, origin = frontendOrigin()) {
  try {
    return new URL(href).toString();
  } catch {
    const path = href.startsWith("/") ? href : `/${href}`;
    return `${origin}${path}`;
  }
}

function linkDestination(link: { href: string; target: "frontend" | "direct" }, origin?: string | null) {
  return link.target === "frontend" ? frontendHref(link.href, origin ?? frontendOrigin()) : link.href;
}

async function trackClick(app: Parameters<FastifyPluginAsync>[0], request: FastifyRequest, slug: string) {
  const query = request.query as { source?: string };
  const link = await app.prisma.link.findFirst({
    where: { slug, isActive: true }
  });

  if (!link) {
    return null;
  }

  await app.prisma.$transaction([
    app.prisma.click.create({
      data: {
        linkId: link.id,
        ipAddress: request.ip,
        userAgent: request.headers["user-agent"],
        referer: firstHeader(request.headers.referer),
        source: query.source
      }
    }),
    app.prisma.link.update({
      where: { id: link.id },
      data: { clickCount: { increment: 1 } }
    })
  ]);

  return link;
}

export const clicksRoutes: FastifyPluginAsync = async (app) => {
  app.get("/clicks/:slug", async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const link = await trackClick(app, request, slug);

    if (!link) {
      const settings = await app.prisma.settings.findUnique({ where: { id: "site_settings" } });
      reply.redirect(settings?.website ?? "https://gradusy24.kz");
      return;
    }

    reply.redirect(linkDestination(link));
  });

  app.post("/clicks/:slug", async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const link = await trackClick(app, request, slug);

    if (!link) {
      reply.code(404).send({ message: "Link not found" });
      return;
    }

    return { href: linkDestination(link, requestFrontendOrigin(request)), target: link.target };
  });

  app.get("/clicks", { preHandler: authenticate }, async (request) => {
    const query = clickQuerySchema.parse(request.query);
    const clicks = await app.prisma.click.findMany({
      where: {
        linkId: query.linkId,
        createdAt: {
          gte: query.from ? new Date(query.from) : undefined,
          lte: query.to ? new Date(query.to) : undefined
        }
      },
      include: {
        link: {
          select: {
            id: true,
            title: true,
            slug: true,
            kind: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 500
    });

    return { clicks };
  });
};
