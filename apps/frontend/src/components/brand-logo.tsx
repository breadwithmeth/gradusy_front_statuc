import { brand } from "@/lib/brand";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  compact?: boolean;
  className?: string;
  imageClassName?: string;
};

export function BrandLogo({ compact = false, className, imageClassName }: BrandLogoProps) {
  if (compact) {
    return (
      <div
        className={cn(
          "flex size-12 items-center justify-center rounded-2xl bg-brand-ink shadow-card",
          className
        )}
      >
        <img src={brand.logoMini} alt="Градусы24" className={cn("size-9 object-contain", imageClassName)} />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex h-20 items-center rounded-3xl bg-brand-ink px-6 shadow-soft sm:h-24",
        className
      )}
    >
      <img src={brand.logo} alt="Градусы24" className={cn("h-12 w-full object-contain", imageClassName)} />
    </div>
  );
}
