import type { EntryLinkInput, EntryLinkUpdate, LinkInput, LinkUpdate, LoginInput, SiteSettings } from "@gradusy24/shared";
import type {
  ApiEntryLink,
  ApiLink,
  ApiUser,
  DashboardResponse,
  SettingsResponse,
  SourceAnalyticsResponse
} from "@/types/api";

export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";
export const FRONTEND_URL = (
  import.meta.env.VITE_FRONTEND_URL ?? (typeof window === "undefined" ? "" : window.location.origin)
).replace(/\/$/, "");

type RequestOptions = RequestInit & {
  skipRefresh?: boolean;
};

class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function parseResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new ApiError(response.status, payload?.message ?? "Request failed");
  }

  return payload as T;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers
    },
    ...options
  });

  if (response.status === 401 && !options.skipRefresh && !path.startsWith("/auth/refresh")) {
    await apiRequest("/auth/refresh", {
      method: "POST",
      skipRefresh: true
    });

    return apiRequest<T>(path, {
      ...options,
      skipRefresh: true
    });
  }

  return parseResponse<T>(response);
}

export const api = {
  publicSettings: () => apiRequest<SettingsResponse>("/public/settings", { skipRefresh: true }),
  publicLinks: (source?: string) =>
    apiRequest<{ links: ApiLink[] }>(
      `/public/links${source ? `?source=${encodeURIComponent(source)}` : ""}`,
      { skipRefresh: true }
    ),
  publicEntryLinks: () => apiRequest<{ entryLinks: ApiEntryLink[] }>("/public/entry-links", { skipRefresh: true }),
  trackEntry: (slug: string) =>
    apiRequest<{ ok: boolean }>(`/entry-visits/${encodeURIComponent(slug)}`, {
      method: "POST",
      skipRefresh: true
    }),
  trackClick: (slug: string, source = "taplink") =>
    apiRequest<{ href: string; target: "frontend" | "direct" }>(
      `/clicks/${slug}?source=${encodeURIComponent(source)}`,
      {
        method: "POST",
        skipRefresh: true
      }
    ),
  login: (body: LoginInput) =>
    apiRequest<{ user: ApiUser }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
      skipRefresh: true
    }),
  me: () => apiRequest<{ user: ApiUser }>("/auth/me"),
  logout: () => apiRequest<{ ok: boolean }>("/auth/logout", { method: "POST", skipRefresh: true }),
  dashboard: () => apiRequest<DashboardResponse>("/dashboard"),
  sourceAnalytics: (slug: string) =>
    apiRequest<SourceAnalyticsResponse>(`/entry-analytics/${encodeURIComponent(slug)}`),
  links: () => apiRequest<{ links: ApiLink[] }>("/links"),
  entryLinks: () => apiRequest<{ entryLinks: ApiEntryLink[] }>("/entry-links"),
  createLink: (body: LinkInput) =>
    apiRequest<{ link: ApiLink }>("/links", {
      method: "POST",
      body: JSON.stringify(body)
    }),
  createEntryLink: (body: EntryLinkInput) =>
    apiRequest<{ entryLink: ApiEntryLink }>("/entry-links", {
      method: "POST",
      body: JSON.stringify(body)
    }),
  updateEntryLink: (id: string, body: EntryLinkUpdate) =>
    apiRequest<{ entryLink: ApiEntryLink }>(`/entry-links/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body)
    }),
  updateLink: (id: string, body: LinkUpdate) =>
    apiRequest<{ link: ApiLink }>(`/links/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body)
    }),
  deleteLink: (id: string) => apiRequest<{ ok: boolean }>(`/links/${id}`, { method: "DELETE" }),
  deleteEntryLink: (id: string) => apiRequest<{ ok: boolean }>(`/entry-links/${id}`, { method: "DELETE" }),
  settings: () => apiRequest<SettingsResponse>("/settings"),
  updateSettings: (body: Partial<SiteSettings>) =>
    apiRequest<SettingsResponse>("/settings", {
      method: "PUT",
      body: JSON.stringify(body)
    })
};

export function trackingUrl(slug: string, source?: string) {
  const path = `/go/${slug}${source ? `?source=${encodeURIComponent(source)}` : ""}`;
  return FRONTEND_URL ? `${FRONTEND_URL}${path}` : path;
}

export function linkDestination(link: Pick<ApiLink, "href" | "target">) {
  if (link.target === "direct") {
    return link.href;
  }

  try {
    return new URL(link.href).toString();
  } catch {
    const path = link.href.startsWith("/") ? link.href : `/${link.href}`;
    return FRONTEND_URL ? `${FRONTEND_URL}${path}` : path;
  }
}
