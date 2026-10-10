"use client";

import * as React from "react";
import { cn } from "../../utils";
import { useControllableState } from "../../hooks/useControllableState";
import {
  FieldLabel,
  FieldMessage,
  fieldControl,
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

export type AutocompleteOption = ComboboxOption;
export interface AutocompleteInputProps extends ComboboxFieldProps {
  /** Suggestions with unique values and searchable labels. Free text is allowed. */
  options: AutocompleteOption[];
  /** Controlled input text. Selecting a suggestion inserts its label. */
  value?: string;
  /** Initial input text when uncontrolled. Defaults to an empty string. */
  defaultValue?: string;
  /** Receives input text after typing, selection, clear or form reset. */
  onValueChange?: (value: string) => void;
  /** Receives the full suggestion when selected; value is its identifier. */
  onOptionSelect?: (option: AutocompleteOption) => void;
  /** Native change callback for typing. */
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  /** Minimum text length before showing suggestions. Defaults to 0. */
  minQueryLength?: number;
  /** Show a button to clear the input. Defaults to true. */
  clearable?: boolean;
}

export const AutocompleteInput = React.forwardRef<
  HTMLInputElement,
  AutocompleteInputProps
>(function AutocompleteInput(
  {
    options,
    value,
    defaultValue = "",
    onValueChange,
    onOptionSelect,
    onChange,
    minQueryLength = 0,
    clearable = true,
    label,
    description,
    error,
    size = "md",
    classNames,
    className,
    emptyContent = "No suggestions found.",
    id,
    disabled,
    readOnly,
    required,
    onKeyDown,
    onFocus,
    onBlur,
    style,
    "aria-describedby": describedBy,
    ...props
  },
  forwardedRef,
) {
  const [text, setText] = useControllableState<string>({
    value,
    defaultValue,
    onChange: onValueChange,
  });
  const field = useField(id, describedBy, Boolean(error || description));
  const listId = `${field.controlId}-listbox`;
  const matches = filterOptions(options, text);
  const blocked = Boolean(disabled || readOnly);
  const combo = useCombobox(matches, blocked, listId);
  const showResults = combo.open && text.length >= Math.max(0, minQueryLength);
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
  const select = (option: ComboboxOption) => {
    if (blocked || option.disabled) return;
    setText(option.label);
    onOptionSelect?.(option);
    combo.close();
  };
  useFormReset(combo.inputRef, () => {
    setText(defaultValue);
    combo.close();
  });
  const invalid = Boolean(
    error || props["aria-invalid"] === true || props["aria-invalid"] === "true",
  );

  return (
    <div
      ref={combo.rootRef}
      onBlur={combo.onBlur}
      style={style}
      className={cn("w-full", classNames?.root, className)}
      data-a2z-autocomplete=""
    >
      <FieldLabel
        id={field.controlId}
        label={label}
        required={required}
        className={classNames?.label}
      />
      <div className="relative">
        <input
          {...props}
          ref={setRef}
          id={field.controlId}
          type="text"
          role="combobox"
          autoComplete={props.autoComplete ?? "off"}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          value={text}
          aria-expanded={showResults}
          aria-controls={showResults ? listId : undefined}
          aria-autocomplete="list"
          aria-activedescendant={showResults ? combo.activeId : undefined}
          aria-invalid={invalid || undefined}
          aria-describedby={field.describedBy}
          className={cn(
            fieldControl,
            fieldSizes[size],
            fieldState(invalid),
            "pe-10",
            classNames?.control,
            classNames?.input,
          )}
          onChange={(event) => {
            onChange?.(event);
            setText(event.target.value);
            combo.setActiveValue(null);
            combo.show();
          }}
          onFocus={(event) => {
            onFocus?.(event);
            if (!event.defaultPrevented) combo.show();
          }}
          onBlur={onBlur}
          onKeyDown={(event) => {
            onKeyDown?.(event);
            if (!event.defaultPrevented) {
              // Before the threshold, preserve native editing and submission.
              if (
                text.length >= Math.max(0, minQueryLength) ||
                event.key === "Escape" ||
                event.key === "Tab"
              )
                combo.onKeyDown(event, select);
            }
          }}
        />
        {clearable && text && !readOnly && (
          <button
            type="button"
            disabled={disabled}
            aria-label="Clear input"
            className="absolute end-3 top-1/2 -translate-y-1/2 rounded px-1 text-fg-muted focus-visible:outline-2"
            onClick={() => {
              setText("");
              combo.setActiveValue(null);
              combo.inputRef.current?.focus();
            }}
          >
            ×
          </button>
        )}
        <ComboOptions
          combo={{ ...combo, open: showResults }}
          options={matches}
          listId={listId}
          label="Suggestions"
          selected={options
            .filter((option) => option.label === text)
            .map((option) => option.value)}
          onSelect={select}
          classNames={classNames}
          emptyContent={emptyContent}
        />
      </div>
      <FieldMessage
        id={field.messageId}
        error={error}
        description={description}
        className={classNames?.description}
      />
    </div>
  );
});

export default AutocompleteInput;
