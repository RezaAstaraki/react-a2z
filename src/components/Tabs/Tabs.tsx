"use client";

import * as React from "react";
import { cn } from "../../utils";
import { useControllableState } from "../../hooks/useControllableState";

export type TabItem = {
  value: string;
  label: React.ReactNode;
  content: React.ReactNode;
  disabled?: boolean;
};
export interface TabsProps
  extends Omit<
    React.HTMLAttributes<HTMLDivElement>,
    "defaultValue" | "onChange" | "children"
  > {
  /** Tabs with unique values, labels and panel content. */
  items: TabItem[];
  /** Accessible name of the tab list. */
  label: string;
  /** Selected tab in controlled mode. */
  value?: string;
  /** Initially selected tab in uncontrolled mode. */
  defaultValue?: string;
  /** Receives the selected tab's value. */
  onValueChange?: (value: string) => void;
  /** Direction of the tab list and its arrow keys. */
  orientation?: "horizontal" | "vertical";
  /** Automatic selects on arrow keys; manual requires Enter or Space. */
  activationMode?: "automatic" | "manual";
  /** Per-slot class overrides. */
  classNames?: { list?: string; tab?: string; panel?: string };
}
export const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(function Tabs(
  {
    items,
    label,
    value,
    defaultValue,
    onValueChange,
    orientation = "horizontal",
    activationMode = "automatic",
    classNames,
    className,
    id,
    ...props
  },
  ref,
) {
  const generatedId = React.useId();
  const rootId = id ?? generatedId;
  const firstEnabled = items.find((item) => !item.disabled)?.value ?? "";
  const [selection, setSelection] = useControllableState({
    value,
    defaultValue: defaultValue ?? firstEnabled,
    onChange: onValueChange,
  });
  const activeValue = items.some(
    (item) => item.value === selection && !item.disabled,
  )
    ? selection
    : firstEnabled;
  const tabId = (key: string) => `${rootId}-tab-${encodeURIComponent(key)}`;
  const panelId = (key: string) => `${rootId}-panel-${encodeURIComponent(key)}`;
  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const target = (event.target as HTMLElement).closest<HTMLButtonElement>(
      '[role="tab"]',
    );
    if (
      !target ||
      target.parentElement !== event.currentTarget ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey
    )
      return;
    const buttons = Array.from(
      event.currentTarget.querySelectorAll<HTMLButtonElement>(
        '[role="tab"]:not(:disabled)',
      ),
    );
    const index = buttons.indexOf(target);
    const rtl = getComputedStyle(event.currentTarget).direction === "rtl";
    const nextKey =
      orientation === "vertical"
        ? "ArrowDown"
        : rtl
          ? "ArrowLeft"
          : "ArrowRight";
    const previousKey =
      orientation === "vertical" ? "ArrowUp" : rtl ? "ArrowRight" : "ArrowLeft";
    let nextIndex: number;
    if (event.key === nextKey) nextIndex = (index + 1) % buttons.length;
    else if (event.key === previousKey)
      nextIndex = (index - 1 + buttons.length) % buttons.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = buttons.length - 1;
    else return;
    event.preventDefault();
    const next = buttons[nextIndex];
    next?.focus();
    if (next && activationMode === "automatic")
      setSelection(next.dataset.value!);
  };
  return (
    <div
      {...props}
      ref={ref}
      id={rootId}
      className={cn(
        orientation === "vertical" && "flex items-start gap-6",
        className,
      )}
    >
      <div
        role="tablist"
        aria-label={label}
        aria-orientation={orientation}
        onKeyDown={onKeyDown}
        className={cn(
          "flex gap-1 rounded-lg bg-neutral-soft p-1",
          orientation === "vertical"
            ? "shrink-0 flex-col"
            : "w-fit max-w-full overflow-x-auto",
          classNames?.list,
        )}
      >
        {items.map((item) => (
          <button
            key={item.value}
            type="button"
            role="tab"
            id={tabId(item.value)}
            data-value={item.value}
            aria-controls={panelId(item.value)}
            aria-selected={item.value === activeValue}
            disabled={item.disabled}
            tabIndex={item.value === activeValue ? 0 : -1}
            onClick={() => setSelection(item.value)}
            className={cn(
              "whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-40 motion-reduce:transition-none",
              item.value === activeValue
                ? "bg-surface text-fg shadow-sm"
                : "text-fg-muted hover:text-fg",
              classNames?.tab,
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
      {items.map((item) => (
        <div
          key={item.value}
          role="tabpanel"
          id={panelId(item.value)}
          aria-labelledby={tabId(item.value)}
          hidden={item.value !== activeValue}
          tabIndex={0}
          className={cn(
            "rounded-lg text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
            orientation === "horizontal" ? "mt-4" : "min-w-0 flex-1",
            classNames?.panel,
          )}
        >
          {item.content}
        </div>
      ))}
    </div>
  );
});
export default Tabs;
