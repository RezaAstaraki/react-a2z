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

export type SelectOption = { value: string; label: string; disabled?: boolean };
export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  /** Visible field label. */
  label?: React.ReactNode;
  /** Supporting text. */
  description?: React.ReactNode;
  /** Error text; also sets aria-invalid. */
  error?: React.ReactNode;
  /** Padding and text size. */
  size?: FieldSize;
  /** Convenience options; children can supply native optgroups instead. */
  options?: SelectOption[];
  /** Empty choice shown before the options. */
  placeholder?: string;
  /** Per-slot class overrides. className styles the wrapper. */
  classNames?: FieldClassNames;
  /** Selected value; receives an array when multiple is enabled. */
  onValueChange?: (value: string | string[]) => void;
}
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  function Select(
    {
      label,
      description,
      error,
      size = "md",
      options,
      placeholder,
      classNames,
      className,
      id,
      required,
      multiple,
      children,
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
        />
        <select
          {...props}
          ref={ref}
          id={field.controlId}
          required={required}
          multiple={multiple}
          aria-invalid={error ? true : props["aria-invalid"]}
          aria-describedby={field.describedBy}
          className={cn(
            fieldControl,
            fieldSizes[size],
            fieldState(
              Boolean(
                error ||
                  props["aria-invalid"] === true ||
                  props["aria-invalid"] === "true",
              ),
            ),
            classNames?.control,
          )}
          onChange={(event) => {
            onChange?.(event);
            onValueChange?.(
              multiple
                ? Array.from(
                    event.target.selectedOptions,
                    (option) => option.value,
                  )
                : event.target.value,
            );
          }}
        >
          {placeholder && !multiple && <option value="">{placeholder}</option>}
          {children ??
            options?.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
        </select>
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
export default Select;
