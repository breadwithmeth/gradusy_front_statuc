import type { FastifyReply } from "fastify";
import { isProduction } from "./env.js";

const baseCookieOptions = {
  httpOnly: true,
  path: "/",
  sameSite: "lax" as const,
  secure: isProduction
};

export function setAuthCookies(reply: FastifyReply, accessToken: string, refreshToken: string) {
  reply
    .setCookie("access_token", accessToken, {
      ...baseCookieOptions,
      maxAge: 60 * 15
    })
    .setCookie("refresh_token", refreshToken, {
      ...baseCookieOptions,
      maxAge: 60 * 60 * 24 * 30
    });
}

export function clearAuthCookies(reply: FastifyReply) {
  reply
    .clearCookie("access_token", { path: "/" })
    .clearCookie("refresh_token", { path: "/" });
}
