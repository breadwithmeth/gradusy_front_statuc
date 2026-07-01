import crypto from "node:crypto";
import type { FastifyInstance } from "fastify";
import { env } from "./env.js";

export type AuthTokenPayload = {
  sub: string;
  email: string;
  role: "admin" | "editor";
};

export function createRefreshToken() {
  return crypto.randomBytes(48).toString("base64url");
}

export function hashToken(token: string) {
  return crypto.createHmac("sha256", env.JWT_REFRESH_SECRET).update(token).digest("hex");
}

export function createAccessToken(app: FastifyInstance, payload: AuthTokenPayload) {
  return app.jwt.sign(payload, { expiresIn: env.ACCESS_TOKEN_TTL });
}

export function refreshTokenExpiry() {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + env.REFRESH_TOKEN_TTL_DAYS);
  return expiresAt;
}
