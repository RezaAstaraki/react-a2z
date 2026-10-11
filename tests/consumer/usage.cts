// Keep these previous-release usages unchanged when checking a compatible release.
import { createElement, createRef } from "react";
import {
  Button,
  Input,
  Select,
  type SelectProps,
  type ButtonProps,
} from "react-a2z";
import { Select as SubpathSelect } from "react-a2z/Select";
import { Button as SubpathButton } from "react-a2z/Button";
import { cn } from "react-a2z";

const button: ButtonProps = {
  text: "Save",
  variant: "solid",
  color: "primary",
  classNames: { root: "rounded-none" },
};
const select: SelectProps = {
  options: [{ value: "one", label: "One" }],
  defaultValue: "one",
  name: "choice",
  classNames: { root: "w-full", optionLabel: "text-sm" },
  onValueChange: (value: string | string[]) => {
    void value;
  },
};
createElement(Button, button);
createElement(SubpathButton, button);
createElement(Input, {
  label: "Email",
  id: "email",
  ref: createRef<HTMLInputElement>(),
});
createElement(Select, select);
createElement(SubpathSelect, select);
cn("p-2", { "p-4": true });
