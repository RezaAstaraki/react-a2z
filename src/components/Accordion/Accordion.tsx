"use client";

import * as React from "react";
import { cn } from "../../utils";
import { useControllableState } from "../../hooks/useControllableState";

export type AccordionItem = {
  value: string;
  title: React.ReactNode;
  content: React.ReactNode;
  disabled?: boolean;
};
export interface AccordionProps
  extends Omit<
    React.HTMLAttributes<HTMLDivElement>,
    "defaultValue" | "onChange" | "children"
  > {
  /** Sections with unique values. */
  items: AccordionItem[];
  /** Open section values in controlled mode. */
  value?: string[];
  /** Initially open section values. */
  defaultValue?: string[];
  /** Receives the next open section values. */
  onValueChange?: (value: string[]) => void;
  /** Allow several open sections. Otherwise only the first value is used. */
  multiple?: boolean;
  /** Per-slot class overrides. */
  classNames?: { item?: string; trigger?: string; panel?: string };
}
export const Accordion = React.forwardRef<HTMLDivElement, AccordionProps>(
  function Accordion(
    {
      items,
      value,
      defaultValue = [],
      onValueChange,
      multiple = false,
      classNames,
      className,
      id,
      ...props
    },
    ref,
  ) {
    const generatedId = React.useId();
    const rootId = id ?? generatedId;
    const [selection, setSelection] = useControllableState({
      value,
      defaultValue,
      onChange: onValueChange,
    });
    const open = multiple ? selection : selection.slice(0, 1);
    const onKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      const root = event.currentTarget.closest("[data-a2z-accordion]");
      const buttons = Array.from(
        root?.querySelectorAll<HTMLButtonElement>(
          "[data-a2z-accordion-trigger]:not(:disabled)",
        ) ?? [],
      ).filter((button) => button.closest("[data-a2z-accordion]") === root);
      const index = buttons.indexOf(event.currentTarget);
      let next: number;
      if (event.key === "ArrowDown") next = (index + 1) % buttons.length;
      else if (event.key === "ArrowUp")
        next = (index - 1 + buttons.length) % buttons.length;
      else if (event.key === "Home") next = 0;
      else if (event.key === "End") next = buttons.length - 1;
      else return;
      event.preventDefault();
      buttons[next]?.focus();
    };
    return (
      <div
        {...props}
        ref={ref}
        id={rootId}
        data-a2z-accordion=""
        className={cn(
          "overflow-hidden rounded-xl border border-border bg-surface",
          className,
        )}
      >
        {items.map((item) => {
          const expanded = open.includes(item.value);
          const key = `${rootId}-${encodeURIComponent(item.value)}`;
          return (
            <div
              key={item.value}
              className={cn(
                "border-b border-border last:border-b-0",
                classNames?.item,
              )}
            >
              <h3>
                <button
                  type="button"
                  id={`${key}-trigger`}
                  data-a2z-accordion-trigger=""
                  disabled={item.disabled}
                  aria-expanded={expanded}
                  aria-controls={`${key}-panel`}
                  onKeyDown={onKeyDown}
                  onClick={() =>
                    setSelection(
                      expanded
                        ? open.filter((entry) => entry !== item.value)
                        : multiple
                          ? [...open, item.value]
                          : [item.value],
                    )
                  }
                  className={cn(
                    "flex w-full items-center justify-between gap-4 px-5 py-4 text-start text-sm font-medium text-fg transition-colors hover:bg-neutral-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-40",
                    classNames?.trigger,
                  )}
                >
                  {item.title}
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className={cn(
                      "size-4 shrink-0 transition-transform motion-reduce:transition-none",
                      expanded && "rotate-180",
                    )}
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
              </h3>
              <div
                id={`${key}-panel`}
                role="region"
                aria-labelledby={`${key}-trigger`}
                hidden={!expanded}
                className={cn(
                  "px-5 pb-5 text-sm leading-relaxed text-fg-muted",
                  classNames?.panel,
                )}
              >
                {item.content}
              </div>
            </div>
          );
        })}
      </div>
    );
  },
);
export default Accordion;
