"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "../../utils";
import {
  FieldLabel,
  FieldMessage,
  fieldControl,
  fieldSizes,
  fieldState,
  useField,
  type FieldSize,
  type FieldClassNames,
} from "../shared/field";

export type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
  description?: string;
};
export type SelectClassNames = FieldClassNames & {
  wrapper?: string;
  value?: string;
  indicator?: string;
  popover?: string;
  listbox?: string;
  option?: string;
  optionContent?: string;
  optionLabel?: string;
  optionDescription?: string;
  optionIndicator?: string;
  empty?: string;
};
export type SelectOptionState = {
  selected: boolean;
  highlighted: boolean;
  disabled: boolean;
};
export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  /** Visible field label. */
  label?: React.ReactNode;
  /** Supporting text. */
  description?: React.ReactNode;
  /** Error text; also sets aria-invalid. */
  error?: React.ReactNode;
  /** Padding and text size. */
  size?: FieldSize;
  /** Choices for the styled dropdown. children can supply native optgroups instead. */
  options?: SelectOption[];
  /** Empty choice shown before the options. */
  placeholder?: string;
  /** Per-slot classes. className styles the root. listbox can use --a2z-select-available-height for custom viewport-safe heights. */
  classNames?: SelectClassNames;
  /** Use the native picker. Multiple selects and native children always use native mode. */
  native?: boolean;
  /** Replace the arrow. Pass null to hide it. */
  indicator?: React.ReactNode;
  /** Custom selected content; undefined means the placeholder is selected. */
  renderValue?: (option: SelectOption | undefined) => React.ReactNode;
  /** Custom option content. The option retains its selection semantics and handlers. */
  renderOption?: (
    option: SelectOption,
    state: SelectOptionState,
  ) => React.ReactNode;
  /** Selected value; receives an array when multiple is enabled. */
  onValueChange?: (value: string | string[]) => void;
}
const Chevron = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="m6 9 6 6 6-6"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const NativeSelect = React.forwardRef<HTMLSelectElement, SelectProps>(
  function NativeSelect(
    {
      label,
      description,
      error,
      size = "md",
      options,
      placeholder,
      classNames,
      className,
      id,
      required,
      multiple,
      children,
      onChange,
      onValueChange,
      native: _native,
      indicator = <Chevron />,
      renderValue: _renderValue,
      renderOption: _renderOption,
      "aria-describedby": describedBy,
      ...props
    },
    ref,
  ) {
    const field = useField(id, describedBy, Boolean(error || description));
    return (
      <div className={cn("w-full", classNames?.root, className)}>
        <FieldLabel
          id={field.controlId}
          label={label}
          required={required}
          className={classNames?.label}
          requiredClassName={classNames?.requiredIndicator}
        />
        <div className={cn("relative", classNames?.wrapper)}>
          <select
            {...props}
            ref={ref}
            id={field.controlId}
            required={required}
            multiple={multiple}
            aria-invalid={error ? true : props["aria-invalid"]}
            aria-describedby={field.describedBy}
            className={cn(
              fieldControl,
              "peer cursor-pointer",
              fieldSizes[size],
              !multiple && "appearance-none pe-10",
              fieldState(
                Boolean(
                  error ||
                    props["aria-invalid"] === true ||
                    props["aria-invalid"] === "true",
                ),
              ),
              classNames?.control,
            )}
            onChange={(event) => {
              onChange?.(event);
              onValueChange?.(
                multiple
                  ? Array.from(
                      event.target.selectedOptions,
                      (option) => option.value,
                    )
                  : event.target.value,
              );
            }}
          >
            {placeholder && !multiple && (
              <option value="">{placeholder}</option>
            )}
            {children ??
              options?.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                >
                  {option.label}
                </option>
              ))}
          </select>
          {!multiple && indicator !== null && (
            <span
              aria-hidden="true"
              data-slot="select-indicator"
              className={cn(
                "pointer-events-none absolute end-4 top-1/2 inline-flex -translate-y-1/2 items-center justify-center text-fg-muted peer-disabled:opacity-50",
                classNames?.indicator,
              )}
            >
              {indicator}
            </span>
          )}
        </div>
        <FieldMessage
          id={field.messageId}
          error={error}
          description={description}
          className={classNames?.description}
        />
      </div>
    );
  },
);

// Preserve the public HTMLSelectElement event/ref contract for the native form
// control, while keyboard and focus interaction happens on the visible trigger.
function nativeEvent<E extends React.SyntheticEvent>(
  event: E,
  select: HTMLSelectElement | null,
): E {
  return new Proxy(event, {
    get(target, key) {
      if (key === "currentTarget" || key === "target") return select;
      const value = Reflect.get(target, key);
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
}

const StyledSelect = React.forwardRef<HTMLSelectElement, SelectProps>(
  function StyledSelect(
    {
      options = [],
      label,
      description,
      error,
      size = "md",
      classNames,
      className,
      placeholder,
      value,
      defaultValue,
      onValueChange,
      onChange,
      onInvalid,
      onFocus,
      onBlur,
      onKeyDown,
      onClick,
      indicator = <Chevron />,
      renderValue,
      renderOption,
      id,
      required,
      disabled,
      form,
      style,
      autoFocus,
      tabIndex,
      native: _native,
      multiple: _multiple,
      children: _children,
      "aria-describedby": describedBy,
      "aria-label": ariaLabel,
      "aria-labelledby": labelledBy,
      ...props
    },
    forwardedRef,
  ) {
    const initialValue = () =>
      String(
        defaultValue ??
          (placeholder
            ? ""
            : (options.find((option) => !option.disabled)?.value ?? "")),
      );
    const [internal, setInternal] = React.useState(initialValue);
    const current =
      value === undefined
        ? internal
        : String(Array.isArray(value) ? (value[0] ?? "") : value);
    const selected = options.find((option) => option.value === current);
    const [expanded, setExpanded] = React.useState(false);
    const [activeValue, setActiveValue] = React.useState<string | null>(null);
    const [nativeError, setNativeError] = React.useState("");
    const message = error || nativeError;
    const field = useField(id, describedBy, Boolean(message || description));
    const listId = `${field.controlId}-listbox`;
    const rootRef = React.useRef<HTMLDivElement>(null);
    const triggerRef = React.useRef<HTMLButtonElement>(null);
    const selectRef = React.useRef<HTMLSelectElement | null>(null);
    const popoverRef = React.useRef<HTMLDivElement>(null);
    const listRef = React.useRef<HTMLUListElement>(null);
    const search = React.useRef({ text: "", time: 0 });
    const enabled = options.filter((option) => !option.disabled);
    const active = enabled.find((option) => option.value === activeValue);
    const open = expanded && !disabled;
    const optionId = (option: SelectOption) =>
      `${listId}-${options.indexOf(option)}`;
    const [position, setPosition] = React.useState<React.CSSProperties>({});
    const setRef = React.useCallback(
      (node: HTMLSelectElement | null) => {
        selectRef.current = node;
        if (typeof forwardedRef === "function") forwardedRef(node);
        else if (forwardedRef) forwardedRef.current = node;
      },
      [forwardedRef],
    );
    const close = () => {
      setExpanded(false);
      setActiveValue(null);
      search.current.text = "";
    };

    function place(): boolean {
      const trigger = triggerRef.current;
      if (!trigger) return false;
      const bounds = trigger.getBoundingClientRect();
      let visibleTop = 0,
        visibleBottom = window.innerHeight,
        visibleLeft = 0,
        visibleRight = window.innerWidth;
      for (
        let parent = trigger.parentElement;
        parent;
        parent = parent.parentElement
      ) {
        const css = getComputedStyle(parent),
          rect = parent.getBoundingClientRect();
        if (/(auto|scroll|hidden|clip)/.test(css.overflowY)) {
          visibleTop = Math.max(visibleTop, rect.top);
          visibleBottom = Math.min(visibleBottom, rect.bottom);
        }
        if (/(auto|scroll|hidden|clip)/.test(css.overflowX)) {
          visibleLeft = Math.max(visibleLeft, rect.left);
          visibleRight = Math.min(visibleRight, rect.right);
        }
      }
      if (
        bounds.bottom <= visibleTop ||
        bounds.top >= visibleBottom ||
        bounds.right <= visibleLeft ||
        bounds.left >= visibleRight
      )
        return false;
      const below = window.innerHeight - bounds.bottom - 14,
        above = bounds.top - 14;
      const upwards = below < 240 && above > below;
      const maxHeight = Math.max(0, upwards ? above : below);
      const menuStyle = popoverRef.current
        ? getComputedStyle(popoverRef.current)
        : null;
      const inset = menuStyle
        ? [
            menuStyle.paddingTop,
            menuStyle.paddingBottom,
            menuStyle.borderTopWidth,
            menuStyle.borderBottomWidth,
          ].reduce((sum, value) => sum + parseFloat(value), 0)
        : 14;
      // Portals inherit local library tokens, including container-level themes.
      const computed = getComputedStyle(trigger);
      const tokens = Object.fromEntries(
        Array.from(computed)
          .filter((key) => key.startsWith("--a2z-"))
          .map((key) => [key, computed.getPropertyValue(key)]),
      );
      setPosition({
        ...tokens,
        ["--a2z-select-available-height" as string]: `${Math.max(0, maxHeight - inset)}px`,
        position: "fixed",
        width: Math.min(bounds.width, window.innerWidth - 16),
        left: Math.max(
          8,
          Math.min(bounds.left, window.innerWidth - bounds.width - 8),
        ),
        top: upwards ? undefined : bounds.bottom + 6,
        bottom: upwards ? window.innerHeight - bounds.top + 6 : undefined,
        maxHeight,
        direction: computed.direction as "ltr" | "rtl",
      });
      return true;
    }
    function show(edge?: "first" | "last"): void {
      if (disabled || !place()) return;
      setActiveValue(
        (edge === "last"
          ? enabled[enabled.length - 1]
          : edge === "first"
            ? enabled[0]
            : (enabled.find((option) => option.value === current) ?? enabled[0])
        )?.value ?? null,
      );
      setExpanded(true);
    }
    function choose(option: SelectOption): void {
      if (disabled || option.disabled) return;
      const select = selectRef.current;
      if (select && current !== option.value) {
        select.value = option.value;
        select.dispatchEvent(new Event("input", { bubbles: true }));
        select.dispatchEvent(new Event("change", { bubbles: true }));
      }
      close();
      triggerRef.current?.focus();
    }
    React.useEffect(() => {
      if (disabled) {
        setExpanded(false);
        setActiveValue(null);
      }
    }, [disabled]);
    React.useEffect(() => {
      const select = selectRef.current;
      if (value === undefined && select && select.value !== internal)
        setInternal(select.value);
    }, [options, value, internal]);
    React.useEffect(() => {
      const owner = selectRef.current?.form;
      if (!owner) return;
      const reset = (event: Event) =>
        queueMicrotask(() => {
          if (event.defaultPrevented) return;
          if (value === undefined) setInternal(initialValue());
          setNativeError("");
          setExpanded(false);
          setActiveValue(null);
        });
      owner.addEventListener("reset", reset);
      return () => owner.removeEventListener("reset", reset);
    });
    React.useEffect(() => {
      if (!open) return;
      const outside = (event: PointerEvent) => {
        if (
          !rootRef.current?.contains(event.target as Node) &&
          !popoverRef.current?.contains(event.target as Node)
        ) {
          setExpanded(false);
          setActiveValue(null);
        }
      };
      const update = () => {
        if (!place()) {
          setExpanded(false);
          setActiveValue(null);
        }
      };
      const scroll = (event: Event) => {
        if (
          event.target instanceof Node &&
          popoverRef.current?.contains(event.target)
        )
          return;
        update();
      };
      document.addEventListener("pointerdown", outside);
      window.addEventListener("scroll", scroll, true);
      window.addEventListener("resize", update);
      update();
      const observer = new ResizeObserver(update);
      if (triggerRef.current) observer.observe(triggerRef.current);
      return () => {
        document.removeEventListener("pointerdown", outside);
        window.removeEventListener("scroll", scroll, true);
        window.removeEventListener("resize", update);
        observer.disconnect();
      };
    }, [open]);
    React.useEffect(() => {
      if (!open || !active || !listRef.current) return;
      const element = document.getElementById(optionId(active));
      if (!element) return;
      const item = element.getBoundingClientRect(),
        list = listRef.current.getBoundingClientRect();
      if (item.top < list.top) listRef.current.scrollTop -= list.top - item.top;
      else if (item.bottom > list.bottom)
        listRef.current.scrollTop += item.bottom - list.bottom;
    }, [open, activeValue, options]);

    function keyDown(event: React.KeyboardEvent<HTMLButtonElement>): void {
      onKeyDown?.(
        nativeEvent(
          event,
          selectRef.current,
        ) as unknown as React.KeyboardEvent<HTMLSelectElement>,
      );
      if (event.defaultPrevented || event.nativeEvent.isComposing || disabled)
        return;
      if (event.key === "Tab") {
        close();
        return;
      }
      if (event.key === "Escape" && open) {
        event.preventDefault();
        event.stopPropagation();
        close();
        return;
      }
      if (event.altKey && event.key === "ArrowUp") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        if (!open) {
          show(event.key === "ArrowUp" && !selected ? "last" : undefined);
          return;
        }
        const index = enabled.findIndex(
          (option) => option.value === activeValue,
        );
        const next =
          event.key === "ArrowDown"
            ? (index + 1) % enabled.length
            : index < 0
              ? enabled.length - 1
              : (index - 1 + enabled.length) % enabled.length;
        setActiveValue(enabled[next]?.value ?? null);
        return;
      }
      if (event.key === "Home" || event.key === "End") {
        event.preventDefault();
        show(event.key === "Home" ? "first" : "last");
        return;
      }
      if (
        event.key === "Enter" ||
        (event.key === " " && !search.current.text)
      ) {
        event.preventDefault();
        if (open) {
          if (active) choose(active);
          else close();
        } else show();
        return;
      }
      if (
        event.key.length === 1 &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey
      ) {
        event.preventDefault();
        const now = Date.now(),
          character = event.key.toLocaleLowerCase();
        const previous =
          now - search.current.time < 700 ? search.current.text : "";
        const text = previous === character ? character : previous + character;
        search.current = { text, time: now };
        if (!open) show();
        const index = enabled.findIndex(
          (option) => option.value === activeValue,
        );
        const ordered =
          text.length === 1
            ? [...enabled.slice(index + 1), ...enabled.slice(0, index + 1)]
            : enabled;
        const match = ordered.find((option) =>
          option.label.toLocaleLowerCase().startsWith(text),
        );
        if (match) setActiveValue(match.value);
      }
    }
    const invalid = Boolean(
      message ||
        props["aria-invalid"] === true ||
        props["aria-invalid"] === "true",
    );
    const visibleProps: Record<string, unknown> = {};
    const nativeProps: Record<string, unknown> = {};
    for (const [key, prop] of Object.entries(props)) {
      if (
        key.startsWith("aria-") ||
        key.startsWith("data-") ||
        ["title", "dir", "lang", "hidden", "accessKey", "draggable"].includes(
          key,
        )
      ) {
        visibleProps[key] = prop;
      } else if (
        key.startsWith("on") &&
        typeof prop === "function" &&
        !/^on(Change|Input|Invalid)/.test(key)
      ) {
        visibleProps[key] = (event: React.SyntheticEvent<HTMLButtonElement>) =>
          prop(nativeEvent(event, selectRef.current));
      } else nativeProps[key] = prop;
    }
    return (
      <div
        ref={rootRef}
        data-a2z-select=""
        className={cn("w-full", classNames?.root, className)}
      >
        <FieldLabel
          id={field.controlId}
          label={label}
          required={required}
          className={classNames?.label}
          requiredClassName={classNames?.requiredIndicator}
        />
        <div className={cn("relative", classNames?.wrapper)}>
          <button
            {...(visibleProps as React.ButtonHTMLAttributes<HTMLButtonElement>)}
            ref={triggerRef}
            type="button"
            role="combobox"
            id={field.controlId}
            disabled={disabled}
            autoFocus={autoFocus}
            tabIndex={tabIndex}
            style={style}
            aria-label={ariaLabel}
            aria-labelledby={labelledBy}
            aria-expanded={open}
            aria-haspopup="listbox"
            aria-controls={listId}
            aria-activedescendant={
              open && active ? optionId(active) : undefined
            }
            aria-required={required || props["aria-required"]}
            aria-invalid={message ? true : props["aria-invalid"]}
            aria-describedby={field.describedBy}
            data-open={open}
            data-value={current}
            className={cn(
              fieldControl,
              fieldSizes[size],
              "flex cursor-pointer items-center gap-3 text-start",
              fieldState(invalid),
              classNames?.control,
            )}
            onFocus={(event) =>
              onFocus?.(
                nativeEvent(
                  event,
                  selectRef.current,
                ) as unknown as React.FocusEvent<HTMLSelectElement>,
              )
            }
            onBlur={(event) => {
              onBlur?.(
                nativeEvent(
                  event,
                  selectRef.current,
                ) as unknown as React.FocusEvent<HTMLSelectElement>,
              );
              if (
                !popoverRef.current?.contains(
                  event.relatedTarget as Node | null,
                )
              )
                close();
            }}
            onClick={(event) => {
              onClick?.(
                nativeEvent(
                  event,
                  selectRef.current,
                ) as unknown as React.MouseEvent<HTMLSelectElement>,
              );
              if (!event.defaultPrevented) {
                if (open) close();
                else show();
              }
            }}
            onKeyDown={keyDown}
          >
            <span
              data-slot="select-value"
              className={cn(
                "min-w-0 flex-1 truncate",
                !selected && "text-fg-subtle",
                classNames?.value,
              )}
            >
              {renderValue
                ? renderValue(selected)
                : (selected?.label ?? placeholder ?? "Select an option…")}
            </span>
            {indicator !== null && (
              <span
                aria-hidden="true"
                data-slot="select-indicator"
                data-disabled={Boolean(disabled)}
                className={cn(
                  "pointer-events-none inline-flex shrink-0 items-center justify-center text-fg-muted transition-transform data-[disabled=true]:opacity-40 motion-reduce:transition-none",
                  open && "rotate-180",
                  classNames?.indicator,
                )}
              >
                {indicator}
              </span>
            )}
          </button>
          <select
            {...(nativeProps as React.SelectHTMLAttributes<HTMLSelectElement>)}
            ref={setRef}
            id={`${field.controlId}-native`}
            data-a2z-select-native=""
            aria-hidden="true"
            tabIndex={-1}
            required={required}
            disabled={disabled}
            form={form}
            value={current}
            className="pointer-events-none sr-only"
            autoFocus={false}
            onFocus={() => triggerRef.current?.focus()}
            onChange={(event) => {
              if (value === undefined) setInternal(event.target.value);
              setNativeError("");
              onChange?.(event);
              onValueChange?.(event.target.value);
            }}
            onInvalid={(event) => {
              onInvalid?.(event);
              if (event.defaultPrevented) return;
              event.preventDefault();
              setNativeError(event.currentTarget.validationMessage);
              triggerRef.current?.focus();
            }}
          >
            {placeholder && <option value="">{placeholder}</option>}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <FieldMessage
          id={field.messageId}
          error={message}
          description={description}
          className={classNames?.description}
        />
        {open &&
          createPortal(
            <div
              ref={popoverRef}
              data-slot="select-popover"
              style={position}
              className={cn(
                "z-[1000] overflow-hidden rounded-xl border border-border bg-surface p-1.5 text-fg shadow-xl shadow-black/10",
                classNames?.popover,
              )}
            >
              <ul
                ref={listRef}
                id={listId}
                role="listbox"
                aria-label={
                  typeof label === "string" ? label : (ariaLabel ?? "Choices")
                }
                className={cn(
                  "max-h-[min(16rem,var(--a2z-select-available-height))] overflow-y-auto overscroll-contain",
                  classNames?.listbox,
                )}
              >
                {options.map((option) => {
                  const state: SelectOptionState = {
                    selected: current === option.value,
                    highlighted: active?.value === option.value,
                    disabled: Boolean(option.disabled),
                  };
                  return (
                    <li
                      key={option.value}
                      id={optionId(option)}
                      role="option"
                      data-value={option.value}
                      aria-selected={state.selected}
                      aria-disabled={state.disabled || undefined}
                      data-selected={state.selected}
                      data-highlighted={state.highlighted}
                      data-disabled={state.disabled}
                      onPointerMove={() => {
                        if (!option.disabled) setActiveValue(option.value);
                      }}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => choose(option)}
                      className={cn(
                        "flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors data-[highlighted=true]:bg-primary-soft data-[selected=true]:font-medium data-[selected=true]:text-primary-700 data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-40 motion-reduce:transition-none",
                        classNames?.option,
                      )}
                    >
                      {renderOption ? (
                        renderOption(option, state)
                      ) : (
                        <span
                          className={cn("min-w-0", classNames?.optionContent)}
                        >
                          <span
                            className={cn("block", classNames?.optionLabel)}
                          >
                            {option.label}
                          </span>
                          {option.description && (
                            <span
                              className={cn(
                                "mt-0.5 block text-xs text-fg-muted",
                                classNames?.optionDescription,
                              )}
                            >
                              {option.description}
                            </span>
                          )}
                        </span>
                      )}
                      <span
                        aria-hidden="true"
                        data-slot="select-option-indicator"
                        data-selected={state.selected}
                        className={cn(
                          "inline-flex size-4 shrink-0 items-center justify-center",
                          classNames?.optionIndicator,
                        )}
                      >
                        {state.selected && (
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <path
                              d="m5 12 4 4L19 6"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </span>
                    </li>
                  );
                })}
                {options.length === 0 && (
                  <li
                    role="presentation"
                    className={cn(
                      "px-3 py-4 text-sm text-fg-muted",
                      classNames?.empty,
                    )}
                  >
                    No choices available.
                  </li>
                )}
              </ul>
            </div>,
            document.body,
          )}
      </div>
    );
  },
);

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  function Select(props, ref) {
    return props.native ||
      props.multiple ||
      props.children != null ||
      !props.options ? (
      <NativeSelect {...props} ref={ref} />
    ) : (
      <StyledSelect {...props} ref={ref} />
    );
  },
);
export default Select;
