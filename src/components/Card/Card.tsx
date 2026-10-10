import * as React from "react";
import { cn } from "../../utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Card surface treatment. */
  variant?: "bordered" | "elevated" | "flat";
}
export const Card = React.forwardRef<HTMLDivElement, CardProps>(function Card(
  { variant = "bordered", className, ...props },
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
        className,
      )}
    />
  );
});
export const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(function CardHeader({ className, ...props }, ref) {
  return (
    <div
      {...props}
      ref={ref}
      className={cn("flex flex-col gap-1 px-6 pt-6", className)}
    />
  );
});
export const CardBody = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(function CardBody({ className, ...props }, ref) {
  return <div {...props} ref={ref} className={cn("p-6", className)} />;
});
export const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(function CardFooter({ className, ...props }, ref) {
  return (
    <div
      {...props}
      ref={ref}
      className={cn("flex items-center gap-3 px-6 pb-6", className)}
    />
  );
});
export default Card;
