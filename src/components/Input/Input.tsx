import React, { ReactNode } from "react";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};
export function Input({ ...inputProps }: Props) {
  return <input {...inputProps} />;
}

export default Input;
