import * as React from "react";
import { cn } from "@/lib/utils";

type SwitchProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label?: string;
};

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, label, checked, ...props }, ref) => (
    <label className={cn("inline-flex cursor-pointer items-center gap-3", className)}>
      <span className="relative inline-flex h-7 w-12 items-center rounded-full bg-muted transition has-[:checked]:bg-primary">
        <input ref={ref} type="checkbox" className="peer sr-only" checked={checked} {...props} />
        <span className="absolute left-1 size-5 rounded-full bg-white shadow-sm transition peer-checked:translate-x-5" />
      </span>
      {label ? <span className="text-sm font-semibold text-foreground">{label}</span> : null}
    </label>
  )
);

Switch.displayName = "Switch";
