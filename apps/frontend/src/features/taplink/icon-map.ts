import type { ComponentType, SVGProps } from "react";
import {
  ArrowRight,
  BadgePercent,
  BarChart3,
  Clock3,
  Gift,
  Globe2,
  Instagram,
  Link2,
  MapPin,
  MessageCircle,
  PackageCheck,
  PhoneCall,
  QrCode,
  RefreshCcw,
  Send,
  Settings,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Store,
  Timer
} from "lucide-react";

export type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

export const iconMap: Record<string, IconComponent> = {
  ArrowRight,
  BadgePercent,
  BarChart3,
  Clock3,
  Gift,
  Globe2,
  Instagram,
  Link2,
  MapPin,
  MessageCircle,
  PackageCheck,
  PhoneCall,
  QrCode,
  RefreshCcw,
  Send,
  Settings,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Store,
  Timer
};
