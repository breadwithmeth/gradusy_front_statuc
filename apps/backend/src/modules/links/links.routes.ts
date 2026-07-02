import type { FastifyPluginAsync } from "fastify";
import { randomBytes } from "node:crypto";
import { linkInputSchema, linkUpdateSchema } from "@gradusy24/shared";
import { authenticate } from "../../middlewares/authenticate.js";
import { parseEntryLinkDescription } from "../../utils/entry-link-meta.js";
import { visibleLinkWhere } from "../../utils/entry-visit-tracking.js";

const linkOrder = [{ sortOrder: "asc" as const }, { createdAt: "asc" as const }];

const transliterationMap: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "e",
  ж: "zh",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "h",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "sch",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya"
};

function randomSlugPart(length = 8) {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = randomBytes(length);

  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}

function randomLinkSlug() {
  return `link-${randomSlugPart()}`;
}

function slugify(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .split("")
    .map((char) => transliterationMap[char] ?? char)
    .join("")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 80);

  return slug.length >= 2 ? slug : "link";
}

async function uniqueLinkSlug(app: Parameters<FastifyPluginAsync>[0], value?: string) {
  const baseSlug = value ? slugify(value) : randomLinkSlug();
  let slug = baseSlug;
  let index = 2;

  while (await app.prisma.link.findUnique({ where: { slug } })) {
    if (!value) {
      slug = randomLinkSlug();
      continue;
    }

    const suffix = `-${index}`;
    slug = `${baseSlug.slice(0, Math.max(2, 80 - suffix.length))}${suffix}`;
    index += 1;
  }

  return slug;
}

export const linksRoutes: FastifyPluginAsync = async (app) => {
  app.get("/public/links", async (request) => {
    const { source } = request.query as { source?: string };
    const entryLink = source
      ? await app.prisma.entryLink.findFirst({
          where: { slug: source, isActive: true },
          select: { description: true }
        })
      : null;
    const actionIds = entryLink ? parseEntryLinkDescription(entryLink.description).actionIds : undefined;

    if (actionIds?.length === 0) {
      return { links: [] };
    }

    const links = await app.prisma.link.findMany({
      where: {
        isActive: true,
        ...visibleLinkWhere,
        ...(actionIds ? { id: { in: actionIds } } : {})
      },
      orderBy: linkOrder
    });

    return { links };
  });

  app.get("/links", { preHandler: authenticate }, async () => {
    const links = await app.prisma.link.findMany({
      where: visibleLinkWhere,
      orderBy: linkOrder
    });

    return { links };
  });

  app.post("/links", { preHandler: authenticate }, async (request, reply) => {
    const body = linkInputSchema.parse(request.body);
    const link = await app.prisma.link.create({
      data: {
        ...body,
        slug: body.slug ?? (await uniqueLinkSlug(app))
      }
    });

    reply.code(201);
    return { link };
  });

  app.patch("/links/:id", { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = linkUpdateSchema.parse(request.body);

    if (Object.keys(body).length === 0) {
      reply.code(400).send({ message: "Nothing to update" });
      return;
    }

    const link = await app.prisma.link.update({
      where: { id },
      data: body
    });

    return { link };
  });

  app.delete("/links/:id", { preHandler: authenticate }, async (request) => {
    const { id } = request.params as { id: string };
    await app.prisma.link.delete({ where: { id } });
    return { ok: true };
  });
};
