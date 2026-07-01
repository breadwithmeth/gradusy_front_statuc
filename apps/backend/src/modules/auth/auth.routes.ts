import bcrypt from "bcrypt";
import type { FastifyPluginAsync } from "fastify";
import { loginSchema } from "@gradusy24/shared";
import { authenticate } from "../../middlewares/authenticate.js";
import { clearAuthCookies, setAuthCookies } from "../../utils/http.js";
import {
  createAccessToken,
  createRefreshToken,
  hashToken,
  refreshTokenExpiry
} from "../../utils/security.js";

const userSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  createdAt: true
} as const;

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.post("/login", async (request, reply) => {
    const body = loginSchema.parse(request.body);
    const user = await app.prisma.user.findUnique({
      where: { email: body.email }
    });

    if (!user || !user.isActive) {
      reply.code(401).send({ message: "Invalid email or password" });
      return;
    }

    const isPasswordValid = await bcrypt.compare(body.password, user.passwordHash);

    if (!isPasswordValid) {
      reply.code(401).send({ message: "Invalid email or password" });
      return;
    }

    const refreshToken = createRefreshToken();
    const accessToken = createAccessToken(app, {
      sub: user.id,
      email: user.email,
      role: user.role
    });

    await app.prisma.session.create({
      data: {
        userId: user.id,
        refreshTokenHash: hashToken(refreshToken),
        userAgent: request.headers["user-agent"],
        ipAddress: request.ip,
        expiresAt: refreshTokenExpiry()
      }
    });

    setAuthCookies(reply, accessToken, refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    };
  });

  app.post("/refresh", async (request, reply) => {
    const refreshToken = request.cookies.refresh_token;

    if (!refreshToken) {
      clearAuthCookies(reply);
      reply.code(401).send({ message: "Refresh token is missing" });
      return;
    }

    const currentHash = hashToken(refreshToken);
    const session = await app.prisma.session.findUnique({
      where: { refreshTokenHash: currentHash },
      include: { user: true }
    });

    if (!session || session.revokedAt || session.expiresAt < new Date() || !session.user.isActive) {
      clearAuthCookies(reply);
      reply.code(401).send({ message: "Refresh token is invalid" });
      return;
    }

    const nextRefreshToken = createRefreshToken();
    const accessToken = createAccessToken(app, {
      sub: session.user.id,
      email: session.user.email,
      role: session.user.role
    });

    await app.prisma.$transaction([
      app.prisma.session.update({
        where: { id: session.id },
        data: { revokedAt: new Date() }
      }),
      app.prisma.session.create({
        data: {
          userId: session.user.id,
          refreshTokenHash: hashToken(nextRefreshToken),
          userAgent: request.headers["user-agent"],
          ipAddress: request.ip,
          expiresAt: refreshTokenExpiry()
        }
      })
    ]);

    setAuthCookies(reply, accessToken, nextRefreshToken);

    return {
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role
      }
    };
  });

  app.get("/me", { preHandler: authenticate }, async (request, reply) => {
    const user = await app.prisma.user.findUnique({
      where: { id: request.user.sub },
      select: userSelect
    });

    if (!user) {
      clearAuthCookies(reply);
      reply.code(401).send({ message: "User is not available" });
      return;
    }

    return { user };
  });

  app.post("/logout", async (request, reply) => {
    const refreshToken = request.cookies.refresh_token;

    if (refreshToken) {
      await app.prisma.session
        .update({
          where: { refreshTokenHash: hashToken(refreshToken) },
          data: { revokedAt: new Date() }
        })
        .catch(() => null);
    }

    clearAuthCookies(reply);
    return { ok: true };
  });
};
