import * as React from "react";
import { cn } from "../../utils";

export type CardClassNames = { root?: string };
export interface CardSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Classes on this section's root. */
  classNames?: CardClassNames;
}

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Card surface treatment. */
  variant?: "bordered" | "elevated" | "flat";
  /** Classes on the card root. Sections accept their own classNames.root. */
  classNames?: CardClassNames;
}
export const Card = React.forwardRef<HTMLDivElement, CardProps>(function Card(
  { variant = "bordered", classNames, className, ...props },
  ref,
) {
  return (
    <div
      {...props}
      ref={ref}
      className={cn(
        "overflow-hidden rounded-xl bg-surface text-fg",
        variant === "bordered" && "border border-border",
        variant === "elevated" && "border border-border shadow-md",
        variant === "flat" && "bg-surface-sunken",
        classNames?.root,
        className,
      )}
    />
  );
});
export const CardHeader = React.forwardRef<HTMLDivElement, CardSectionProps>(
  function CardHeader({ classNames, className, ...props }, ref) {
    return (
      <div
        {...props}
        ref={ref}
        className={cn(
          "flex flex-col gap-1 px-6 pt-6",
          classNames?.root,
          className,
        )}
      />
    );
  },
);
export const CardBody = React.forwardRef<HTMLDivElement, CardSectionProps>(
  function CardBody({ classNames, className, ...props }, ref) {
    return (
      <div
        {...props}
        ref={ref}
        className={cn("p-6", classNames?.root, className)}
      />
    );
  },
);
export const CardFooter = React.forwardRef<HTMLDivElement, CardSectionProps>(
  function CardFooter({ classNames, className, ...props }, ref) {
    return (
      <div
        {...props}
        ref={ref}
        className={cn(
          "flex items-center gap-3 px-6 pb-6",
          classNames?.root,
          className,
        )}
      />
    );
  },
);
export default Card;
