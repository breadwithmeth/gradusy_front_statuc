import { PrismaClient } from "@prisma/client";
import fp from "fastify-plugin";
import { env } from "../utils/env.js";

declare module "fastify" {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

function databaseUrlWithPoolLimit(databaseUrl: string) {
  try {
    const url = new URL(databaseUrl);

    if (!url.searchParams.has("connection_limit")) {
      url.searchParams.set("connection_limit", String(env.PRISMA_CONNECTION_LIMIT));
    }

    if (!url.searchParams.has("pool_timeout")) {
      url.searchParams.set("pool_timeout", "20");
    }

    return url.toString();
  } catch {
    return databaseUrl;
  }
}

export const prismaPlugin = fp(async (app) => {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrlWithPoolLimit(env.DATABASE_URL)
      }
    },
    log: app.log.level === "debug" ? ["query", "error", "warn"] : ["error"]
  });

  app.decorate("prisma", prisma);

  app.addHook("onClose", async () => {
    await prisma.$disconnect();
  });
});
