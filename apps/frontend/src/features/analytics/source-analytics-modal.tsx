import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Activity, Eye, ListChecks, MousePointerClick, Smartphone, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { LinkIcon } from "@/features/taplink/icons";
import { queryClient } from "@/lib/query-client";
import { formatDateTime, formatNumber } from "@/lib/utils";
import { api } from "@/services/api";
import type { ApiEntryLink } from "@/types/api";

type SourceAnalyticsModalProps = {
  sourceSlug: string | null;
  onClose: () => void;
};

function deviceLabel(device: string) {
  if (device === "mobile") {
    return "Mobile";
  }

  if (device === "tablet") {
    return "Tablet";
  }

  if (device === "desktop") {
    return "Desktop";
  }

  return "Unknown";
}

export function SourceAnalyticsModal({ sourceSlug, onClose }: SourceAnalyticsModalProps) {
  const isOpen = Boolean(sourceSlug);
  const analyticsQuery = useQuery({
    queryKey: ["source-analytics", sourceSlug],
    queryFn: () => api.sourceAnalytics(sourceSlug ?? ""),
    enabled: isOpen
  });
  const entryLinksQuery = useQuery({
    queryKey: ["entry-links"],
    queryFn: api.entryLinks,
    enabled: isOpen
  });
  const actionsQuery = useQuery({
    queryKey: ["links"],
    queryFn: api.links,
    enabled: isOpen
  });

  const actions = useMemo(() => actionsQuery.data?.links ?? [], [actionsQuery.data?.links]);
  const entryLink = useMemo(
    () => entryLinksQuery.data?.entryLinks.find((item) => item.slug === sourceSlug) ?? null,
    [entryLinksQuery.data?.entryLinks, sourceSlug]
  );
  const activeActionIds = useMemo(
    () => actions.filter((action) => action.isActive).map((action) => action.id),
    [actions]
  );
  const entryActionIds = entryLink?.actionIds;
  const defaultSelectedActionIds = useMemo(
    () => new Set(entryActionIds ?? activeActionIds),
    [activeActionIds, entryActionIds]
  );
  const [selectedActionIds, setSelectedActionIds] = useState<Set<string>>(defaultSelectedActionIds);

  useEffect(() => {
    if (isOpen) {
      setSelectedActionIds(defaultSelectedActionIds);
    }
  }, [defaultSelectedActionIds, isOpen]);

  const saveActionsMutation = useMutation({
    mutationFn: (actionIds: string[]) => {
      if (!entryLink) {
        throw new Error("Entry link not found");
      }

      return api.updateEntryLink(entryLink.id, {
        actionIds
      });
    },
    onSuccess: ({ entryLink: updatedEntryLink }) => {
      queryClient.setQueryData<{ entryLinks: ApiEntryLink[] }>(["entry-links"], (current) =>
        current
          ? {
              entryLinks: current.entryLinks.map((item) =>
                item.id === updatedEntryLink.id ? updatedEntryLink : item
              )
            }
          : current
      );
      queryClient.invalidateQueries({ queryKey: ["entry-links"] });
      queryClient.invalidateQueries({ queryKey: ["public-links"] });
    }
  });

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const analytics = analyticsQuery.data;
  const maxActionClicks = Math.max(...(analytics?.actions.map((action) => action.clicks) ?? []), 1);

  function saveActionSelection(next: Set<string>) {
    setSelectedActionIds(next);
    saveActionsMutation.mutate(Array.from(next));
  }

  function toggleAction(actionId: string) {
    const next = new Set(selectedActionIds);

    if (next.has(actionId)) {
      next.delete(actionId);
    } else {
      next.add(actionId);
    }

    saveActionSelection(next);
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 p-3 backdrop-blur-sm sm:p-6" role="dialog" aria-modal="true">
      <button className="fixed inset-0 cursor-default" type="button" aria-label="Закрыть" onClick={onClose} />

      <div className="relative mx-auto grid max-h-[calc(100svh_-_24px)] w-full max-w-5xl overflow-hidden rounded-[28px] bg-white shadow-2xl sm:max-h-[calc(100svh_-_48px)]">
        <div className="flex items-start justify-between gap-4 border-b border-border p-5 sm:p-6">
          <div className="min-w-0">
            <Badge className="bg-secondary">/go analytics</Badge>
            <h2 className="mt-3 truncate text-2xl font-black sm:text-3xl">/go/{sourceSlug}</h2>
            <p className="mt-1 text-sm text-muted-foreground">IP, устройство, источник и последние события по slug.</p>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Закрыть">
            <X className="size-5" />
          </Button>
        </div>

        <div className="grid max-h-[calc(100svh_-_150px)] gap-5 overflow-y-auto p-5 sm:p-6">
          {analyticsQuery.isLoading ? (
            <div className="rounded-2xl bg-muted p-5 text-sm text-muted-foreground">Загружаем аналитику...</div>
          ) : analyticsQuery.isError ? (
            <div className="rounded-2xl bg-red-50 p-5 text-sm font-semibold text-red-700">
              Не удалось загрузить аналитику по этому slug.
            </div>
          ) : analytics ? (
            <>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-muted p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-muted-foreground">Входы</p>
                    <Eye className="size-4 text-brand-orange" />
                  </div>
                  <p className="mt-3 text-3xl font-black">{formatNumber(analytics.summary.visits)}</p>
                </div>
                <div className="rounded-2xl bg-muted p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-muted-foreground">Клики</p>
                    <MousePointerClick className="size-4 text-brand-orange" />
                  </div>
                  <p className="mt-3 text-3xl font-black">{formatNumber(analytics.summary.clicks)}</p>
                </div>
                <div className="rounded-2xl bg-muted p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-muted-foreground">События</p>
                    <Activity className="size-4 text-brand-orange" />
                  </div>
                  <p className="mt-3 text-3xl font-black">{formatNumber(analytics.summary.totalEvents)}</p>
                </div>
              </div>

              <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
                <div className="grid content-start gap-3">
                  <div className="grid gap-3 rounded-2xl bg-muted p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-white text-brand-orange">
                          <ListChecks className="size-5" />
                        </span>
                        <div className="min-w-0">
                          <p className="font-black">Настройка действий</p>
                          <p className="mt-1 truncate text-sm text-muted-foreground">Что видно на /go/{sourceSlug}.</p>
                        </div>
                      </div>
                      <Badge className="bg-white">
                        {entryLink ? `${selectedActionIds.size}/${actions.length}` : "нет записи"}
                      </Badge>
                    </div>

                    {entryLinksQuery.isLoading || actionsQuery.isLoading ? (
                      <p className="rounded-2xl bg-white p-3 text-sm text-muted-foreground">Загружаем действия...</p>
                    ) : entryLinksQuery.isError || actionsQuery.isError ? (
                      <p className="rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700">
                        Не удалось загрузить список действий.
                      </p>
                    ) : !entryLink ? (
                      <p className="rounded-2xl bg-white p-3 text-sm text-muted-foreground">
                        Этот slug есть в аналитике, но не создан в списке /go. Создайте его на странице QR, чтобы редактировать
                        действия.
                      </p>
                    ) : (
                      <>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => saveActionSelection(new Set(activeActionIds))}
                          >
                            Все активные
                          </Button>
                          <Button type="button" variant="outline" size="sm" onClick={() => saveActionSelection(new Set())}>
                            Очистить
                          </Button>
                          <Badge className="bg-white">
                            {saveActionsMutation.isPending
                              ? "Сохраняем..."
                              : saveActionsMutation.isSuccess
                                ? "Сохранено"
                                : "Автосохранение"}
                          </Badge>
                        </div>

                        <div className="grid gap-2">
                          {actions.length ? (
                            actions.map((action) => (
                              <div
                                key={action.id}
                                role="button"
                                tabIndex={0}
                                className="flex items-center gap-3 rounded-2xl bg-white p-3 text-left transition hover:bg-secondary"
                                onClick={() => toggleAction(action.id)}
                                onKeyDown={(event) => {
                                  if (event.key === "Enter" || event.key === " ") {
                                    event.preventDefault();
                                    toggleAction(action.id);
                                  }
                                }}
                              >
                                <span className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-brand-ink text-white">
                                  <LinkIcon name={action.icon} className="size-4" />
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="flex flex-wrap items-center gap-2">
                                    <span className="truncate text-sm font-bold">{action.title}</span>
                                    {!action.isActive ? <Badge className="bg-muted">скрыто</Badge> : null}
                                  </span>
                                  <span className="mt-1 block truncate text-xs text-muted-foreground">{action.description}</span>
                                </span>
                                <span onClick={(event) => event.stopPropagation()}>
                                  <Switch
                                    aria-label={`Показывать ${action.title}`}
                                    checked={selectedActionIds.has(action.id)}
                                    onChange={() => toggleAction(action.id)}
                                  />
                                </span>
                              </div>
                            ))
                          ) : (
                            <p className="rounded-2xl bg-white p-3 text-sm text-muted-foreground">Действия ещё не созданы.</p>
                          )}
                        </div>

                        {saveActionsMutation.isError ? (
                          <p className="rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700">
                            Не удалось сохранить действия для этого slug.
                          </p>
                        ) : null}
                      </>
                    )}
                  </div>

                  <div>
                    <p className="font-black">Действия после входа</p>
                    <p className="mt-1 text-sm text-muted-foreground">Какие действия нажимали после /go/{sourceSlug}.</p>
                  </div>
                  {analytics.actions.length ? (
                    analytics.actions.map((action) => (
                      <div key={action.id} className="rounded-2xl bg-muted p-3">
                        <div className="flex items-center gap-3">
                          <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-white text-brand-orange">
                            <LinkIcon name={action.kind === "website" ? "Globe2" : undefined} className="size-5" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold">{action.title}</p>
                            <p className="truncate text-xs text-muted-foreground">{action.slug}</p>
                          </div>
                          <Badge className="bg-white">{formatNumber(action.clicks)}</Badge>
                        </div>
                        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white">
                          <div
                            className="h-full rounded-full bg-brand-orange"
                            style={{ width: `${Math.max((action.clicks / maxActionClicks) * 100, 8)}%` }}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl bg-muted p-4 text-sm text-muted-foreground">
                      После этого входа ещё не нажимали действия.
                    </div>
                  )}
                </div>

                <div className="grid content-start gap-3">
                  <div>
                    <p className="font-black">Последние запросы</p>
                    <p className="mt-1 text-sm text-muted-foreground">До 200 последних событий по этому slug.</p>
                  </div>
                  {analytics.events.length ? (
                    analytics.events.map((event) => (
                      <div key={event.id} className="grid gap-3 rounded-2xl border border-border p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <Badge className={event.type === "entry" ? "bg-secondary" : "bg-white"}>
                            {event.type === "entry" ? "Вход" : event.link?.title ?? "Клик"}
                          </Badge>
                          <span className="text-xs font-semibold text-muted-foreground">{formatDateTime(event.createdAt)}</span>
                        </div>

                        <div className="grid gap-2 text-sm sm:grid-cols-2">
                          <div>
                            <p className="text-xs uppercase text-muted-foreground">IP</p>
                            <p className="mt-1 break-all font-semibold">{event.ipAddress ?? "unknown"}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase text-muted-foreground">Устройство</p>
                            <p className="mt-1 flex items-center gap-2 font-semibold">
                              <Smartphone className="size-4 text-brand-orange" />
                              {deviceLabel(event.device.device)} · {event.device.os} · {event.device.browser}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs uppercase text-muted-foreground">Referer</p>
                            <p className="mt-1 break-all font-semibold">{event.referer ?? "no referer"}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase text-muted-foreground">Действие</p>
                            <p className="mt-1 break-all font-semibold">
                              {event.type === "entry" ? `/go/${event.source ?? sourceSlug}` : event.link?.slug ?? "unknown"}
                            </p>
                          </div>
                        </div>

                        <div>
                          <p className="text-xs uppercase text-muted-foreground">User-Agent</p>
                          <p className="mt-1 break-all text-xs leading-5 text-muted-foreground">
                            {event.userAgent ?? "unknown"}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl bg-muted p-4 text-sm text-muted-foreground">
                      Событий по этому slug пока нет.
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
