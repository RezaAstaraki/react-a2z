"use client";

import * as React from "react";
import { cn } from "../../utils";

export type ComboboxOption = {
  /** Unique option identifier. */
  value: string;
  /** Text used for filtering and accessible names. */
  label: string;
  disabled?: boolean;
  description?: string;
};

export type ComboboxClassNames = {
  root?: string;
  label?: string;
  requiredIndicator?: string;
  wrapper?: string;
  control?: string;
  input?: string;
  listbox?: string;
  popover?: string;
  option?: string;
  optionContent?: string;
  optionLabel?: string;
  optionDescription?: string;
  optionIndicator?: string;
  chip?: string;
  chipLabel?: string;
  removeButton?: string;
  clearButton?: string;
  toggleButton?: string;
  toggleIcon?: string;
  empty?: string;
  status?: string;
  description?: string;
};

export interface ComboboxFieldProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "size" | "type" | "value" | "defaultValue" | "onChange" | "children"
  > {
  /** Visible field label. */
  label?: React.ReactNode;
  /** Supporting text linked to the field. */
  description?: React.ReactNode;
  /** Error text; also marks the field invalid. */
  error?: React.ReactNode;
  /** Field padding and text size. Defaults to md. */
  size?: "sm" | "md" | "lg";
  /** Per-slot classes. className styles the root wrapper. */
  classNames?: ComboboxClassNames;
  /** Content shown when the search has no matches. */
  emptyContent?: React.ReactNode;
}

export function useFormReset(
  inputRef: React.RefObject<HTMLInputElement>,
  reset: () => void,
) {
  const resetRef = React.useRef(reset);
  resetRef.current = reset;
  React.useEffect(() => {
    const form = inputRef.current?.form;
    if (!form) return;
    const listener = (event: Event) => {
      // A later reset handler can cancel the native reset.
      queueMicrotask(() => {
        if (!event.defaultPrevented) resetRef.current();
      });
    };
    form.addEventListener("reset", listener);
    return () => form.removeEventListener("reset", listener);
  });
}

export function filterOptions(options: ComboboxOption[], query: string) {
  const search = query.trim().toLocaleLowerCase();
  return options.filter((option) =>
    option.label.toLocaleLowerCase().includes(search),
  );
}

export function useCombobox(
  options: ComboboxOption[],
  blocked: boolean,
  listId: string,
) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLUListElement>(null);
  const [expanded, setExpanded] = React.useState(false);
  const [activeValue, setActiveValue] = React.useState<string | null>(null);
  const open = expanded && !blocked;
  const enabled = options.filter((option) => !option.disabled);
  const active = enabled.find((option) => option.value === activeValue);
  const optionId = (value: string) =>
    `${listId}-${options.findIndex((option) => option.value === value)}`;
  const close = () => {
    setExpanded(false);
    setActiveValue(null);
  };

  React.useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setExpanded(false);
        setActiveValue(null);
      }
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);

  React.useEffect(() => {
    if (!open || !active) return;
    const element = document.getElementById(optionId(active.value));
    const list = listRef.current;
    if (!element || !list) return;
    // Scroll just the results, never the page or a surrounding dialog.
    const item = element.getBoundingClientRect();
    const bounds = list.getBoundingClientRect();
    if (item.top < bounds.top) list.scrollTop -= bounds.top - item.top;
    else if (item.bottom > bounds.bottom)
      list.scrollTop += item.bottom - bounds.bottom;
  });

  function onKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>,
    select: (option: ComboboxOption) => void,
  ) {
    if (blocked || event.nativeEvent.isComposing || event.keyCode === 229)
      return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setExpanded(true);
      const index = open
        ? enabled.findIndex((option) => option.value === activeValue)
        : -1;
      const next =
        event.key === "ArrowDown"
          ? (index + 1) % enabled.length
          : index < 0
            ? enabled.length - 1
            : (index - 1 + enabled.length) % enabled.length;
      setActiveValue(enabled[next]?.value ?? null);
    } else if (
      open &&
      active &&
      (event.key === "Home" || event.key === "End")
    ) {
      event.preventDefault();
      setActiveValue(
        (event.key === "Home" ? enabled[0] : enabled[enabled.length - 1])
          ?.value ?? null,
      );
    } else if (open && active && event.key === "Enter") {
      event.preventDefault();
      select(active);
    } else if (open && event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      close();
    } else if (event.key === "Tab") close();
  }

  return {
    rootRef,
    inputRef,
    listRef,
    open,
    active,
    optionId,
    activeId: open && active ? optionId(active.value) : undefined,
    show: () => {
      if (!blocked) setExpanded(true);
    },
    close,
    setActiveValue,
    onKeyDown,
    onBlur: (event: React.FocusEvent<HTMLDivElement>) => {
      if (!event.currentTarget.contains(event.relatedTarget as Node | null))
        close();
    },
  };
}

export function ComboOptions({
  combo,
  options,
  listId,
  label,
  selected,
  onSelect,
  classNames,
  emptyContent,
  multiple = false,
}: {
  combo: ReturnType<typeof useCombobox>;
  options: ComboboxOption[];
  listId: string;
  label: string;
  selected: string[];
  onSelect: (option: ComboboxOption) => void;
  classNames?: ComboboxClassNames;
  emptyContent: React.ReactNode;
  multiple?: boolean;
}) {
  if (!combo.open) return null;
  return (
    <div
      className={cn(
        "absolute start-0 top-full z-50 mt-1 w-full rounded-lg border border-border bg-surface text-fg shadow-lg",
        classNames?.popover,
      )}
      data-slot="combobox-popover"
    >
      <ul
        ref={combo.listRef}
        id={listId}
        role="listbox"
        aria-label={label}
        aria-multiselectable={multiple || undefined}
        className={cn("max-h-60 overflow-auto p-1", classNames?.listbox)}
      >
        {options.map((option) => (
          <li
            key={option.value}
            id={combo.optionId(option.value)}
            role="option"
            aria-selected={selected.includes(option.value)}
            aria-disabled={option.disabled || undefined}
            data-highlighted={combo.active?.value === option.value || undefined}
            data-selected={selected.includes(option.value) || undefined}
            data-disabled={option.disabled || undefined}
            onPointerMove={() => {
              if (!option.disabled) combo.setActiveValue(option.value);
            }}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              if (!option.disabled) onSelect(option);
            }}
            className={cn(
              "flex cursor-pointer items-center justify-between gap-3 rounded-md px-3 py-2 text-sm",
              combo.active?.value === option.value && "bg-primary-soft",
              selected.includes(option.value) && "font-medium text-primary-700",
              option.disabled && "cursor-not-allowed opacity-50",
              classNames?.option,
            )}
          >
            <span className={classNames?.optionContent}>
              <span className={cn("block", classNames?.optionLabel)}>
                {option.label}
              </span>
              {option.description && (
                <span
                  className={cn(
                    "block text-xs text-fg-muted",
                    classNames?.optionDescription,
                  )}
                >
                  {option.description}
                </span>
              )}
            </span>
            {selected.includes(option.value) && (
              <span aria-hidden="true" className={classNames?.optionIndicator}>
                ✓
              </span>
            )}
          </li>
        ))}
      </ul>
      {options.length === 0 && (
        <div
          role="status"
          className={cn("px-4 py-3 text-sm text-fg-muted", classNames?.empty)}
        >
          {emptyContent}
        </div>
      )}
    </div>
  );
}
