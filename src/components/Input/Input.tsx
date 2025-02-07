import React, { ReactNode } from "react";

type Props = React.HtmlHTMLAttributes<HTMLInputElement> & {
  label?: string;
};
export function Input({ ...props }: Props) {
  return <input {...props} />;
}

export default Input;
