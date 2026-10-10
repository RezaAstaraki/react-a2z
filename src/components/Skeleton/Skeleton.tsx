import * as React from "react";
import { cn } from "../../utils";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Shape of the placeholder. */
  variant?: "text" | "rounded" | "circle";
  /** Toggle the pulse animation; reduced-motion preference always wins. */
  animated?: boolean;
}
export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  function Skeleton(
    { variant = "rounded", animated = true, className, ...props },
    ref,
  ) {
    return (
      <div
        {...props}
        ref={ref}
        aria-hidden="true"
        className={cn(
          "bg-neutral-soft",
          variant === "text"
            ? "h-4 w-full rounded"
            : variant === "circle"
              ? "size-10 rounded-full"
              : "h-24 w-full rounded-lg",
          animated && "animate-pulse motion-reduce:animate-none",
          className,
        )}
      />
    );
  },
);
export default Skeleton;
