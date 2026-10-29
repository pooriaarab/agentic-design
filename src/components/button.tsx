import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cx } from "../cx.js";

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
      onClick={(event) => (loading ? event.preventDefault() : onClick?.(event))}
      {...rest}
      aria-busy={loading || undefined}
      aria-disabled={loading || rest["aria-disabled"]}
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
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, icon, variant = "ghost", className, ...rest },
  ref,
) {
  if (label.trim() === "") throw new Error("IconButton needs a non-empty label.");
  return (
    <Button ref={ref} variant={variant} className={cx("ad-icon-button", className)} {...rest} aria-label={label}>
      {rest.loading ? null : icon}
    </Button>
  );
});
