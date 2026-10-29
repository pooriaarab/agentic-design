import * as RadixToolbar from "@radix-ui/react-toolbar";
import type { ReactNode } from "react";
import { IconButton, type IconButtonProps } from "./button.js";

/** One tab stop. Arrow keys, Home, and End move inside it. */
export function Toolbar({ label, children, dir }: { label: string; children: ReactNode; dir?: "ltr" | "rtl" }) {
  // Arrow keys follow the page direction. Pass `dir` to override what the page says.
  const direction = dir ?? (typeof document !== "undefined" && document.documentElement.dir === "rtl" ? "rtl" : "ltr");
  return (
    <RadixToolbar.Root className="ad-toolbar" aria-label={label} dir={direction}>
      {children}
    </RadixToolbar.Root>
  );
}

/** A toolbar icon button. Pass `pressed` to make it a toggle. */
export function ToolbarButton({ pressed, ...props }: IconButtonProps & { pressed?: boolean }) {
  return (
    <RadixToolbar.Button asChild>
      <IconButton size="sm" aria-pressed={pressed} {...props} />
    </RadixToolbar.Button>
  );
}

export function ToolbarSeparator() {
  return <RadixToolbar.Separator className="ad-toolbar__separator" />;
}
