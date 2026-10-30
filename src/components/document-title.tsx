import { useEffect, useId, useRef, useState } from "react";
import { cx } from "../cx.js";
import { usableText } from "./safe-name.js";

export interface DocumentTitleProps {
  value: string;
  /** Called with the new title. Promises must settle; use a timeout for network saves. */
  onRename: (title: string) => void | Promise<void>;
  /** The accessible name of the field while a person edits. */
  label?: string;
  /** Show the title as plain text, with no way to edit it. */
  readOnly?: boolean;
  maxLength?: number;
  className?: string;
}

/**
 * A title that renames in place. A button shows the name. Enter, Space, or F2 opens a field.
 * Enter or leaving the field saves. Escape cancels and returns focus to the button. A blank or
 * unsafe title is refused with a message that says what to fix, and the field stays open.
 * Put it in the top bar. Inside a dialog, Escape also closes the dialog.
 */
export function DocumentTitle({ value, onRename, label = "Document title", readOnly = false, maxLength = 120, className }: DocumentTitleProps) {
  // The stored title may come from a peer. A title with a hidden character shows as untitled.
  // A long one is safe to show, and the CSS cuts it with an ellipsis, so length alone never hides it.
  const limit = Math.max(maxLength, typeof value === "string" ? value.length : 0);
  const shown = usableText(value, limit) ?? "Untitled";
  const [saving, setSaving] = useState(false);
  const pending = useRef(false);
  const restoreFocus = useRef(false);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(shown);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const giveFocusBack = useRef(false);
  // Closing by key unmounts the field, and a browser may blur it as it goes. That blur must not save again.
  const finished = useRef(false);
  const errorId = useId();

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    } else if (giveFocusBack.current) {
      giveFocusBack.current = false;
      buttonRef.current?.focus();
    }
  }, [editing]);

  const open = () => {
    setDraft(shown);
    setError(null);
    finished.current = false;
    setEditing(true);
  };
  const close = (keepFocus: boolean) => {
    finished.current = true;
    giveFocusBack.current = keepFocus;
    setEditing(false);
  };
  const commit = async (keepFocus: boolean): Promise<void> => {
    if (finished.current || pending.current) return;
    const next = draft.trim();
    // Nothing changed, so there is nothing to check. A long stored title must not trap a person who never edited it.
    if (next === shown) { close(keepFocus); return; }
    if (next === "") {
      setError("Enter a title.");
      return;
    }
    if (next.length > maxLength) {
      setError(`Use up to ${maxLength} characters.`);
      return;
    }
    if (usableText(next, limit) === null) {
      // Double spaces and wide spaces are refused too, and the message names what to fix.
      setError(/\s{2,}|(?! )\p{Zs}/u.test(next) ? "Use single spaces only." : "Use letters, numbers, and punctuation, with no hidden characters.");
      return;
    }
    restoreFocus.current = keepFocus;
    pending.current = true;
    setError(null);
    try {
      const result = onRename(next);
      if (result !== undefined) {
        setSaving(true);
        await result;
      }
      if (mounted.current) close(restoreFocus.current);
    } catch {
      if (mounted.current) setError("Could not save the title. Try again.");
    } finally {
      pending.current = false;
      if (mounted.current) setSaving(false);
    }
  };

  if (readOnly) return <span className={cx("agd-title", className)}><span className="agd-title__text" title={shown}>{shown}</span></span>;

  if (!editing) {
    return (
      <span className={cx("agd-title", className)}>
        <button
          ref={buttonRef}
          type="button"
          className="agd-title__button"
          title={shown}
          aria-label={`${shown}, rename`}
          onClick={open}
          onKeyDown={(event) => {
            if (event.key === "F2") {
              event.preventDefault();
              open();
            }
          }}
        >
          <span className="agd-title__text">{shown}</span>
        </button>
      </span>
    );
  }

  return (
    <span className={cx("agd-title", className)}>
      <input
        ref={inputRef}
        className="agd-title__input"
        aria-label={label}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        value={draft}
        readOnly={saving}
        aria-busy={saving}
        maxLength={maxLength}
        onChange={(event) => {
          setDraft(event.target.value);
          setError(null);
        }}
        onKeyDown={(event) => {
          if (event.nativeEvent.isComposing || pending.current) return;
          if (event.key === "Enter") {
            event.preventDefault();
            void commit(true);
          } else if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            close(true);
          }
        }}
        onBlur={() => {
          // Leaving the field saves a good title. A bad one stays open with its message, so the edit is not lost.
          if (pending.current) { restoreFocus.current = false; return; }
          if (finished.current) return;
          void commit(false);
        }}
      />
      <span className="agd-title__status" role="status">{saving ? "Saving title…" : ""}</span>
      {error && <span id={errorId} className="agd-title__error" role="alert">{error}</span>}
    </span>
  );
}
