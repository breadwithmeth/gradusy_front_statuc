import type { FastifyPluginAsync } from "fastify";
import { settingsSchema } from "@gradusy24/shared";
import { authenticate } from "../../middlewares/authenticate.js";

async function getSettings(app: Parameters<FastifyPluginAsync>[0]) {
  return app.prisma.settings.upsert({
    where: { id: "site_settings" },
    update: {},
    create: { id: "site_settings" }
  });
}

export const settingsRoutes: FastifyPluginAsync = async (app) => {
  app.get("/public/settings", async () => {
    const settings = await getSettings(app);
    return { settings };
  });

  app.get("/settings", { preHandler: authenticate }, async () => {
    const settings = await getSettings(app);
    return { settings };
  });

  app.put("/settings", { preHandler: authenticate }, async (request) => {
    const body = settingsSchema.partial().parse(request.body);
    const settings = await app.prisma.settings.upsert({
      where: { id: "site_settings" },
      update: body,
      create: {
        id: "site_settings",
        ...body
      }
    });

    return { settings };
  });
};
