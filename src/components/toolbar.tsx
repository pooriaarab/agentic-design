import * as RadixToolbar from "@radix-ui/react-toolbar";
import { forwardRef, type ReactNode } from "react";
import { MoreIcon } from "../icons.js";
import { IconButton, type IconButtonProps } from "./button.js";
import { Menu, type MenuItem } from "./overlays.js";

/** One tab stop. Arrow keys, Home, and End move inside it. It reads the page direction when it renders, so render it again after the page direction changes. */
export function Toolbar({ label, children, dir }: { label: string; children: ReactNode; dir?: "ltr" | "rtl" }) {
  // Arrow keys follow the page direction. Pass `dir` to override what the page says.
  const direction = dir ?? (typeof document !== "undefined" && document.documentElement.dir === "rtl" ? "rtl" : "ltr");
  return (
    <RadixToolbar.Root className="agd-toolbar" aria-label={label} dir={direction}>
      {children}
    </RadixToolbar.Root>
  );
}

/** A toolbar icon button. Pass `pressed` to make it a toggle. */
export const ToolbarButton = forwardRef<HTMLButtonElement, IconButtonProps & { pressed?: boolean }>(function ToolbarButton({ pressed, ...props }, ref) {
  return (
    <RadixToolbar.Button asChild>
      <IconButton ref={ref} size="sm" aria-pressed={pressed} {...props} />
    </RadixToolbar.Button>
  );
});

export function ToolbarSeparator() {
  return <RadixToolbar.Separator className="agd-toolbar__separator" />;
}

/** Buttons that belong together, such as text style. A screen reader hears the group name. Keep it inside a `Toolbar`. */
export function ToolbarGroup({ label, children }: { label: string; children: ReactNode }) {
  if (label.trim() === "") throw new Error("A toolbar group needs a non-empty label.");
  return (
    <div className="agd-toolbar__group" role="group" aria-label={label}>
      {children}
    </div>
  );
}

/**
 * The last stop of a toolbar: a "More" button that opens a menu of the tools that do not fit.
 * It is in the same tab stop as the other buttons, so arrow keys reach it. Put the tools that
 * matter least in it, and keep the same actions out of the bar.
 */
export function ToolbarOverflow({ label = "More tools", items }: { label?: string; items: MenuItem[] }) {
  return <Menu trigger={<ToolbarButton label={label} icon={<MoreIcon />} tooltip={false} />} items={items} />;
}
