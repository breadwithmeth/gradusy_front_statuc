import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { brand } from "@/lib/brand";
import { api, trackingUrl } from "@/services/api";
import { defaultLinks } from "@/features/taplink/content";
import { LinkIcon } from "@/features/taplink/icons";
import type { ApiLink } from "@/types/api";

type IntroStage = "intro" | "links";

const LINKS_REVEAL_DELAY_MS = 1600;
const INTRO_COMPLETE_DELAY_MS = 4950;

type SealLayer = {
  src: string;
  width: string;
  className: string;
  delay: number;
  duration: number;
  opacity: number;
  overlayOpacity: number;
  scale: number;
  echoOpacity: number;
  overlayEchoOpacity: number;
  echoBlur: number;
  overlayEchoBlur: number;
  echoOffset: number;
  x: number[];
  y: number[];
  rotate: number[];
};

const sealLayers: SealLayer[] = [
  {
    src: "/assets/3.png",
    width: "553px",
    className: "z-10",
    delay: 0,
    duration: 2.75,
    opacity: 1,
    overlayOpacity: 0.1,
    scale: 1.2,
    echoOpacity: 0.2,
    overlayEchoOpacity: 0.035,
    echoBlur: 2.5,
    overlayEchoBlur: 3.5,
    echoOffset: 130,
    x: [-40, -18, 6, 26, 42],
    y: [1420, 980, 280, -520, -1420],
    rotate: [-2.2, -1.1, 0.4, 1.5, 2.4]
  },
  {
    src: "/assets/2.png",
    width: "553px",
    className: "z-20",
    delay: 0.3,
    duration: 2.75,
    opacity: 1,
    overlayOpacity: 0.085,
    scale: 1.3,
    echoOpacity: 0.18,
    overlayEchoOpacity: 0.03,
    echoBlur: 2,
    overlayEchoBlur: 3,
    echoOffset: 100,
    x: [30, 14, -4, -24, -38],
    y: [1400, 940, 180, -620, -1440],
    rotate: [2, 0.9, -0.5, -1.7, -2.7]
  },
  {
    src: "/assets/1.png",
    width: "553px",
    className: "z-30",
    delay: 0.5,
    duration: 2.75,
    opacity: 1,
    overlayOpacity: 0.075,
    scale: 1.5,
    echoOpacity: 0.16,
    overlayEchoOpacity: 0.025,
    echoBlur: 1.5,
    overlayEchoBlur: 2.5,
    echoOffset: 72,
    x: [-18, -6, 8, 20, 30],
    y: [1380, 900, 80, -720, -1460],
    rotate: [-1.2, -0.4, 0.8, 1.8, 2.6]
  }
];

type LinksPanelProps = {
  primaryLinks: ApiLink[];
  reveal?: boolean;
};

function LinksPanel({ primaryLinks, reveal }: LinksPanelProps) {
  const shouldAnimateRows = typeof reveal === "boolean";

  return (
    <section className="relative min-h-[calc(100svh_-_32px)] overflow-hidden bg-white p-3">
      <img
        src={brand.logo}
        alt=""
        className="pointer-events-none absolute left-1/2 top-4 z-0 w-[min(440px,calc(100vw_-_40px))] -translate-x-1/2 opacity-[0.025]"
      />

      <div className="relative z-10 grid gap-3">
        <div className="px-1 pt-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#F97300]">
            Ссылки
          </p>
        </div>

        <div className="grid gap-1">
          {primaryLinks.map((link, index) => (
            <motion.a
              key={link.id}
              href={trackingUrl(link.slug)}
              initial={shouldAnimateRows ? false : undefined}
              animate={
                shouldAnimateRows
                  ? {
                      opacity: reveal ? 1 : 0,
                      y: reveal ? [18, -1, 0] : 18,
                      clipPath: reveal ? "inset(0 0 0% 0)" : "inset(0 0 100% 0)"
                    }
                  : undefined
              }
              transition={shouldAnimateRows ? { duration: 0.34, delay: reveal ? index * 0.055 : 0, ease: "linear" } : undefined}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.985 }}
              className="group relative flex min-h-16 items-center gap-3 overflow-hidden bg-white px-2 py-2.5 transition hover:bg-[#FFF8F2]"
            >
              <span className="absolute bottom-2 left-0 top-2 w-[3px] origin-center scale-y-50 bg-[#F97300] opacity-0 transition duration-200 group-hover:scale-y-100 group-hover:opacity-100" />
              <span className="flex size-10 shrink-0 items-center justify-center bg-[#F8F8F8] text-[#F97300] transition duration-200 group-hover:bg-[#F97300] group-hover:text-white">
                <LinkIcon name={link.icon} className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[16px] font-black leading-tight">
                  {link.title}
                </span>
                <span className="mt-0.5 block truncate text-[12px] leading-4 text-[#696969]">
                  {link.description}
                </span>
              </span>
              <ArrowRight className="size-4 shrink-0 text-[#A0A0A0] transition group-hover:translate-x-1 group-hover:text-[#F97300]" />
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}

export function PublicTapLinkPage() {
  const [stage, setStage] = useState<IntroStage>("intro");
  const [linksVisible, setLinksVisible] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  const linksQuery = useQuery({
    queryKey: ["public-links"],
    queryFn: api.publicLinks
  });

  const links = linksQuery.data?.links ?? defaultLinks;
  const primaryLinks = links.filter((link) => link.isActive).sort((a, b) => a.sortOrder - b.sortOrder);

  useEffect(() => {
    if (stage === "links") {
      return undefined;
    }

    if (shouldReduceMotion) {
      setLinksVisible(true);
      setStage("links");
      return undefined;
    }

    setLinksVisible(false);

    const revealTimer = window.setTimeout(() => setLinksVisible(true), LINKS_REVEAL_DELAY_MS);
    const completeTimer = window.setTimeout(() => setStage("links"), INTRO_COMPLETE_DELAY_MS);

    return () => {
      window.clearTimeout(revealTimer);
      window.clearTimeout(completeTimer);
    };
  }, [shouldReduceMotion, stage]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F8F8F8] text-[#101010]">
      <main className="relative mx-auto min-h-screen w-full max-w-[560px] px-4 py-4 sm:px-5">
        {stage === "intro" ? (
          <motion.section
            key="intro"
            className="fixed inset-0 z-50 overflow-hidden bg-white"
          >
            <motion.div
              className="pointer-events-none absolute inset-0 z-0 bg-[#F97300]"
              initial={false}
              animate={{ opacity: linksVisible ? 0 : 1 }}
              transition={{ duration: 0.24, ease: "linear" }}
            />

            <motion.div
              className="pointer-events-none absolute inset-x-[-30%] bottom-0 z-[12] h-[120%] bg-white"
              initial={false}
              animate={{
                y: linksVisible ? "0%" : "112%",
                borderTopLeftRadius: linksVisible ? "0%" : "48%",
                borderTopRightRadius: linksVisible ? "0%" : "48%"
              }}
              transition={{ duration: 0.52, ease: "linear" }}
            />

            <div className="absolute inset-0 z-10 flex items-center justify-center p-[10px]">
              <motion.img
                src={brand.logo}
                alt="Градусы24"
                className="max-h-[calc(100svh_-_20px)] w-[calc(100vw_-_20px)] max-w-[420px] object-contain"
                initial={{ opacity: 1, scale: 0.8, y: 0 }}
                animate={{
                  opacity: linksVisible ? 0 : 1,
                  scale: linksVisible ? 0.9 : 0.8,
                  y: linksVisible ? -8 : 0
                }}
                transition={{ duration: linksVisible ? 0.24 : 1.45, ease: "linear" }}
              />
            </div>

            <div className="pointer-events-none absolute bottom-4 left-1/2 z-40 h-[2px] w-[calc(100%_-_32px)] max-w-[520px] -translate-x-1/2 overflow-hidden bg-white/30">
              <motion.div
                className="h-full origin-left"
                initial={{ scaleX: 0, backgroundColor: "#FFFFFF" }}
                animate={{ scaleX: 1, backgroundColor: linksVisible ? "#F97300" : "#FFFFFF" }}
                transition={{ duration: INTRO_COMPLETE_DELAY_MS / 1000, ease: "linear" }}
              />
            </div>

            <motion.div
              className="absolute inset-0 z-20 overflow-y-auto px-4 py-4 sm:px-5"
              initial={false}
              animate={{
                opacity: linksVisible ? 1 : 0,
                y: linksVisible ? 0 : 16,
                clipPath: linksVisible ? "inset(0% 0% 0% 0%)" : "inset(0% 0% 100% 0%)"
              }}
              transition={{ duration: 0.32, ease: "linear" }}
              style={{ pointerEvents: linksVisible ? "auto" : "none" }}
            >
              <div className="mx-auto w-full max-w-[560px]">
                <LinksPanel primaryLinks={primaryLinks} reveal={linksVisible} />
              </div>
            </motion.div>

            <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
              {sealLayers.map((layer) => {
                const echoX = layer.x.map((value) => value * 0.6);
                const echoY = layer.y.map((value) => value + layer.echoOffset);
                const scalePulse = [
                  layer.scale * 0.96,
                  layer.scale,
                  layer.scale * 1.04,
                  layer.scale * 1.02,
                  layer.scale
                ];

                return (
                  <div
                    key={layer.src}
                    className={`absolute inset-0 flex items-center justify-center ${layer.className}`}
                  >
                    <motion.img
                      src={layer.src}
                      alt=""
                      className="absolute max-w-none object-contain will-change-transform"
                      style={{
                        width: layer.width,
                        opacity: linksVisible ? layer.overlayEchoOpacity : layer.echoOpacity,
                        filter: `blur(${linksVisible ? layer.overlayEchoBlur : layer.echoBlur}px)`,
                        transition: "opacity 240ms linear, filter 240ms linear"
                      }}
                      initial={{
                        x: echoX[0],
                        y: echoY[0],
                        scale: layer.scale * 0.92,
                        rotate: layer.rotate[0]
                      }}
                      animate={{
                        x: echoX,
                        y: echoY,
                        scale: layer.scale * 0.92,
                        rotate: layer.rotate
                      }}
                      transition={{
                        duration: layer.duration,
                        delay: layer.delay,
                        ease: "linear",
                        times: [0, 0.2, 0.52, 0.8, 1]
                      }}
                    />
                    <motion.img
                      src={layer.src}
                      alt=""
                      className="absolute max-w-none object-contain will-change-transform"
                      style={{
                        width: layer.width,
                        opacity: linksVisible ? layer.overlayOpacity : layer.opacity,
                        transition: "opacity 240ms linear"
                      }}
                      initial={{
                        x: layer.x[0],
                        y: layer.y[0],
                        scale: layer.scale,
                        rotate: layer.rotate[0]
                      }}
                      animate={{
                        x: layer.x,
                        y: layer.y,
                        scale: scalePulse,
                        rotate: layer.rotate
                      }}
                      transition={{
                        duration: layer.duration,
                        delay: layer.delay,
                        ease: "linear",
                        times: [0, 0.2, 0.52, 0.8, 1]
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </motion.section>
        ) : (
          <LinksPanel primaryLinks={primaryLinks} />
        )}
      </main>
    </div>
  );
}
