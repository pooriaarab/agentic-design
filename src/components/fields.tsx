import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { cx } from "../cx.js";
import { AlertIcon } from "../icons.js";

interface FieldProps {
  /** Always visible. A placeholder is never a label. */
  label: Exclude<ReactNode, null | undefined | boolean>;
  /** Hide the label from sight. It stays in the accessible name. Use it only where context labels the control. */
  hideLabel?: boolean;
  hint?: ReactNode;
  /** Say what is wrong and how to fix it. The control gets aria-invalid. */
  error?: ReactNode;
}

function useField(idProp: string | undefined, { label, hint, error }: FieldProps) {
  // A missing translation can still reach here as undefined, null, false, or "". None is a label.
  if ((label as unknown) == null || (label as unknown) === false || (typeof label === "string" && label.trim() === "")) {
    throw new Error("A field needs a non-empty label.");
  }
  const auto = useId();
  // An empty id would point the label at nothing, so it counts as no id.
  const id = idProp || auto;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  return {
    id,
    hintId,
    errorId,
    control: {
      id,
      "aria-describedby": [hintId, errorId].filter(Boolean).join(" ") || undefined,
      "aria-invalid": error ? true : undefined,
    },
  };
}

/** The generated description joins the caller's own aria-describedby. It never replaces it. */
function mergeDescribedBy(generated: string | undefined, own: string | undefined): string | undefined {
  return [generated, own].filter(Boolean).join(" ") || undefined;
}

function Messages({ hintId, errorId, hint, error }: { hintId?: string; errorId?: string } & Omit<FieldProps, "label" | "hideLabel">) {
  return (
    <>
      {hint && <p id={hintId} className="ad-field__hint">{hint}</p>}
      {error && (
        <p id={errorId} className="ad-field__error" role="alert">
          <AlertIcon />
          {error}
        </p>
      )}
    </>
  );
}

function Shell({ id, label, hideLabel, required, children, ...messages }: FieldProps & {
  id: string;
  required?: boolean;
  hintId?: string;
  errorId?: string;
  children: ReactNode;
}) {
  return (
    <div className="ad-field">
      <label className={cx("ad-field__label", hideLabel && "ad-sr-only")} htmlFor={id}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      {children}
      <Messages {...messages} />
    </div>
  );
}

export type InputProps = InputHTMLAttributes<HTMLInputElement> & FieldProps;

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hideLabel, hint, error, className, id: idProp, ...rest },
  ref,
) {
  const field = useField(idProp, { label, hint, error });
  return (
    <Shell {...field} label={label} hideLabel={hideLabel} hint={hint} error={error} required={rest.required}>
      <input ref={ref} className={cx("ad-input", className)} {...rest} {...field.control} aria-describedby={mergeDescribedBy(field.control["aria-describedby"], rest["aria-describedby"])} aria-invalid={field.control["aria-invalid"] ?? rest["aria-invalid"]} />
    </Shell>
  );
});

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & FieldProps;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hideLabel, hint, error, className, id: idProp, ...rest },
  ref,
) {
  const field = useField(idProp, { label, hint, error });
  return (
    <Shell {...field} label={label} hideLabel={hideLabel} hint={hint} error={error} required={rest.required}>
      <textarea ref={ref} className={cx("ad-input ad-textarea", className)} {...rest} {...field.control} aria-describedby={mergeDescribedBy(field.control["aria-describedby"], rest["aria-describedby"])} aria-invalid={field.control["aria-invalid"] ?? rest["aria-invalid"]} />
    </Shell>
  );
});

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & FieldProps;

/** A native select. It works with every screen reader and every keyboard. */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hideLabel, hint, error, className, id: idProp, children, ...rest },
  ref,
) {
  const field = useField(idProp, { label, hint, error });
  return (
    <Shell {...field} label={label} hideLabel={hideLabel} hint={hint} error={error} required={rest.required}>
      <span className="ad-select">
        <select ref={ref} className={cx("ad-input", className)} {...rest} {...field.control} aria-describedby={mergeDescribedBy(field.control["aria-describedby"], rest["aria-describedby"])} aria-invalid={field.control["aria-invalid"] ?? rest["aria-invalid"]}>
          {children}
        </select>
      </span>
    </Shell>
  );
});

type ToggleProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "role"> & Pick<FieldProps, "label" | "hint">;

export type CheckboxProps = ToggleProps;
export type SwitchProps = ToggleProps;

function useToggle(idProp: string | undefined, label: FieldProps["label"], hint: ReactNode) {
  const { id, hintId, control } = useField(idProp, { label, hint });
  return { id, hintId, describedBy: control["aria-describedby"] };
}

export const Checkbox = forwardRef<HTMLInputElement, ToggleProps>(function Checkbox(
  { label, hint, className, id: idProp, ...rest },
  ref,
) {
  const { id, hintId, describedBy } = useToggle(idProp, label, hint);
  return (
    <div className="ad-toggle">
      <label className="ad-toggle__row" htmlFor={id}>
        <input ref={ref} id={id} type="checkbox" className={cx("ad-checkbox", className)} {...rest} aria-describedby={mergeDescribedBy(describedBy, rest["aria-describedby"])} />
        <span>{label}</span>
      </label>
      {hint && <p id={hintId} className="ad-field__hint">{hint}</p>}
    </div>
  );
});

export const Switch = forwardRef<HTMLInputElement, ToggleProps>(function Switch(
  { label, hint, className, id: idProp, ...rest },
  ref,
) {
  const { id, hintId, describedBy } = useToggle(idProp, label, hint);
  return (
    <div className="ad-toggle">
      <label className="ad-toggle__row" htmlFor={id}>
        <input ref={ref} id={id} type="checkbox" role="switch" className={cx("ad-switch", className)} {...rest} aria-describedby={mergeDescribedBy(describedBy, rest["aria-describedby"])} />
        <span>{label}</span>
      </label>
      {hint && <p id={hintId} className="ad-field__hint">{hint}</p>}
    </div>
  );
});
