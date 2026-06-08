import * as React from "react";

import { cn } from "@/lib/utils";

type BadgeProps = React.ComponentProps<"span"> & {
  readonly variant?: "default" | "secondary" | "outline" | "destructive" | "success";
};

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      data-slot="badge"
      className={cn(
        "inline-flex h-6 items-center rounded-4xl border px-2.5 text-xs font-medium whitespace-nowrap",
        variant === "default" && "border-transparent bg-primary text-primary-foreground",
        variant === "secondary" && "border-transparent bg-secondary text-secondary-foreground",
        variant === "outline" && "border-border text-foreground",
        variant === "destructive" && "border-transparent bg-destructive/10 text-destructive",
        variant === "success" &&
          "border-transparent bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
        className,
      )}
      {...props}
    />
  );
}

export { Badge };
