import * as React from "react";
import { cn } from "../../utils";

export type ProgressClassNames = {
  root?: string;
  labelRow?: string;
  label?: string;
  value?: string;
  track?: string;
  indicator?: string;
};

export interface ProgressProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** Accessible name. Required even when the visual label is hidden. */
  label: string;
  /** Current value. Omit for indeterminate progress. */
  value?: number;
  /** Upper bound; positive finite values only. */
  max?: number;
  /** Display the label and percentage above the track. */
  showLabel?: boolean;
  /** Semantic fill color. */
  color?: "primary" | "success" | "warning" | "danger";
  /** Track height. */
  size?: "sm" | "md" | "lg";
  /** Fill classes. className styles the wrapper. */
  indicatorClassName?: string;
  /** Per-slot classes for the labels, track and fill. */
  classNames?: ProgressClassNames;
}
const colors = {
  primary: "bg-primary-600",
  success: "bg-success-600",
  warning: "bg-warning-600",
  danger: "bg-danger-600",
};
const sizes = { sm: "h-1", md: "h-2", lg: "h-3" };
export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  function Progress(
    {
      label,
      value,
      max = 100,
      showLabel = false,
      color = "primary",
      size = "md",
      className,
      indicatorClassName,
      classNames,
      ...props
    },
    ref,
  ) {
    const upper = Number.isFinite(max) && max > 0 ? max : 100;
    const current =
      value === undefined || !Number.isFinite(value)
        ? undefined
        : Math.min(upper, Math.max(0, value));
    const percent = current === undefined ? undefined : (current / upper) * 100;
    return (
      <div
        {...props}
        ref={ref}
        className={cn("w-full", classNames?.root, className)}
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={upper}
        aria-valuenow={current}
        aria-valuetext={current === undefined ? "Loading" : undefined}
      >
        {showLabel && (
          <div
            className={cn(
              "mb-2 flex justify-between gap-3 text-sm text-fg",
              classNames?.labelRow,
            )}
          >
            <span className={classNames?.label}>{label}</span>
            <span className={cn("text-fg-muted", classNames?.value)}>
              {percent === undefined ? "Loading…" : `${Math.round(percent)}%`}
            </span>
          </div>
        )}
        <div
          className={cn(
            "overflow-hidden rounded-full bg-neutral-soft",
            sizes[size],
            classNames?.track,
          )}
        >
          <div
            className={cn(
              "h-full rounded-full transition-[width] duration-300 motion-reduce:transition-none",
              colors[color],
              current === undefined &&
                "w-full animate-pulse motion-reduce:animate-none",
              classNames?.indicator,
              indicatorClassName,
            )}
            style={{ width: percent === undefined ? undefined : `${percent}%` }}
          />
        </div>
      </div>
    );
  },
);
export default Progress;
