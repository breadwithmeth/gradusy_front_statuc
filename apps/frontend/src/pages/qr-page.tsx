import { useQuery } from "@tanstack/react-query";
import { Check, Copy, Download, ExternalLink, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useMemo, useState } from "react";
import { brand } from "@/lib/brand";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { defaultLinks, defaultSettings } from "@/features/taplink/content";
import { api, trackingUrl } from "@/services/api";

export function QrPage() {
  const [copied, setCopied] = useState(false);
  const settingsQuery = useQuery({
    queryKey: ["settings"],
    queryFn: api.settings,
    placeholderData: { settings: defaultSettings }
  });
  const linksQuery = useQuery({
    queryKey: ["links"],
    queryFn: api.links,
    placeholderData: { links: defaultLinks }
  });

  const presets = useMemo(() => {
    const links = linksQuery.data?.links ?? defaultLinks;
    return [
      { label: "TapLink", value: window.location.origin },
      { label: "Сайт", value: settingsQuery.data?.settings.website ?? defaultSettings.website },
      ...links.slice(0, 5).map((link) => ({
        label: link.title,
        value: trackingUrl(link.slug, "qr")
      }))
    ];
  }, [linksQuery.data?.links, settingsQuery.data?.settings.website]);

  const [value, setValue] = useState(settingsQuery.data?.settings.qrTargetUrl ?? defaultSettings.qrTargetUrl);

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
    </div>
  );
}
