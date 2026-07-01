import type { FastifyPluginAsync } from "fastify";
import { linkInputSchema, linkUpdateSchema } from "@gradusy24/shared";
import { authenticate } from "../../middlewares/authenticate.js";

const linkOrder = [{ sortOrder: "asc" as const }, { createdAt: "asc" as const }];

export const linksRoutes: FastifyPluginAsync = async (app) => {
  app.get("/public/links", async () => {
    const links = await app.prisma.link.findMany({
      where: { isActive: true },
      orderBy: linkOrder
    });

    return { links };
  });

  app.get("/links", { preHandler: authenticate }, async () => {
    const links = await app.prisma.link.findMany({
      orderBy: linkOrder
    });

    return { links };
  });

  app.post("/links", { preHandler: authenticate }, async (request, reply) => {
    const body = linkInputSchema.parse(request.body);
    const link = await app.prisma.link.create({
      data: body
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
