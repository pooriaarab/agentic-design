import * as RadixTooltip from "@radix-ui/react-tooltip";
import { createContext, useContext, type ReactElement, type ReactNode } from "react";

const HasProvider = createContext(false);

/**
 * Mount once near the root. Tooltips under it share one delay, so moving along a row of
 * icon buttons shows each next tooltip at once. Without it, each tooltip makes its own.
 */
export function TooltipProvider({ children, delayDuration = 300 }: { children: ReactNode; delayDuration?: number }) {
  return (
    <HasProvider.Provider value={true}>
      <RadixTooltip.Provider delayDuration={delayDuration} skipDelayDuration={150}>
        {children}
      </RadixTooltip.Provider>
    </HasProvider.Provider>
  );
}

/** Wrap one focusable element. The tooltip shows on hover and on keyboard focus. */
export function Tooltip({ content, children, side = "top" }: { content: ReactNode; children: ReactElement; side?: "top" | "right" | "bottom" | "left" }) {
  const shared = useContext(HasProvider);
  const tooltip = (
    <RadixTooltip.Root>
      <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
      <RadixTooltip.Portal>
        <RadixTooltip.Content className="agd-tooltip" side={side} sideOffset={6}>
          {content}
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  );
  return shared ? tooltip : <TooltipProvider>{tooltip}</TooltipProvider>;
}
