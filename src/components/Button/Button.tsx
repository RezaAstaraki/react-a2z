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
    className={cn(!resetStyles && "px-4 py-2 bg-gray-500 flex items-center justify-center font-bold hover:bg-red-500", className)}
    {...props}>
    {label && <span
      className="font-bold tex"

    >{label}</span>}
    {" "} {/* Non-breaking space */}
    {children}
  </button>
}
