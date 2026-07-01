import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Activity, ArrowUpRight, Link2, MousePointerClick, QrCode } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fallbackDashboard } from "@/features/taplink/content";
import { LinkIcon } from "@/features/taplink/icons";
import { formatDateTime, formatNumber } from "@/lib/utils";
import { api } from "@/services/api";

const summaryCards = [
  { key: "totalClicks", label: "Всего переходов", icon: MousePointerClick },
  { key: "clicks24h", label: "За 24 часа", icon: Activity },
  { key: "activeLinks", label: "Активных ссылок", icon: Link2 },
  { key: "qrScans", label: "QR-сканы", icon: QrCode }
] as const;

export function DashboardPage() {
  const dashboardQuery = useQuery({
    queryKey: ["dashboard"],
    queryFn: api.dashboard,
    placeholderData: fallbackDashboard
  });

  const dashboard = dashboardQuery.data ?? fallbackDashboard;
  const maxTrend = Math.max(...dashboard.trend.map((item) => item.clicks), 1);

  return (
    <div className="grid gap-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <Badge>Live analytics</Badge>
          <h1 className="mt-4 text-4xl font-black leading-tight sm:text-5xl">Панель управления</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Сводка переходов, популярных ссылок и последних действий на TapLink-странице.
          </p>
        </div>
        {dashboardQuery.isFetching ? <Badge className="bg-white">Обновление...</Badge> : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card, index) => (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
          >
            <Card className="p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                  <p className="mt-3 text-3xl font-black">
                    {formatNumber(dashboard.summary[card.key])}
                  </p>
                </div>
                <span className="flex size-12 items-center justify-center rounded-2xl bg-secondary text-brand-orange">
                  <card.icon className="size-5" />
                </span>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader className="flex-row items-center justify-between gap-4">
            <div>
              <CardTitle>Динамика за 14 дней</CardTitle>
              <p className="mt-2 text-sm text-muted-foreground">Сгруппированные клики по датам.</p>
            </div>
            <ArrowUpRight className="size-5 text-brand-orange" />
          </CardHeader>
          <CardContent>
            <div className="flex h-72 items-end gap-2 rounded-3xl bg-[#fbfaf7] p-4">
              {dashboard.trend.map((item) => (
                <div key={item.date} className="flex h-full min-w-0 flex-1 flex-col justify-end gap-2">
                  <div
                    className="min-h-4 rounded-t-2xl bg-brand-orange"
                    style={{ height: `${Math.max((item.clicks / maxTrend) * 100, 8)}%` }}
                    title={`${item.date}: ${item.clicks}`}
                  />
                  <span className="truncate text-center text-[10px] text-muted-foreground">
                    {item.date.slice(5)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Топ ссылок</CardTitle>
            <p className="text-sm text-muted-foreground">По накопленным кликам.</p>
          </CardHeader>
          <CardContent className="grid gap-3">
            {dashboard.topLinks.map((link) => (
              <div key={link.id} className="flex items-center gap-3 rounded-3xl bg-muted p-3">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-white text-brand-orange">
                  <LinkIcon name={link.kind === "website" ? "Globe2" : undefined} className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{link.title}</p>
                  <p className="truncate text-xs text-muted-foreground">/{link.slug}</p>
                </div>
                <Badge className="bg-white">{formatNumber(link.clickCount)}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Последние переходы</CardTitle>
          <p className="text-sm text-muted-foreground">События из системы отслеживания ссылок.</p>
        </CardHeader>
        <CardContent className="grid gap-3">
          {dashboard.recentClicks.map((click) => (
            <div key={click.id} className="grid gap-3 rounded-3xl border border-border p-4 sm:grid-cols-[1fr_auto] sm:items-center">
              <div className="min-w-0">
                <p className="truncate font-semibold">{click.link.title}</p>
                <p className="mt-1 truncate text-sm text-muted-foreground">
                  /{click.link.slug} · {click.source ?? "direct"} · {click.referer ?? "no referer"}
                </p>
              </div>
              <span className="text-sm font-semibold text-muted-foreground">
                {formatDateTime(click.createdAt)}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
