import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppShell } from "@/layouts/app-shell";
import { DashboardPage } from "@/pages/dashboard-page";
import { LinksPage } from "@/pages/links-page";
import { LoginPage } from "@/pages/login-page";
import { PublicTapLinkPage } from "@/pages/public-taplink-page";
import { QrPage } from "@/pages/qr-page";
import { SettingsPage } from "@/pages/settings-page";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <PublicTapLinkPage />
  },
  {
    path: "/login",
    element: <LoginPage />
  },
  {
    path: "/go/:sourceSlug",
    element: <PublicTapLinkPage />
  },
  {
    path: "/app",
    element: <AppShell />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "links", element: <LinksPage /> },
      { path: "qr", element: <QrPage /> },
      { path: "settings", element: <SettingsPage /> }
    ]
  },
  {
    path: "*",
    element: <Navigate to="/" replace />
  }
]);
