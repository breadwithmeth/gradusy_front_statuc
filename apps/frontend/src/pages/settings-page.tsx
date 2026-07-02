import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Palette, Save } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { settingsSchema, type SiteSettings } from "@gradusy24/shared";
import { BrandLogo } from "@/components/brand-logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { defaultSettings } from "@/features/taplink/content";
import { queryClient } from "@/lib/query-client";
import { api } from "@/services/api";

const colorFields = [
  { name: "primaryColor", label: "Primary" },
  { name: "accentColor", label: "Accent" },
  { name: "backgroundColor", label: "Background" }
] as const;

export function SettingsPage() {
  const settingsQuery = useQuery({
    queryKey: ["settings"],
    queryFn: api.settings,
    placeholderData: { settings: defaultSettings }
  });

  const form = useForm<SiteSettings>({
    resolver: zodResolver(settingsSchema),
    defaultValues: defaultSettings
  });

  useEffect(() => {
    form.reset(settingsQuery.data?.settings ?? defaultSettings);
  }, [settingsQuery.data?.settings, form]);

  const updateMutation = useMutation({
    mutationFn: api.updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      queryClient.invalidateQueries({ queryKey: ["public-settings"] });
    }
  });

  function onSubmit(values: SiteSettings) {
    updateMutation.mutate(values);
  }

  return (
    <div className="grid gap-6">
      <div>
        <Badge>Brand control</Badge>
        <h1 className="mt-4 text-4xl font-black leading-tight sm:text-5xl">Оформление</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Тексты публичной страницы, контакты, цвета и основные destination.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="overflow-hidden">
          <div className="brand-surface p-6">
            <BrandLogo className="bg-transparent shadow-none" />
          </div>
          <CardHeader>
            <CardTitle>Превью бренда</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-3xl bg-secondary p-5">
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-white text-brand-orange">
                  <Palette className="size-5" />
                </div>
                <div>
                  <p className="font-bold">{form.watch("brandName")}</p>
                  <p className="text-sm text-muted-foreground">{form.watch("headline")}</p>
                </div>
              </div>
              <p className="mt-5 text-sm leading-6 text-muted-foreground">{form.watch("description")}</p>
              <div className="mt-5 grid grid-cols-3 gap-3">
                {colorFields.map((field) => (
                  <div key={field.name} className="rounded-2xl bg-white p-3">
                    <div
                      className="h-10 rounded-xl border border-border"
                      style={{ backgroundColor: form.watch(field.name) }}
                    />
                    <p className="mt-2 text-xs font-semibold text-muted-foreground">{field.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Настройки страницы</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-5" onSubmit={form.handleSubmit(onSubmit)}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="brandName">Название бренда</Label>
                  <Input id="brandName" {...form.register("brandName")} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Телефон</Label>
                  <Input id="phone" {...form.register("phone")} />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="headline">Заголовок Hero</Label>
                <Input id="headline" {...form.register("headline")} />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Описание</Label>
                <Textarea id="description" {...form.register("description")} />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {colorFields.map((field) => (
                  <div key={field.name} className="grid gap-2">
                    <Label htmlFor={field.name}>{field.label}</Label>
                    <Input id={field.name} type="color" className="h-12 p-2" {...form.register(field.name)} />
                  </div>
                ))}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="appStoreUrl">App Store</Label>
                  <Input id="appStoreUrl" {...form.register("appStoreUrl")} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="googlePlayUrl">Google Play</Label>
                  <Input id="googlePlayUrl" {...form.register("googlePlayUrl")} />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <Input id="whatsapp" {...form.register("whatsapp")} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="telegram">Telegram</Label>
                  <Input id="telegram" {...form.register("telegram")} />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="instagram">Instagram</Label>
                  <Input id="instagram" {...form.register("instagram")} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="website">Сайт</Label>
                  <Input id="website" {...form.register("website")} />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="qrTargetUrl">QR destination</Label>
                <Input id="qrTargetUrl" {...form.register("qrTargetUrl")} />
              </div>

              {Object.keys(form.formState.errors).length > 0 ? (
                <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-destructive">
                  Проверьте поля настроек.
                </p>
              ) : null}
              {updateMutation.isError ? (
                <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-destructive">
                  Не удалось сохранить настройки.
                </p>
              ) : null}

              <Button type="submit" size="lg" disabled={updateMutation.isPending}>
                <Save className="size-4" />
                {updateMutation.isPending ? "Сохраняем..." : "Сохранить"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
