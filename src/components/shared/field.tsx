"use client";

import * as React from "react";
import { cn } from "../../utils";

export type FieldSize = "sm" | "md" | "lg";
export type FieldClassNames = {
  root?: string;
  label?: string;
  control?: string;
  description?: string;
};

export const fieldSizes: Record<FieldSize, string> = {
  sm: "px-3 py-2 text-sm",
  md: "px-4 py-3 text-sm",
  lg: "px-4 py-4 text-base",
};
export const fieldControl =
  "w-full rounded-lg border bg-surface text-fg placeholder:text-fg-subtle transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:bg-disabled disabled:text-disabled-fg";
export function fieldState(invalid: boolean) {
  return invalid
    ? "border-danger-500 focus-visible:ring-danger-500"
    : "border-border focus-visible:border-primary-500 focus-visible:ring-primary-500";
}
export function useField(
  id?: string,
  describedBy?: string,
  hasMessage?: boolean,
) {
  const generatedId = React.useId();
  const controlId = id ?? generatedId;
  const messageId = `${controlId}-message`;
  return {
    controlId,
    messageId,
    describedBy:
      [describedBy, hasMessage && messageId].filter(Boolean).join(" ") ||
      undefined,
  };
}
export function FieldLabel({
  id,
  label,
  required,
  className,
}: {
  id: string;
  label?: React.ReactNode;
  required?: boolean;
  className?: string;
}) {
  return label ? (
    <label
      htmlFor={id}
      className={cn("mb-2 block text-sm font-medium text-fg", className)}
    >
      {label}
      {required && (
        <span aria-hidden="true" className="ms-1 text-danger-600">
          *
        </span>
      )}
    </label>
  ) : null;
}
export function FieldMessage({
  id,
  error,
  description,
  className,
}: {
  id: string;
  error?: React.ReactNode;
  description?: React.ReactNode;
  className?: string;
}) {
  return error || description ? (
    <p
      id={id}
      className={cn(
        "mt-1.5 text-xs",
        error ? "text-danger-600" : "text-fg-muted",
        className,
      )}
    >
      {error || description}
    </p>
  ) : null;
}
