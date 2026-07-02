import { useMutation, useQuery } from "@tanstack/react-query";
import { BarChart3, Check, Copy, Download, ExternalLink, ListChecks, Plus, QrCode, Trash2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useMemo, useState } from "react";
import { brand } from "@/lib/brand";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EntryActionsModal } from "@/features/actions/entry-actions-modal";
import { SourceAnalyticsModal } from "@/features/analytics/source-analytics-modal";
import { defaultEntryLinks, defaultLinks, defaultSettings } from "@/features/taplink/content";
import { queryClient } from "@/lib/query-client";
import { api, trackingUrl } from "@/services/api";

const transliterationMap: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "e",
  ж: "zh",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "h",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "sch",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya"
};

function slugify(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .split("")
    .map((char) => transliterationMap[char] ?? char)
    .join("")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 80);

  return slug.length >= 2 ? slug : "source";
}

function randomSlugPart(length = 8) {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = new Uint8Array(length);

  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }

  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}

function randomEntrySlug(existingSlugs = new Set<string>()) {
  let slug = `go-${randomSlugPart()}`;

  while (existingSlugs.has(slug)) {
    slug = `go-${randomSlugPart()}`;
  }

  return slug;
}

export function QrPage() {
  const [copied, setCopied] = useState(false);
  const [entryTitle, setEntryTitle] = useState("");
  const [entryDescription, setEntryDescription] = useState("");
  const [entrySlug, setEntrySlug] = useState(() => randomEntrySlug());
  const [selectedSourceSlug, setSelectedSourceSlug] = useState<string | null>(null);
  const [selectedActionsEntry, setSelectedActionsEntry] = useState<(typeof defaultEntryLinks)[number] | null>(null);
  const settingsQuery = useQuery({
    queryKey: ["settings"],
    queryFn: api.settings,
    placeholderData: { settings: defaultSettings }
  });
  const entryLinksQuery = useQuery({
    queryKey: ["entry-links"],
    queryFn: api.entryLinks,
    placeholderData: { entryLinks: defaultEntryLinks }
  });
  const entryLinks = useMemo(
    () => [...(entryLinksQuery.data?.entryLinks ?? defaultEntryLinks)].sort((a, b) => a.sortOrder - b.sortOrder),
    [entryLinksQuery.data?.entryLinks]
  );
  const actionsQuery = useQuery({
    queryKey: ["links"],
    queryFn: api.links,
    placeholderData: { links: defaultLinks }
  });
  const actions = useMemo(
    () => [...(actionsQuery.data?.links ?? defaultLinks)].sort((a, b) => a.sortOrder - b.sortOrder),
    [actionsQuery.data?.links]
  );
  const presets = useMemo(() => {
    return [
      ...entryLinks.map((entryLink) => ({
        label: entryLink.title,
        value: trackingUrl(entryLink.slug)
      })),
      { label: "Сайт", value: settingsQuery.data?.settings.website ?? defaultSettings.website },
    ];
  }, [entryLinks, settingsQuery.data?.settings.website]);

  const [value, setValue] = useState(settingsQuery.data?.settings.qrTargetUrl ?? defaultSettings.qrTargetUrl);

  const createEntryLinkMutation = useMutation({
    mutationFn: api.createEntryLink,
    onSuccess: ({ entryLink }) => {
      queryClient.invalidateQueries({ queryKey: ["entry-links"] });
      setValue(trackingUrl(entryLink.slug));
      setEntryTitle("");
      setEntryDescription("");
      setEntrySlug(randomEntrySlug(new Set([...entryLinks.map((item) => item.slug), entryLink.slug])));
    }
  });

  const deleteEntryLinkMutation = useMutation({
    mutationFn: api.deleteEntryLink,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entry-links"] });
    }
  });

  function downloadSvg() {
    const svg = document.getElementById("gradusy24-qr");
    if (!svg) {
      return;
    }

    const source = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "gradusy24-qr.svg";
    link.click();
    URL.revokeObjectURL(url);
  }

  async function copyValue() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  function createEntryLink() {
    if (!entryTitle.trim() || !entrySlug.trim()) {
      return;
    }

    createEntryLinkMutation.mutate({
      title: entryTitle.trim(),
      description: entryDescription.trim(),
      slug: slugify(entrySlug),
      isActive: true,
      sortOrder: (entryLinks.at(-1)?.sortOrder ?? 0) + 10
    });
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <Badge>QR builder</Badge>
          <h1 className="mt-4 text-4xl font-black leading-tight sm:text-5xl">QR-коды</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Генерация QR для витрин, чеков, сторис и промо-материалов с tracked destination.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={copyValue}>
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            {copied ? "Скопировано" : "Копировать"}
          </Button>
          <Button onClick={downloadSvg}>
            <Download className="size-4" />
            SVG
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardContent className="p-6">
            <div className="relative mx-auto flex aspect-square max-w-[480px] items-center justify-center rounded-[2rem] bg-white p-8 shadow-soft">
              <QRCodeSVG
                id="gradusy24-qr"
                value={value}
                size={360}
                bgColor="#FFFFFF"
                fgColor="#111111"
                level="H"
                marginSize={3}
                className="h-full w-full"
              />
              <img
                src={brand.logoMini}
                alt=""
                className="absolute left-1/2 top-1/2 size-20 -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-brand-ink p-3 shadow-card"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Destination</CardTitle>
            <p className="text-sm text-muted-foreground">Значение будет закодировано в QR.</p>
          </CardHeader>
          <CardContent className="grid gap-5">
            <div className="grid gap-2">
              <Label htmlFor="qr-value">URL</Label>
              <Input id="qr-value" value={value} onChange={(event) => setValue(event.target.value)} />
            </div>

            <div className="grid gap-3 rounded-3xl bg-muted p-4">
              <div>
                <p className="text-sm font-bold">Новый /go вход</p>
                <p className="text-xs text-muted-foreground">
                  Этот slug будет источником аналитики: /go/slug -&gt; whatsapp.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="entry-title">Название</Label>
                  <Input
                    id="entry-title"
                    value={entryTitle}
                    placeholder="Instagram bio"
                    onChange={(event) => setEntryTitle(event.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="entry-slug">Slug</Label>
                  <Input
                    id="entry-slug"
                    value={entrySlug}
                    placeholder="go-a1b2c3d4"
                    onChange={(event) => {
                      setEntrySlug(slugify(event.target.value));
                    }}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="entry-description">Описание</Label>
                <Textarea
                  id="entry-description"
                  value={entryDescription}
                  placeholder="Для QR на витрине, сторис, профиля Instagram..."
                  onChange={(event) => setEntryDescription(event.target.value)}
                />
              </div>
              <Button type="button" onClick={createEntryLink} disabled={createEntryLinkMutation.isPending}>
                <Plus className="size-4" />
                {createEntryLinkMutation.isPending ? "Создаем..." : "Создать /go"}
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {presets.map((preset) => (
                <button
                  key={`${preset.label}-${preset.value}`}
                  className="flex min-h-16 items-center justify-between gap-3 rounded-3xl border border-border bg-white p-4 text-left transition hover:border-brand-orange hover:bg-secondary"
                  type="button"
                  onClick={() => setValue(preset.value)}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold">{preset.label}</span>
                    <span className="mt-1 block truncate text-xs text-muted-foreground">{preset.value}</span>
                  </span>
                  <ExternalLink className="size-4 shrink-0 text-brand-orange" />
                </button>
              ))}
            </div>

            <div className="grid gap-3">
              <p className="text-sm font-bold">Список /go ссылок</p>
              {entryLinks.map((entryLink) => (
                <div
                  key={entryLink.id}
                  className="grid gap-3 rounded-3xl border border-border bg-white p-4 sm:grid-cols-[1fr_auto] sm:items-center"
                >
                  <button type="button" className="min-w-0 text-left" onClick={() => setValue(trackingUrl(entryLink.slug))}>
                    <span className="block truncate text-sm font-bold">{entryLink.title}</span>
                    <span className="mt-1 block truncate text-xs text-muted-foreground">{trackingUrl(entryLink.slug)}</span>
                    <span className="mt-1 block truncate text-xs font-semibold text-brand-orange">
                      {entryLink.actionIds ? `${entryLink.actionIds.length} действий` : "все действия"}
                    </span>
                  </button>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="icon" onClick={() => setSelectedSourceSlug(entryLink.slug)}>
                      <BarChart3 className="size-4" />
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => setSelectedActionsEntry(entryLink)}>
                      <ListChecks className="size-4" />
                      Действия
                    </Button>
                    <Button type="button" variant="outline" size="icon" onClick={() => void navigator.clipboard.writeText(trackingUrl(entryLink.slug))}>
                      <Copy className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => deleteEntryLinkMutation.mutate(entryLink.id)}
                      disabled={deleteEntryLinkMutation.isPending}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-3xl bg-brand-ink p-5 text-white">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-2xl bg-white/10">
                  <QrCode className="size-5 text-brand-orange" />
                </span>
                <div>
                  <p className="font-bold">Gradusy24 QR</p>
                  <p className="text-sm text-white/60">SVG подходит для печати и digital-макетов.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <EntryActionsModal entryLink={selectedActionsEntry} actions={actions} onClose={() => setSelectedActionsEntry(null)} />
      <SourceAnalyticsModal sourceSlug={selectedSourceSlug} onClose={() => setSelectedSourceSlug(null)} />
    </div>
  );
}
