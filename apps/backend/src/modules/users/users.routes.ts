import type { FastifyPluginAsync } from "fastify";
import { authenticate } from "../../middlewares/authenticate.js";

export const usersRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", { preHandler: authenticate }, async () => {
    const users = await app.prisma.user.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return { users };
  });
};
