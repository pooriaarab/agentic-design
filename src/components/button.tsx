import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cx } from "../cx.js";
import { Tooltip } from "./tooltip.js";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
  /** Shows a spinner and ignores clicks. The button stays focusable. */
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "secondary", size = "md", loading = false, type = "button", className, children, onClick, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cx("ad-button", `ad-button--${variant}`, `ad-button--${size}`, className)}
      aria-busy={loading || undefined}
      aria-disabled={loading || undefined}
      onClick={(event) => (loading ? event.preventDefault() : onClick?.(event))}
      {...rest}
    >
      {loading && <span className="ad-spinner" aria-hidden="true" />}
      {children}
    </button>
  );
});

export interface IconButtonProps extends Omit<ButtonProps, "children" | "aria-label" | "aria-labelledby"> {
  /** The accessible name. Required, because an icon has no text. */
  label: string;
  icon: ReactNode;
  /** Show the label in a tooltip on hover and focus. On by default. */
  tooltip?: boolean;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, icon, tooltip = true, variant = "ghost", className, ...rest },
  ref,
) {
  const button = (
    <Button ref={ref} variant={variant} className={cx("ad-icon-button", className)} aria-label={label} {...rest}>
      {icon}
    </Button>
  );
  return tooltip ? <Tooltip content={label}>{button}</Tooltip> : button;
});
