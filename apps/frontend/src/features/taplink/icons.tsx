import type { SVGProps } from "react";
import { Link2 } from "lucide-react";
import { iconMap } from "./icon-map";

type LinkIconProps = SVGProps<SVGSVGElement> & {
  name?: string;
};

export function LinkIcon({ name, ...props }: LinkIconProps) {
  const Icon = name ? iconMap[name] ?? Link2 : Link2;
  return <Icon {...props} />;
}
