import * as RadixDialog from "@radix-ui/react-dialog";
import * as RadixMenu from "@radix-ui/react-dropdown-menu";
import * as RadixTabs from "@radix-ui/react-tabs";
import * as RadixToast from "@radix-ui/react-toast";
import { cloneElement, createContext, isValidElement, useCallback, useContext, useRef, useState, type ReactElement, type ReactNode } from "react";
import { AlertIcon, CheckIcon, CloseIcon, ErrorIcon, InfoIcon } from "../icons.js";
import { IconButton, type IconButtonProps } from "./button.js";

/* Dialog ---------------------------------------------------------------- */

export interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** The element that opens the dialog. Focus returns to it on close. */
  trigger?: ReactElement;
  /** The dialog name. Required. */
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
}

export function Dialog({ open, onOpenChange, trigger, title, description, children, footer }: DialogProps) {
  if (title.trim() === "") throw new Error("A dialog needs a non-empty title.");
  // With no trigger, Radix has nothing to give focus back to. Remember what had focus as the
  // dialog opens, and return it there on close.
  const opener = useRef<Element | null>(null);
  const wasOpen = useRef(false);
  if (open && !wasOpen.current && typeof document !== "undefined") opener.current = document.activeElement;
  wasOpen.current = Boolean(open);
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <RadixDialog.Trigger asChild>{trigger}</RadixDialog.Trigger>}
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="ad-overlay" />
        <RadixDialog.Content
          className="ad-dialog"
          {...(description ? {} : { "aria-describedby": undefined })}
          onCloseAutoFocus={(event) => {
            if (!trigger && opener.current instanceof HTMLElement && opener.current.isConnected) {
              event.preventDefault();
              opener.current.focus();
            }
          }}
          onOpenAutoFocus={(event) => {
            // A destructive dialog marks its safest button with data-autofocus. It gets first focus.
            const safest = (event.currentTarget as HTMLElement).querySelector<HTMLElement>("[data-autofocus]");
            if (safest) {
              event.preventDefault();
              safest.focus();
            }
          }}
        >
          <RadixDialog.Title className="ad-dialog__title">{title}</RadixDialog.Title>
          <RadixDialog.Close asChild>
            <IconButton label="Close" icon={<CloseIcon />} size="sm" className="ad-dialog__close" tooltip={false} />
          </RadixDialog.Close>
          {description && <RadixDialog.Description className="ad-dialog__description">{description}</RadixDialog.Description>}
          {children && <div className="ad-dialog__body">{children}</div>}
          {footer && <div className="ad-dialog__footer">{footer}</div>}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

/** Wrap a button in a dialog footer to close the dialog when it is pressed. */
export const DialogClose = RadixDialog.Close;

/* Menu ------------------------------------------------------------------ */

export type MenuItem =
  | "separator"
  | { label: string; onSelect: () => void; icon?: ReactNode; shortcut?: string; danger?: boolean; disabled?: boolean };

export function Menu({ trigger, items, align = "end" }: { trigger: ReactElement; items: MenuItem[]; align?: "start" | "end" }) {
  for (const item of items) {
    if (item !== "separator" && item.label.trim() === "") throw new Error("A menu item needs a non-empty label.");
  }
  // Focus returns to the trigger when the menu closes. A tooltip would pop up there, so the trigger has none.
  const menuTrigger = isValidElement<IconButtonProps>(trigger) && trigger.type === IconButton ? cloneElement(trigger, { tooltip: false }) : trigger;
  return (
    <RadixMenu.Root modal={false}>
      <RadixMenu.Trigger asChild>{menuTrigger}</RadixMenu.Trigger>
      <RadixMenu.Portal>
        <RadixMenu.Content className="ad-menu" align={align} sideOffset={6}>
          {items.map((item, index) =>
            item === "separator" ? (
              <RadixMenu.Separator key={`sep-${index}`} className="ad-menu__separator" />
            ) : (
              <RadixMenu.Item
                key={`${index}-${item.label}`}
                className={item.danger ? "ad-menu__item ad-menu__item--danger" : "ad-menu__item"}
                disabled={item.disabled}
                onSelect={item.onSelect}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.shortcut && <kbd className="ad-menu__shortcut">{item.shortcut}</kbd>}
              </RadixMenu.Item>
            ),
          )}
        </RadixMenu.Content>
      </RadixMenu.Portal>
    </RadixMenu.Root>
  );
}

/* Tabs ------------------------------------------------------------------ */

export interface TabItem {
  value: string;
  label: string;
  content: ReactNode;
}

export function Tabs({ label, tabs, value, defaultValue, onValueChange }: { label: string; tabs: TabItem[]; defaultValue?: string; value?: string; onValueChange?: (value: string) => void }) {
  if (label.trim() === "") throw new Error("Tabs need a non-empty label.");
  return (
    <RadixTabs.Root
      className="ad-tabs"
      value={value}
      defaultValue={value === undefined ? (defaultValue ?? tabs[0]?.value) : undefined}
      onValueChange={onValueChange}
    >
      <RadixTabs.List className="ad-tabs__list" aria-label={label}>
        {tabs.map((tab) => (
          <RadixTabs.Trigger key={tab.value} value={tab.value} className="ad-tabs__trigger">
            {tab.label}
          </RadixTabs.Trigger>
        ))}
      </RadixTabs.List>
      {tabs.map((tab) => (
        <RadixTabs.Content key={tab.value} value={tab.value} className="ad-tabs__panel">
          {tab.content}
        </RadixTabs.Content>
      ))}
    </RadixTabs.Root>
  );
}

/* Toast ----------------------------------------------------------------- */

export type ToastTone = "info" | "success" | "warning" | "danger";
export interface ToastOptions {
  title: string;
  description?: string;
  tone?: ToastTone;
}
interface ToastEntry extends ToastOptions {
  id: number;
}

const ToastContext = createContext<((options: ToastOptions) => void) | null>(null);
// Each tone has its own icon shape and a hidden word, so no tone rests on color.
const toneIcon = { info: InfoIcon, success: CheckIcon, warning: AlertIcon, danger: ErrorIcon } as const;
const toneWord = { info: "Notice", success: "Success", warning: "Warning", danger: "Error" } as const;

/** Mount once near the root. A danger toast stays until it is dismissed. Others close after 8 seconds. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const toast = useCallback((options: ToastOptions) => {
    if (typeof options.title !== "string" || options.title.trim() === "") throw new Error("A toast needs a non-empty title.");
    // An unknown tone, such as "error", is treated as danger. It stays until dismissed, so it is never missed.
    const tone: ToastTone = options.tone === undefined ? "info" : Object.hasOwn(toneIcon, options.tone) ? options.tone : "danger";
    setToasts((all) => [...all, { ...options, tone, id: Date.now() + Math.random() }]);
  }, []);
  const remove = (id: number) => setToasts((all) => all.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={toast}>
      <RadixToast.Provider swipeDirection="right">
        {children}
        {toasts.map(({ id, title, description, tone = "info" }) => {
          const Icon = toneIcon[tone];
          return (
            <RadixToast.Root
              key={id}
              className={`ad-toast ad-toast--${tone}`}
              type={tone === "danger" ? "foreground" : "background"}
              duration={tone === "danger" ? Infinity : 8000}
              onOpenChange={(open) => !open && remove(id)}
            >
              <Icon className="ad-toast__icon" />
              <div>
                <RadixToast.Title className="ad-toast__title">
                  <span className="ad-sr-only">{toneWord[tone]}: </span>
                  {title}
                </RadixToast.Title>
                {description && <RadixToast.Description className="ad-toast__description">{description}</RadixToast.Description>}
              </div>
              <RadixToast.Close asChild>
                <IconButton label="Dismiss" icon={<CloseIcon />} size="sm" tooltip={false} />
              </RadixToast.Close>
            </RadixToast.Root>
          );
        })}
        <RadixToast.Viewport className="ad-toast-viewport" label="Notifications ({hotkey})" />
      </RadixToast.Provider>
    </ToastContext.Provider>
  );
}

export function useToast(): (options: ToastOptions) => void {
  const toast = useContext(ToastContext);
  if (!toast) throw new Error("useToast needs a ToastProvider above it.");
  return toast;
}
