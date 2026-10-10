import * as React from "react";
import { cn } from "../../utils";

export type SkeletonClassNames = { root?: string };

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Shape of the placeholder. */
  variant?: "text" | "rounded" | "circle";
  /** Toggle the pulse animation; reduced-motion preference always wins. */
  animated?: boolean;
  /** Classes on the placeholder root. */
  classNames?: SkeletonClassNames;
}
export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  function Skeleton(
    { variant = "rounded", animated = true, classNames, className, ...props },
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
          classNames?.root,
          className,
        )}
      />
    );
  },
);
export default Skeleton;
