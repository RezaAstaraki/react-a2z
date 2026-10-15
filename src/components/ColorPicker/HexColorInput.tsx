"use client";

import * as React from "react";
import { normalizeHex } from "../../utils";

const useLayoutEffect = typeof window === "undefined" ? React.useEffect : React.useLayoutEffect;

/** Invalid drafts never become a component value. */
export function HexColorInput({
  value,
  onCommit,
  disabled,
  label,
  inputClassName,
  errorClassName,
  inputStyle,
  errorStyle,
  inputSlot,
  errorSlot,
}: {
  value: string;
  onCommit: (color: string) => void;
  disabled?: boolean;
  label: string;
  inputClassName?: string;
  errorClassName?: string;
  inputStyle?: React.CSSProperties;
  errorStyle?: React.CSSProperties;
  inputSlot: string;
  errorSlot: string;
}) {
  const [draft, setDraft] = React.useState(value);
  const [invalid, setInvalid] = React.useState(false);
  const errorId = React.useId();
  useLayoutEffect(() => {
    setDraft(value);
    setInvalid(false);
  }, [value]);
  const commit = () => {
    if (disabled) return;
    const hex = normalizeHex(draft);
    setInvalid(!hex);
    // A controlled parent may reject the request. Its rendered value remains authoritative.
    if (hex) {
      setDraft(value);
      if (hex !== normalizeHex(value)) onCommit(hex);
    }
  };
  return (
    <>
      <input
        type="text"
        value={draft}
        disabled={disabled}
        aria-label={label}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? errorId : undefined}
        spellCheck={false}
        autoComplete="off"
        data-slot={inputSlot}
        className={inputClassName}
        style={inputStyle}
        onChange={(event) => {
          setDraft(event.target.value);
          setInvalid(false);
        }}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            commit();
          }
          if (event.key === "Escape") {
            event.preventDefault();
            setDraft(value);
            setInvalid(false);
          }
        }}
      />
      {invalid && (
        <p
          id={errorId}
          role="alert"
          data-slot={errorSlot}
          className={errorClassName}
          style={errorStyle}
        >
          Enter a 3- or 6-digit HEX color, such as #7c3aed.
        </p>
      )}
    </>
  );
}
