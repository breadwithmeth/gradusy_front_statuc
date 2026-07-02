import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Edit3, Plus, Save, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { linkInputSchema, linkTargetSchema, type LinkInput } from "@gradusy24/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { defaultLinks } from "@/features/taplink/content";
import { iconMap } from "@/features/taplink/icon-map";
import { LinkIcon } from "@/features/taplink/icons";
import { queryClient } from "@/lib/query-client";
import { cn, formatNumber } from "@/lib/utils";
import { api } from "@/services/api";
import type { ApiLink } from "@/types/api";

const defaultFormValues: LinkInput = {
  title: "",
  description: "",
  href: "",
  kind: "website",
  target: "frontend",
  icon: "Globe2",
  isActive: true,
  sortOrder: 100
};

export function LinksPage() {
  const [editingId, setEditingId] = useState<string | null>(null);
  const linksQuery = useQuery({
    queryKey: ["links"],
    queryFn: api.links,
    placeholderData: { links: defaultLinks }
  });

  const links = useMemo(
    () => [...(linksQuery.data?.links ?? defaultLinks)].sort((a, b) => a.sortOrder - b.sortOrder),
    [linksQuery.data?.links]
  );
  const editingLink = links.find((link) => link.id === editingId) ?? null;

  const form = useForm<LinkInput>({
    resolver: zodResolver(linkInputSchema),
    defaultValues: defaultFormValues
  });

  useEffect(() => {
    if (!editingLink) {
      form.reset(defaultFormValues);
      return;
    }

    form.reset({
      title: editingLink.title,
      description: editingLink.description,
      href: editingLink.href,
      kind: editingLink.kind,
      target: editingLink.target,
      icon: editingLink.icon,
      isActive: editingLink.isActive,
      sortOrder: editingLink.sortOrder
    });
  }, [editingLink, form]);

  const saveMutation = useMutation({
    mutationFn: (values: LinkInput) =>
      editingLink ? api.updateLink(editingLink.id, values) : api.createLink(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["links"] });
      queryClient.invalidateQueries({ queryKey: ["public-links"] });
      setEditingId(null);
      form.reset(defaultFormValues);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: api.deleteLink,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["links"] });
      queryClient.invalidateQueries({ queryKey: ["public-links"] });
    }
  });

  function selectLink(link: ApiLink) {
    setEditingId(link.id);
  }

  function onSubmit(values: LinkInput) {
    saveMutation.mutate(values);
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <Badge>Tracked actions</Badge>
          <h1 className="mt-4 text-4xl font-black leading-tight sm:text-5xl">Действия</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Действия публичной страницы, порядок отображения и маршруты для аналитики.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingId(null);
          }}
        >
          <Plus className="size-4" />
          Новое действие
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Активные действия</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {links.map((link) => (
              <div
                key={link.id}
                className={cn(
                  "grid gap-4 rounded-3xl border p-4 transition md:grid-cols-[1fr_auto] md:items-center",
                  editingId === link.id ? "border-brand-orange bg-secondary" : "border-border bg-white"
                )}
              >
                <div className="flex min-w-0 items-center gap-4">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-brand-ink text-white">
                    <LinkIcon name={link.icon} className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-bold">{link.title}</p>
                      {!link.isActive ? <Badge className="bg-muted">скрыта</Badge> : null}
                      <Badge className={link.target === "direct" ? "bg-brand-ink text-white" : "bg-brand-orange text-white"}>
                        {link.target === "direct" ? "direct" : "frontend"}
                      </Badge>
                    </div>
                    <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                      {link.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 md:justify-end">
                  <Badge className="bg-white">{formatNumber(link.clickCount)}</Badge>
                  <Button variant="outline" size="icon" onClick={() => selectLink(link)} aria-label="Редактировать">
                    <Edit3 className="size-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => deleteMutation.mutate(link.id)}
                    disabled={deleteMutation.isPending}
                    aria-label="Удалить"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between gap-4">
            <div>
              <CardTitle>{editingLink ? "Редактировать действие" : "Новое действие"}</CardTitle>
              <p className="mt-2 text-sm text-muted-foreground">
                Эти действия показываются на фронте. Публичные /go/slug создаются на странице QR-кодов.
              </p>
            </div>
            {editingLink ? (
              <Button variant="ghost" size="icon" onClick={() => setEditingId(null)} aria-label="Закрыть">
                <X className="size-4" />
              </Button>
            ) : null}
          </CardHeader>
          <CardContent>
            <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
              <div className="grid gap-2">
                <Label htmlFor="title">Название</Label>
                <Input id="title" {...form.register("title")} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Описание</Label>
                <Textarea id="description" {...form.register("description")} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="href">Целевая ссылка действия</Label>
                <Input id="href" placeholder="https://... или /promo" {...form.register("href")} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="sortOrder">Порядок</Label>
                  <Input id="sortOrder" type="number" {...form.register("sortOrder", { valueAsNumber: true })} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="target">Куда ведет</Label>
                <select
                  id="target"
                  className="min-h-11 rounded-2xl border border-input bg-white px-4 text-sm"
                  {...form.register("target")}
                >
                  {linkTargetSchema.options.map((target) => (
                    <option key={target} value={target}>
                      {target === "frontend" ? "Frontend route" : "Direct URL"}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  Frontend route строится от FRONTEND_ORIGIN для относительных href. Direct URL ведет ровно в href.
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="icon">Иконка</Label>
                <select
                  id="icon"
                  className="min-h-11 rounded-2xl border border-input bg-white px-4 text-sm"
                  {...form.register("icon")}
                >
                  {Object.keys(iconMap).map((icon) => (
                    <option key={icon} value={icon}>
                      {icon}
                    </option>
                  ))}
                </select>
              </div>
              <Switch label="Показывать на странице" {...form.register("isActive")} />

              {Object.keys(form.formState.errors).length > 0 ? (
                <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-destructive">
                  Проверьте поля формы.
                </p>
              ) : null}
              {saveMutation.isError ? (
                <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-destructive">
                  Не удалось сохранить действие.
                </p>
              ) : null}

              <Button type="submit" size="lg" disabled={saveMutation.isPending}>
                <Save className="size-4" />
                {saveMutation.isPending ? "Сохраняем..." : "Сохранить"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
