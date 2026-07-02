import type { FastifyInstance } from "fastify";

export const ENTRY_VISIT_LINK_SLUG = "__entry-visit";

export const visibleLinkWhere = {
  slug: { not: ENTRY_VISIT_LINK_SLUG }
};

export async function ensureEntryVisitTrackingLink(app: FastifyInstance) {
  return app.prisma.link.upsert({
    where: { slug: ENTRY_VISIT_LINK_SLUG },
    update: {
      isActive: false
    },
    create: {
      title: "Entry visits",
      description: "Internal /go source visit tracking",
      href: "/",
      slug: ENTRY_VISIT_LINK_SLUG,
      kind: "website",
      target: "frontend",
      icon: "MousePointerClick",
      isActive: false,
      sortOrder: 1000
    }
  });
}
