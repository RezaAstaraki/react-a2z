"use client";

import * as React from "react";
import { cn } from "../../utils";
import { useField, FieldMessage } from "../shared/field";

export interface SwitchProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  /** Label associated with the switch. */
  label?: React.ReactNode;
  /** Supporting text. */
  description?: React.ReactNode;
  /** Called when the native checked value changes. */
  onCheckedChange?: (checked: boolean) => void;
  /** Track classes. className styles the wrapper. */
  trackClassName?: string;
}

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  function Switch(
    {
      label,
      description,
      onCheckedChange,
      trackClassName,
      className,
      disabled,
      id,
      onChange,
      "aria-describedby": describedBy,
      ...props
    },
    ref,
  ) {
    const field = useField(id, describedBy, Boolean(description));
    return (
      <div className={cn("text-sm", disabled && "opacity-60", className)}>
        <label
          htmlFor={field.controlId}
          className={cn(
            "inline-flex items-center gap-3",
            disabled ? "cursor-not-allowed" : "cursor-pointer",
          )}
        >
          <span className="relative inline-flex shrink-0">
            <input
              {...props}
              ref={ref}
              type="checkbox"
              role="switch"
              id={field.controlId}
              disabled={disabled}
              aria-describedby={field.describedBy}
              className="peer sr-only"
              onChange={(event) => {
                onChange?.(event);
                onCheckedChange?.(event.target.checked);
              }}
            />
            <span
              aria-hidden="true"
              className={cn(
                "h-6 w-11 rounded-full bg-neutral-300 transition-colors peer-checked:bg-primary-600 peer-focus-visible:ring-2 peer-focus-visible:ring-primary-500 peer-focus-visible:ring-offset-2 motion-reduce:transition-none",
                trackClassName,
              )}
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute start-0.5 top-0.5 size-5 rounded-full bg-primary-fg shadow-sm transition-transform peer-checked:translate-x-5 rtl:peer-checked:-translate-x-5 motion-reduce:transition-none"
            />
          </span>
          {label && <span className="text-fg">{label}</span>}
        </label>
        <FieldMessage
          id={field.messageId}
          description={description}
          className="ms-14"
        />
      </div>
    );
  },
);
export default Switch;
