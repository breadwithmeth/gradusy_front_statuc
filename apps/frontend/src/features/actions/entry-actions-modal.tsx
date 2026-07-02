import { useEffect, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Check, ListChecks, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { LinkIcon } from "@/features/taplink/icons";
import { queryClient } from "@/lib/query-client";
import { api } from "@/services/api";
import type { ApiEntryLink, ApiLink } from "@/types/api";

type EntryActionsModalProps = {
  entryLink: ApiEntryLink | null;
  actions: ApiLink[];
  onClose: () => void;
};

export function EntryActionsModal({ entryLink, actions, onClose }: EntryActionsModalProps) {
  const isOpen = Boolean(entryLink);
  const defaultSelectedIds = useMemo(
    () => new Set(entryLink?.actionIds ?? actions.filter((action) => action.isActive).map((action) => action.id)),
    [actions, entryLink?.actionIds]
  );
  const [selectedIds, setSelectedIds] = useState<Set<string>>(defaultSelectedIds);

  useEffect(() => {
    setSelectedIds(defaultSelectedIds);
  }, [defaultSelectedIds]);

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

  const saveMutation = useMutation({
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

  if (!isOpen || !entryLink) {
    return null;
  }

  function saveSelectedIds(next: Set<string>) {
    setSelectedIds(next);
    saveMutation.mutate(Array.from(next));
  }

  function toggleAction(actionId: string) {
    const next = new Set(selectedIds);

    if (next.has(actionId)) {
      next.delete(actionId);
    } else {
      next.add(actionId);
    }

    saveSelectedIds(next);
  }

  const activeActionIds = actions.filter((action) => action.isActive).map((action) => action.id);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 p-3 backdrop-blur-sm sm:p-6" role="dialog" aria-modal="true">
      <button className="fixed inset-0 cursor-default" type="button" aria-label="Закрыть" onClick={onClose} />

      <div className="relative mx-auto grid max-h-[calc(100svh_-_24px)] w-full max-w-3xl overflow-hidden rounded-[28px] bg-white shadow-2xl sm:max-h-[calc(100svh_-_48px)]">
        <div className="flex items-start justify-between gap-4 border-b border-border p-5 sm:p-6">
          <div className="min-w-0">
            <Badge className="bg-secondary">Настройка действий</Badge>
            <h2 className="mt-3 truncate text-2xl font-black sm:text-3xl">/go/{entryLink.slug}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Выберите, какие действия будут отображаться при входе по этому slug.
            </p>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Закрыть">
            <X className="size-5" />
          </Button>
        </div>

        <div className="grid max-h-[calc(100svh_-_190px)] gap-4 overflow-y-auto p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-muted p-4">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-2xl bg-white text-brand-orange">
                <ListChecks className="size-5" />
              </span>
              <div>
                <p className="font-bold">{selectedIds.size} выбрано</p>
                <p className="text-sm text-muted-foreground">
                  {saveMutation.isPending ? "Сохраняем..." : saveMutation.isSuccess ? "Сохранено" : `из ${actions.length} действий`}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => saveSelectedIds(new Set(activeActionIds))}>
                Все активные
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => saveSelectedIds(new Set())}>
                Очистить
              </Button>
            </div>
          </div>

          <div className="grid gap-2">
            {actions.map((action) => (
              <div
                key={action.id}
                role="button"
                tabIndex={0}
                className="flex items-center gap-3 rounded-2xl border border-border p-3 text-left transition hover:border-brand-orange hover:bg-secondary"
                onClick={() => toggleAction(action.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    toggleAction(action.id);
                  }
                }}
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-brand-ink text-white">
                  <LinkIcon name={action.icon} className="size-5" />
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
                    checked={selectedIds.has(action.id)}
                    onChange={() => toggleAction(action.id)}
                  />
                </span>
              </div>
            ))}
          </div>

          {saveMutation.isError ? (
            <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-destructive">
              Не удалось сохранить действия для slug.
            </p>
          ) : null}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-border p-5 sm:flex-row sm:justify-end sm:p-6">
          <Button type="button" onClick={onClose}>
            <Check className="size-4" />
            Готово
          </Button>
        </div>
      </div>
    </div>
  );
}
