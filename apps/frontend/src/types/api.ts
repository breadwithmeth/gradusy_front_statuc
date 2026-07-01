import type { LinkInput, LinkKind, SiteSettings } from "@gradusy24/shared";

export type ApiUser = {
  id: string;
  email: string;
  name: string;
  role: "admin" | "editor";
  createdAt?: string;
};

export type ApiLink = LinkInput & {
  id: string;
  kind: LinkKind;
  clickCount: number;
  createdAt: string;
  updatedAt: string;
};

export type ApiClick = {
  id: string;
  source?: string | null;
  referer?: string | null;
  userAgent?: string | null;
  ipAddress?: string | null;
  createdAt: string;
  link: {
    title: string;
    slug: string;
    kind: LinkKind;
  };
};

export type DashboardResponse = {
  summary: {
    totalClicks: number;
    activeLinks: number;
    clicks24h: number;
    qrScans: number;
  };
  topLinks: Pick<ApiLink, "id" | "title" | "slug" | "kind" | "clickCount">[];
  recentClicks: ApiClick[];
  trend: Array<{ date: string; clicks: number }>;
};

export type SettingsResponse = {
  settings: SiteSettings & {
    id?: string;
    createdAt?: string;
    updatedAt?: string;
  };
};
