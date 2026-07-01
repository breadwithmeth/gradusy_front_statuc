import type { LinkInput, LinkUpdate, LoginInput, SiteSettings } from "@gradusy24/shared";
import type { ApiLink, ApiUser, DashboardResponse, SettingsResponse } from "@/types/api";

export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";

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
      "Content-Type": "application/json",
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
  publicLinks: () => apiRequest<{ links: ApiLink[] }>("/public/links", { skipRefresh: true }),
  login: (body: LoginInput) =>
    apiRequest<{ user: ApiUser }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
      skipRefresh: true
    }),
  me: () => apiRequest<{ user: ApiUser }>("/auth/me"),
  logout: () => apiRequest<{ ok: boolean }>("/auth/logout", { method: "POST", skipRefresh: true }),
  dashboard: () => apiRequest<DashboardResponse>("/dashboard"),
  links: () => apiRequest<{ links: ApiLink[] }>("/links"),
  createLink: (body: LinkInput) =>
    apiRequest<{ link: ApiLink }>("/links", {
      method: "POST",
      body: JSON.stringify(body)
    }),
  updateLink: (id: string, body: LinkUpdate) =>
    apiRequest<{ link: ApiLink }>(`/links/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body)
    }),
  deleteLink: (id: string) => apiRequest<{ ok: boolean }>(`/links/${id}`, { method: "DELETE" }),
  settings: () => apiRequest<SettingsResponse>("/settings"),
  updateSettings: (body: Partial<SiteSettings>) =>
    apiRequest<SettingsResponse>("/settings", {
      method: "PUT",
      body: JSON.stringify(body)
    })
};

export function trackingUrl(slug: string, source = "taplink") {
  return `${API_URL}/clicks/${slug}?source=${encodeURIComponent(source)}`;
}
