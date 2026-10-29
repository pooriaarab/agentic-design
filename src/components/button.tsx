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
      className={cx("agd-button", `agd-button--${variant}`, `agd-button--${size}`, className)}
      onClick={(event) => (loading ? event.preventDefault() : onClick?.(event))}
      {...rest}
      aria-busy={loading || undefined}
      aria-disabled={loading || rest["aria-disabled"]}
    >
      {loading && <span className="agd-spinner" aria-hidden="true" />}
      {children}
      {/* aria-busy is not announced on a button, so the loading state is also in the name. */}
      {loading && <span className="agd-sr-only">, loading</span>}
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

// The tooltip repeats the accessible name, so the description Radix adds would read it twice.
// This body drops that one id and keeps any description the caller set.
const IconButtonBody = forwardRef<HTMLButtonElement, ButtonProps>(function IconButtonBody(props, ref) {
  const described = props["aria-describedby"]?.split(" ").filter((id) => !id.startsWith("radix-")).join(" ");
  return <Button ref={ref} {...props} aria-describedby={described || undefined} />;
});

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, icon, tooltip = true, variant = "ghost", className, ...rest },
  ref,
) {
  if (label.trim() === "") throw new Error("IconButton needs a non-empty label.");
  const button = (
    <IconButtonBody ref={ref} variant={variant} className={cx("agd-icon-button", className)} {...rest} aria-label={rest.loading ? `${label}, loading` : label}>
      {rest.loading ? null : icon}
    </IconButtonBody>
  );
  return tooltip ? <Tooltip content={label}>{button}</Tooltip> : button;
});
