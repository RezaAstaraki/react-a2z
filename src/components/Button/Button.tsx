import React, { ReactNode } from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children?: ReactNode;
  label?: string
};

export default function Button({ children, label, ...props }: Props) {
  return <button {...props}>
    {label &&
      <span className="font-bold tex">
        {label}
      </span>
    }
    " "
    {children}
  </button>;
}
