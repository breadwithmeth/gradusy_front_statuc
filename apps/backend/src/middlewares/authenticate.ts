import type { FastifyReply, FastifyRequest } from "fastify";
import type { AuthTokenPayload } from "../utils/security.js";

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: AuthTokenPayload;
    user: AuthTokenPayload;
  }
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify({ onlyCookie: true });
  } catch {
    reply.code(401).send({ message: "Authentication required" });
  }
}
