"use client";

import * as React from "react";
import { cn } from "../../utils";
import { useControllableState } from "../../hooks/useControllableState";
import {
  FieldLabel,
  FieldMessage,
  fieldSizes,
  fieldState,
  useField,
} from "../shared/field";
import {
  ComboOptions,
  filterOptions,
  useCombobox,
  useFormReset,
  type ComboboxFieldProps,
  type ComboboxOption,
} from "../shared/combobox";

export type MultiSelectOption = ComboboxOption;
export interface MultiSelectProps extends ComboboxFieldProps {
  /** Choices with unique string values. */
  options: MultiSelectOption[];
  /** Controlled selected option values. */
  value?: string[];
  /** Initial selection when uncontrolled. Defaults to an empty array. */
  defaultValue?: string[];
  /** Receives the selected values after a selection, removal, clear or form reset. */
  onValueChange?: (value: string[]) => void;
  /** Maximum selections. Existing selections can always be removed. */
  maxSelected?: number;
  /** Show a button to clear the selection. Defaults to true. */
  clearable?: boolean;
  /** Receives search text changes; the search input is not submitted. */
  onQueryChange?: (query: string) => void;
}

export const MultiSelect = React.forwardRef<HTMLInputElement, MultiSelectProps>(
  function MultiSelect(
    {
      options,
      value,
      defaultValue = [],
      onValueChange,
      maxSelected,
      clearable = true,
      onQueryChange,
      label,
      description,
      error,
      size = "md",
      classNames,
      className,
      emptyContent = "No options found.",
      placeholder = "Select options…",
      id,
      name,
      form,
      required,
      disabled,
      readOnly,
      onKeyDown,
      onFocus,
      onBlur,
      style,
      "aria-describedby": describedBy,
      "aria-label": ariaLabel,
      ...props
    },
    forwardedRef,
  ) {
    const [selection, setSelection] = useControllableState<string[]>({
      value,
      defaultValue,
      onChange: onValueChange,
    });
    const selected = [...new Set(selection)];
    const [query, setQuery] = React.useState("");
    const field = useField(id, describedBy, Boolean(error || description));
    const listId = `${field.controlId}-listbox`;
    const blocked = Boolean(disabled || readOnly);
    const limit =
      maxSelected !== undefined && Number.isFinite(maxSelected)
        ? Math.max(0, Math.floor(maxSelected))
        : Infinity;
    const matches = filterOptions(options, query).map((option) => ({
      ...option,
      disabled:
        option.disabled ||
        (selected.length >= limit && !selected.includes(option.value)),
    }));
    const combo = useCombobox(matches, blocked, listId);
    const setRef = React.useCallback(
      (node: HTMLInputElement | null) => {
        (
          combo.inputRef as React.MutableRefObject<HTMLInputElement | null>
        ).current = node;
        if (typeof forwardedRef === "function") forwardedRef(node);
        else if (forwardedRef) forwardedRef.current = node;
      },
      [combo.inputRef, forwardedRef],
    );
    const changeQuery = (next: string) => {
      setQuery(next);
      onQueryChange?.(next);
      combo.setActiveValue(null);
    };
    const select = (option: ComboboxOption) => {
      if (blocked || option.disabled) return;
      setSelection(
        selected.includes(option.value)
          ? selected.filter((item) => item !== option.value)
          : [...selected, option.value],
      );
      changeQuery("");
    };
    useFormReset(combo.inputRef, () => {
      setSelection([...defaultValue]);
      changeQuery("");
      combo.close();
    });
    const invalid = Boolean(
      error ||
        props["aria-invalid"] === true ||
        props["aria-invalid"] === "true",
    );
    const nativeOptions = [
      ...options,
      ...selected
        .filter((item) => !options.some((option) => option.value === item))
        .map((item) => ({ value: item, label: item })),
    ];

    return (
      <div
        ref={combo.rootRef}
        onBlur={combo.onBlur}
        style={style}
        className={cn("w-full", classNames?.root, className)}
        data-a2z-multiselect=""
      >
        <FieldLabel
          id={field.controlId}
          label={label}
          required={required}
          className={classNames?.label}
          requiredClassName={classNames?.requiredIndicator}
        />
        <div className={cn("relative", classNames?.wrapper)}>
          <div
            className={cn(
              "flex w-full flex-wrap items-center gap-2 rounded-lg border bg-surface text-fg transition-colors focus-within:ring-2",
              fieldSizes[size],
              fieldState(invalid),
              invalid
                ? "focus-within:ring-danger-500"
                : "focus-within:ring-primary-500",
              disabled && "cursor-not-allowed bg-disabled text-disabled-fg",
              classNames?.control,
            )}
          >
            {selected.map((item) => {
              const optionLabel =
                options.find((option) => option.value === item)?.label ?? item;
              return (
                <span
                  key={item}
                  className={cn(
                    "inline-flex max-w-full items-center gap-1 rounded-md bg-primary-soft px-2 py-0.5 text-xs text-primary-700",
                    classNames?.chip,
                  )}
                >
                  <span className={cn("truncate", classNames?.chipLabel)}>
                    {optionLabel}
                  </span>
                  {!readOnly && (
                    <button
                      type="button"
                      disabled={disabled}
                      aria-label={`Remove ${optionLabel}`}
                      className={cn(
                        "cursor-pointer rounded px-1 hover:bg-primary-soft-hover focus-visible:outline-2 focus-visible:outline-offset-1 disabled:cursor-not-allowed",
                        classNames?.removeButton,
                      )}
                      onClick={() => {
                        setSelection(
                          selected.filter((current) => current !== item),
                        );
                        combo.inputRef.current?.focus();
                      }}
                    >
                      ×
                    </button>
                  )}
                </span>
              );
            })}
            <input
              {...props}
              ref={setRef}
              id={field.controlId}
              form={form}
              type="text"
              role="combobox"
              autoComplete={props.autoComplete ?? "off"}
              aria-label={ariaLabel}
              aria-required={required || undefined}
              aria-expanded={combo.open}
              aria-controls={combo.open ? listId : undefined}
              aria-autocomplete="list"
              aria-activedescendant={combo.activeId}
              aria-invalid={invalid || undefined}
              aria-describedby={field.describedBy}
              disabled={disabled}
              readOnly={readOnly}
              value={query}
              placeholder={selected.length ? "Add more…" : placeholder}
              className={cn(
                "min-w-0 flex-1 basis-24 cursor-text bg-transparent text-fg placeholder:text-fg-subtle outline-none disabled:cursor-not-allowed",
                classNames?.input,
              )}
              onChange={(event) => {
                changeQuery(event.target.value);
                combo.show();
              }}
              onFocus={(event) => {
                onFocus?.(event);
                if (!event.defaultPrevented) combo.show();
              }}
              onBlur={onBlur}
              onKeyDown={(event) => {
                onKeyDown?.(event);
                if (event.defaultPrevented) return;
                combo.onKeyDown(event, select);
                if (
                  !event.defaultPrevented &&
                  !blocked &&
                  !event.nativeEvent.isComposing &&
                  event.keyCode !== 229 &&
                  event.key === "Backspace" &&
                  !query &&
                  selected.length
                ) {
                  event.preventDefault();
                  setSelection(selected.slice(0, -1));
                }
              }}
            />
            {clearable && selected.length > 0 && !readOnly && (
              <button
                type="button"
                disabled={disabled}
                aria-label="Clear selections"
                className={cn(
                  "cursor-pointer rounded px-1 text-fg-muted hover:text-fg focus-visible:outline-2 disabled:cursor-not-allowed",
                  classNames?.clearButton,
                )}
                onClick={() => {
                  setSelection([]);
                  changeQuery("");
                  combo.inputRef.current?.focus();
                }}
              >
                ×
              </button>
            )}
            <button
              type="button"
              disabled={blocked}
              aria-label={combo.open ? "Close options" : "Open options"}
              aria-expanded={combo.open}
              aria-controls={combo.open ? listId : undefined}
              className={cn(
                "cursor-pointer rounded px-1 text-fg-muted hover:text-fg focus-visible:outline-2 disabled:cursor-not-allowed",
                classNames?.toggleButton,
              )}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                if (combo.open) combo.close();
                else {
                  combo.inputRef.current?.focus();
                  combo.show();
                }
              }}
            >
              <span aria-hidden="true" className={classNames?.toggleIcon}>
                ⌄
              </span>
            </button>
          </div>
          <ComboOptions
            combo={combo}
            options={matches}
            listId={listId}
            label="Available options"
            selected={selected}
            onSelect={select}
            classNames={classNames}
            emptyContent={emptyContent}
            multiple
          />
        </div>
        <select
          multiple
          name={name}
          form={form}
          required={required && !readOnly}
          disabled={disabled}
          value={selected}
          tabIndex={-1}
          aria-hidden="true"
          className="sr-only"
          onChange={() => {}}
          onInvalid={(event) => {
            event.preventDefault();
            combo.inputRef.current?.focus();
          }}
        >
          {nativeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span role="status" className={cn("sr-only", classNames?.status)}>
          {selected.length} selected
          {Number.isFinite(limit) ? `, maximum ${limit}` : ""}
        </span>
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

export default MultiSelect;
