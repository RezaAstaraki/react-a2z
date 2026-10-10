"use client";

import * as React from "react";
import { cn, mergeRefs } from "../../utils";
import { useField, FieldMessage } from "../shared/field";

export type CheckboxClassNames = {
  root?: string;
  wrapper?: string;
  control?: string;
  label?: string;
  description?: string;
};

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  /** Visible label associated with the native checkbox. */
  label?: React.ReactNode;
  /** Supporting text below the label. */
  description?: React.ReactNode;
  /** Validation message; also marks the input invalid. */
  error?: React.ReactNode;
  /** Mixed state, useful for a select-all checkbox. */
  indeterminate?: boolean;
  /** Called with the next checked value in either controlled or uncontrolled mode. */
  onCheckedChange?: (checked: boolean) => void;
  /** Override the native control's classes. className styles the wrapper. */
  controlClassName?: string;
  /** Per-slot overrides for every visual part. */
  classNames?: CheckboxClassNames;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  function Checkbox(
    {
      label,
      description,
      error,
      indeterminate = false,
      onCheckedChange,
      controlClassName,
      classNames,
      className,
      id,
      disabled,
      onChange,
      "aria-describedby": describedBy,
      ...props
    },
    ref,
  ) {
    const inputRef = React.useRef<HTMLInputElement>(null);
    const field = useField(id, describedBy, Boolean(error || description));
    React.useEffect(() => {
      if (inputRef.current) inputRef.current.indeterminate = indeterminate;
    }, [indeterminate]);
    return (
      <div
        className={cn(
          "text-sm",
          disabled && "opacity-60",
          classNames?.root,
          className,
        )}
      >
        <label
          htmlFor={field.controlId}
          className={cn(
            "inline-flex items-start gap-3",
            disabled ? "cursor-not-allowed" : "cursor-pointer",
            classNames?.wrapper,
          )}
        >
          <input
            {...props}
            ref={mergeRefs(inputRef, ref)}
            id={field.controlId}
            type="checkbox"
            disabled={disabled}
            aria-invalid={error ? true : props["aria-invalid"]}
            aria-describedby={field.describedBy}
            className={cn(
              "mt-0.5 size-4 shrink-0 rounded border-border accent-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2",
              disabled ? "cursor-not-allowed" : "cursor-pointer",
              classNames?.control,
              controlClassName,
            )}
            onChange={(event) => {
              onChange?.(event);
              onCheckedChange?.(event.target.checked);
            }}
          />
          {label && (
            <span className={cn("text-fg", classNames?.label)}>{label}</span>
          )}
        </label>
        <FieldMessage
          id={field.messageId}
          error={error}
          description={description}
          className={cn("ms-7", classNames?.description)}
        />
      </div>
    );
  },
);
export default Checkbox;
