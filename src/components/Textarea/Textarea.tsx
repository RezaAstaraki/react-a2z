"use client";

import * as React from "react";
import { cn } from "../../utils";
import {
  FieldLabel,
  FieldMessage,
  fieldControl,
  fieldSizes,
  fieldState,
  useField,
  type FieldSize,
  type FieldClassNames,
} from "../shared/field";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Visible label; an id is generated when omitted. */
  label?: React.ReactNode;
  /** Supporting text beneath the field. */
  description?: React.ReactNode;
  /** Error text; also sets aria-invalid. */
  error?: React.ReactNode;
  /** Padding and text size. */
  size?: FieldSize;
  /** Resize behavior. */
  resize?: "none" | "vertical" | "both";
  /** Per-slot class overrides. className styles the wrapper. */
  classNames?: FieldClassNames;
  /** Called with the new text in addition to the native onChange. */
  onValueChange?: (value: string) => void;
}
const resizeClasses = {
  none: "resize-none",
  vertical: "resize-y",
  both: "resize",
};
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(
    {
      label,
      description,
      error,
      size = "md",
      resize = "vertical",
      classNames,
      className,
      id,
      required,
      rows = 4,
      onChange,
      onValueChange,
      "aria-describedby": describedBy,
      ...props
    },
    ref,
  ) {
    const field = useField(id, describedBy, Boolean(error || description));
    return (
      <div className={cn("w-full", classNames?.root, className)}>
        <FieldLabel
          id={field.controlId}
          label={label}
          required={required}
          className={classNames?.label}
          requiredClassName={classNames?.requiredIndicator}
        />
        <textarea
          {...props}
          ref={ref}
          id={field.controlId}
          required={required}
          rows={rows}
          aria-invalid={error ? true : props["aria-invalid"]}
          aria-describedby={field.describedBy}
          className={cn(
            fieldControl,
            "cursor-text",
            fieldSizes[size],
            fieldState(
              Boolean(
                error ||
                  props["aria-invalid"] === true ||
                  props["aria-invalid"] === "true",
              ),
            ),
            resizeClasses[resize],
            classNames?.control,
          )}
          onChange={(event) => {
            onChange?.(event);
            onValueChange?.(event.target.value);
          }}
        />
        <FieldMessage
          id={field.messageId}
          error={error}
          description={description}
          className={classNames?.description}
        />
      </div>
    );
  },
);
export default Textarea;
