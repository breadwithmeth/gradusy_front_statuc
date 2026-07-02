import type { EntryLinkInput, LinkInput, LinkKind, LinkTarget, SiteSettings } from "@gradusy24/shared";

export type ApiUser = {
  id: string;
  email: string;
  name: string;
  role: "admin" | "editor";
  createdAt?: string;
};

export type ApiLink = LinkInput & {
  id: string;
  slug: string;
  kind: LinkKind;
  target: LinkTarget;
  clickCount: number;
  createdAt: string;
  updatedAt: string;
};

export type ApiEntryLink = EntryLinkInput & {
  id: string;
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

export type ApiSourceStat = {
  source: string;
  visits: number;
  clicks: number;
  actions: Array<{
    id: string;
    title: string;
    slug: string;
    kind: LinkKind;
    clicks: number;
  }>;
};

export type ApiSourceAnalyticsEvent = {
  id: string;
  type: "entry" | "click";
  source: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  referer?: string | null;
  country?: string | null;
  city?: string | null;
  createdAt: string;
  device: {
    device: "desktop" | "mobile" | "tablet" | "unknown";
    os: string;
    browser: string;
  };
  link?: {
    id: string;
    title: string;
    slug: string;
    kind: LinkKind;
  } | null;
};

export type SourceAnalyticsResponse = {
  source: string;
  summary: {
    visits: number;
    clicks: number;
    totalEvents: number;
  };
  actions: ApiSourceStat["actions"];
  events: ApiSourceAnalyticsEvent[];
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
  sourceStats: ApiSourceStat[];
  trend: Array<{ date: string; clicks: number }>;
};

export type SettingsResponse = {
  settings: SiteSettings & {
    id?: string;
    createdAt?: string;
    updatedAt?: string;
  };
};
