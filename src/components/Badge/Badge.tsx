import * as React from "react";
import { cn } from "../../utils";

export type BadgeColor =
  | "primary"
  | "neutral"
  | "success"
  | "warning"
  | "danger"
  | "info";
export type BadgeClassNames = { root?: string; dot?: string; content?: string };
export interface BadgeProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, "color"> {
  /** Semantic color. */
  color?: BadgeColor;
  /** Visual treatment. */
  variant?: "soft" | "solid" | "outline";
  /** Badge text size. */
  size?: "sm" | "md";
  /** Decorative status dot. Always provide text as well. */
  dot?: boolean;
  /** Per-slot classes for the badge, dot and content. */
  classNames?: BadgeClassNames;
}
const colors: Record<
  BadgeColor,
  Record<NonNullable<BadgeProps["variant"]>, string>
> = {
  primary: {
    soft: "bg-primary-soft text-primary-700",
    solid: "bg-primary-600 text-primary-fg",
    outline: "border-primary-600 text-primary-700",
  },
  neutral: {
    soft: "bg-neutral-soft text-fg",
    solid: "bg-neutral-600 text-neutral-fg",
    outline: "border-border-strong text-fg",
  },
  success: {
    soft: "bg-success-soft text-success-700",
    solid: "bg-success-600 text-success-fg",
    outline: "border-success-600 text-success-700",
  },
  warning: {
    soft: "bg-warning-soft text-warning-700",
    solid: "bg-warning-600 text-warning-fg",
    outline: "border-warning-600 text-warning-700",
  },
  danger: {
    soft: "bg-danger-soft text-danger-700",
    solid: "bg-danger-600 text-danger-fg",
    outline: "border-danger-600 text-danger-700",
  },
  info: {
    soft: "bg-info-soft text-info-700",
    solid: "bg-info-600 text-info-fg",
    outline: "border-info-600 text-info-700",
  },
};
export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  function Badge(
    {
      color = "neutral",
      variant = "soft",
      size = "md",
      dot = false,
      classNames,
      className,
      children,
      ...props
    },
    ref,
  ) {
    return (
      <span
        {...props}
        ref={ref}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full font-medium whitespace-nowrap",
          size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
          variant === "outline" && "border bg-transparent",
          colors[color][variant],
          classNames?.root,
          className,
        )}
      >
        {dot && (
          <span
            aria-hidden="true"
            className={cn(
              "size-1.5 shrink-0 rounded-full bg-current",
              classNames?.dot,
            )}
          />
        )}
        <span className={classNames?.content}>{children}</span>
      </span>
    );
  },
);
export default Badge;
