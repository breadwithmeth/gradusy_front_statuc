import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  BarChart3,
  ExternalLink,
  Link2,
  LogOut,
  QrCode,
  Settings,
  Sparkles
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { api } from "@/services/api";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/app", label: "Дашборд", icon: BarChart3, end: true },
  { to: "/app/links", label: "Действия", icon: Link2 },
  { to: "/app/qr", label: "QR", icon: QrCode },
  { to: "/app/settings", label: "Оформление", icon: Settings }
];

export function AppShell() {
  const navigate = useNavigate();
  const userQuery = useQuery({
    queryKey: ["me"],
    queryFn: api.me,
    retry: false
  });

  useEffect(() => {
    if (userQuery.isError) {
      navigate("/login");
    }
  }, [navigate, userQuery.isError]);

  const logoutMutation = useMutation({
    mutationFn: api.logout,
    onSettled: () => navigate("/login")
  });

  return (
    <div className="min-h-screen bg-[#fbfaf7]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-border bg-white/90 px-5 py-6 backdrop-blur xl:block">
        <div className="flex items-center gap-3">
          <BrandLogo compact />
          <div>
            <p className="text-sm font-bold">Градусы24</p>
            <p className="text-xs text-muted-foreground">TapLink CMS</p>
          </div>
        </div>

        <nav className="mt-10 grid gap-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "flex min-h-12 items-center gap-3 rounded-2xl px-4 text-sm font-semibold text-muted-foreground transition",
                  isActive ? "bg-brand-orange text-white shadow-card" : "hover:bg-muted hover:text-foreground"
                )
              }
            >
              <item.icon className="size-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="absolute inset-x-5 bottom-6 rounded-3xl border border-border bg-secondary p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-white text-brand-orange">
              <Sparkles className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{userQuery.data?.user.name ?? "Admin"}</p>
              <p className="truncate text-xs text-muted-foreground">
                {userQuery.data?.user.email ?? "admin@gradusy24.kz"}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            className="mt-4 w-full"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
          >
            <LogOut className="size-4" />
            Выйти
          </Button>
        </div>
      </aside>

      <div className="xl:pl-72">
        <header className="sticky top-0 z-20 border-b border-border bg-white/86 px-4 py-3 backdrop-blur xl:hidden">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <BrandLogo compact className="size-10 rounded-xl" imageClassName="size-8" />
              <span className="text-sm font-bold">TapLink CMS</span>
            </div>
            <Button asChild variant="outline" size="sm">
              <a href="/" target="_blank" rel="noreferrer">
                <ExternalLink className="size-4" />
                Сайт
              </a>
            </Button>
          </div>
          <nav className="mt-3 grid grid-cols-4 gap-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "flex min-h-10 items-center justify-center rounded-2xl text-muted-foreground transition",
                    isActive ? "bg-brand-orange text-white" : "bg-muted"
                  )
                }
                aria-label={item.label}
              >
                <item.icon className="size-4" />
              </NavLink>
            ))}
          </nav>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 xl:py-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
