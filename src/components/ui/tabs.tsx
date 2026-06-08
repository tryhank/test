import * as React from "react";

import { cn } from "@/lib/utils";

function TabsList({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="tabs-list"
      className={cn(
        "inline-flex h-9 items-center rounded-4xl bg-muted p-1 text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

function TabsTrigger({
  className,
  active,
  ...props
}: React.ComponentProps<"button"> & { readonly active?: boolean }) {
  return (
    <button
      type="button"
      data-slot="tabs-trigger"
      data-state={active ? "active" : "inactive"}
      className={cn(
        "inline-flex h-7 items-center justify-center rounded-4xl px-3 text-sm font-medium transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
        active ? "bg-background text-foreground shadow-xs" : "hover:text-foreground",
        className,
      )}
      {...props}
    />
  );
}

export { TabsList, TabsTrigger };
