import React, { ReactNode } from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children?: ReactNode;
};

export default function Button({ children, ...props }: Props) {
  return <button {...props}>{children}</button>;
}
