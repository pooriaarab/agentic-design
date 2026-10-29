import * as RadixToolbar from "@radix-ui/react-toolbar";
import type { ReactNode } from "react";
import { IconButton, type IconButtonProps } from "./button.js";

/** One tab stop. Arrow keys, Home, and End move inside it. */
export function Toolbar({ label, children }: { label: string; children: ReactNode }) {
  return (
    <RadixToolbar.Root className="ad-toolbar" aria-label={label}>
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
