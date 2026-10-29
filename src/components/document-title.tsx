import { useEffect, useId, useRef, useState } from "react";
import { cx } from "../cx.js";
import { usableText } from "./safe-name.js";

export interface DocumentTitleProps {
  value: string;
  /** Called with the new title. It is not called when the title did not change. */
  onRename: (title: string) => void;
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
  /** Returns true when the field may close. */
  const commit = (): boolean => {
    const next = draft.trim();
    // Nothing changed, so there is nothing to check. A long stored title must not trap a person who never edited it.
    if (next === shown) return true;
    if (next === "") {
      setError("Enter a title.");
      return false;
    }
    if (next.length > maxLength) {
      setError(`Use up to ${maxLength} characters.`);
      return false;
    }
    if (usableText(next, limit) === null) {
      // Double spaces and wide spaces are refused too, and the message names what to fix.
      setError(/\s{2,}|(?! )\p{Zs}/u.test(next) ? "Use single spaces only." : "Use letters, numbers, and punctuation, with no hidden characters.");
      return false;
    }
    onRename(next);
    return true;
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
        maxLength={maxLength}
        onChange={(event) => {
          setDraft(event.target.value);
          setError(null);
        }}
        onKeyDown={(event) => {
          if (event.nativeEvent.isComposing) return;
          if (event.key === "Enter") {
            event.preventDefault();
            if (commit()) close(true);
          } else if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            close(true);
          }
        }}
        onBlur={() => {
          // Leaving the field saves a good title. A bad one stays open with its message, so the edit is not lost.
          if (finished.current) return;
          if (commit()) close(false);
        }}
      />
      {error && <span id={errorId} className="agd-title__error" role="alert">{error}</span>}
    </span>
  );
}
