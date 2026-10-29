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
  label: ReactNode;
  hint?: ReactNode;
  /** Say what is wrong and how to fix it. The control gets aria-invalid. */
  error?: ReactNode;
}

function useField(idProp: string | undefined, { label, hint, error }: FieldProps) {
  if (typeof label === "string" && label.trim() === "") throw new Error("A field needs a non-empty label.");
  const auto = useId();
  const id = idProp ?? auto;
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

function Messages({ hintId, errorId, hint, error }: { hintId?: string; errorId?: string } & Omit<FieldProps, "label">) {
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

function Shell({ id, label, required, children, ...messages }: FieldProps & {
  id: string;
  required?: boolean;
  hintId?: string;
  errorId?: string;
  children: ReactNode;
}) {
  return (
    <div className="ad-field">
      <label className="ad-field__label" htmlFor={id}>
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
  { label, hint, error, className, id: idProp, ...rest },
  ref,
) {
  const field = useField(idProp, { label, hint, error });
  return (
    <Shell {...field} label={label} hint={hint} error={error} required={rest.required}>
      <input ref={ref} className={cx("ad-input", className)} {...rest} {...field.control} aria-describedby={mergeDescribedBy(field.control["aria-describedby"], rest["aria-describedby"])} />
    </Shell>
  );
});

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & FieldProps;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, className, id: idProp, ...rest },
  ref,
) {
  const field = useField(idProp, { label, hint, error });
  return (
    <Shell {...field} label={label} hint={hint} error={error} required={rest.required}>
      <textarea ref={ref} className={cx("ad-input ad-textarea", className)} {...rest} {...field.control} aria-describedby={mergeDescribedBy(field.control["aria-describedby"], rest["aria-describedby"])} />
    </Shell>
  );
});

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & FieldProps;

/** A native select. It works with every screen reader and every keyboard. */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, className, id: idProp, children, ...rest },
  ref,
) {
  const field = useField(idProp, { label, hint, error });
  return (
    <Shell {...field} label={label} hint={hint} error={error} required={rest.required}>
      <span className="ad-select">
        <select ref={ref} className={cx("ad-input", className)} {...rest} {...field.control} aria-describedby={mergeDescribedBy(field.control["aria-describedby"], rest["aria-describedby"])}>
          {children}
        </select>
      </span>
    </Shell>
  );
});

type ToggleProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "role"> & Pick<FieldProps, "label" | "hint">;

export type CheckboxProps = ToggleProps;
export type SwitchProps = ToggleProps;

function useToggle(idProp: string | undefined, label: ReactNode, hint: ReactNode) {
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
