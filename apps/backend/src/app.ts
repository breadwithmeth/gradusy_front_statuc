import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import jwt from "@fastify/jwt";
import rateLimit from "@fastify/rate-limit";
import Fastify from "fastify";
import { ZodError } from "zod";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { clicksRoutes } from "./modules/clicks/clicks.routes.js";
import { dashboardRoutes } from "./modules/dashboard/dashboard.routes.js";
import { linksRoutes } from "./modules/links/links.routes.js";
import { settingsRoutes } from "./modules/settings/settings.routes.js";
import { usersRoutes } from "./modules/users/users.routes.js";
import { prismaPlugin } from "./plugins/prisma.js";
import { allowedOrigins, env, isProduction } from "./utils/env.js";

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: isProduction ? "info" : "debug",
      transport: isProduction ? undefined : { target: "pino-pretty" }
    },
    trustProxy: true
  });

  await app.register(helmet, {
    contentSecurityPolicy: false
  });

  await app.register(cors, {
    credentials: true,
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Not allowed by CORS"), false);
    }
  });

  await app.register(cookie, {
    secret: env.COOKIE_SECRET
  });

  await app.register(jwt, {
    secret: env.JWT_ACCESS_SECRET,
    cookie: {
      cookieName: "access_token",
      signed: false
    }
  });

  await app.register(rateLimit, {
    max: 240,
    timeWindow: "1 minute"
  });

  await app.register(prismaPlugin);

  app.get("/health", async () => ({
    ok: true,
    service: "gradusy24-taplink-api"
  }));

  await app.register(authRoutes, { prefix: "/api/auth" });
  await app.register(settingsRoutes, { prefix: "/api" });
  await app.register(linksRoutes, { prefix: "/api" });
  await app.register(clicksRoutes, { prefix: "/api" });
  await app.register(usersRoutes, { prefix: "/api/users" });
  await app.register(dashboardRoutes, { prefix: "/api/dashboard" });

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof ZodError) {
      reply.code(400).send({
        message: "Validation error",
        issues: error.flatten()
      });
      return;
    }

    const statusCode =
      typeof error === "object" &&
      error !== null &&
      "statusCode" in error &&
      typeof error.statusCode === "number"
        ? error.statusCode
        : null;

    if (statusCode) {
      reply.code(statusCode).send({
        message: error instanceof Error ? error.message : "Request failed"
      });
      return;
    }

    app.log.error(error);
    reply.code(500).send({ message: "Internal server error" });
  });

  return app;
}
