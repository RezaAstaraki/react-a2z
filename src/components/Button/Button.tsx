import React, { ReactNode } from "react";
import { cn } from "../../utils";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children?: ReactNode;
  label?: string
  resetStyles?: boolean
  className?: string
};

export default function Button({ children, resetStyles, label, className, ...props }: Props) {
  return <button
    className={cn(!resetStyles && "hover:", className)}
    {...props}>
    {label && <span
      className="font-bold tex"

    >{label}</span>}
    {" "} {/* Non-breaking space */}
    {children}
  </button>
}
