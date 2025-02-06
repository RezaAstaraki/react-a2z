import React, { ReactNode } from "react";

type Props = React.HtmlHTMLAttributes<HTMLInputElement> & {
  children: ReactNode;
};
export default function Input({ children, ...inputProps }: Props) {
  return <input {...inputProps}>Input</input>;
}
