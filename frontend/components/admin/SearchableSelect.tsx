"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

export type SelectOption = { value: string; label: string };

type Props = {
  id: string;
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  /** Greyed out until the field above it is chosen. `disabledHint` explains why. */
  disabled?: boolean;
  disabledHint?: string;
  loading?: boolean;
  /** Set when the list could not be loaded; shows a retry button. */
  loadError?: string | null;
  onRetry?: () => void;
  /** Shown when the list loaded but has nothing in it. */
  emptyText?: string;
  required?: boolean;
  /** Validation message from the form; also marks the field invalid for screen readers. */
  error?: string | null;
};

// Lower-case and drop accents so "nino" finds "Niño".
const fold = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

// A searchable dropdown that looks like the other admin inputs (it reuses the .form-field styles).
// Keyboard: type to filter, ↑/↓ to move, Enter to pick, Esc to close.
export default function SearchableSelect({
  id,
  label,
  value,
  options,
  onChange,
  placeholder = "Select…",
  disabled = false,
  disabledHint,
  loading = false,
  loadError = null,
  onRetry,
  emptyText = "Nothing to choose from",
  required = false,
  error = null,
}: Props) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  const selected = options.find((o) => o.value === value);

  const shown = useMemo(() => {
    const q = fold(query.trim());
    if (!q) return options;
    const starts: SelectOption[] = [];
    const contains: SelectOption[] = [];
    for (const o of options) {
      const l = fold(o.label);
      if (l.startsWith(q)) starts.push(o);
      else if (l.includes(q)) contains.push(o);
    }
    return [...starts, ...contains];
  }, [options, query]);

  // Keep the highlighted row inside the visible part of the list.
  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  function openList() {
    if (disabled || loading || loadError) return;
    setQuery("");
    const i = shown.findIndex((o) => o.value === value);
    setActive(i >= 0 ? i : 0);
    setOpen(true);
  }

  function pick(o: SelectOption) {
    onChange(o.value);
    setOpen(false);
    setQuery("");
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) openList();
      else setActive((i) => Math.min(i + 1, Math.max(shown.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (open) setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      if (open) {
        e.preventDefault(); // never submit the listing form from here
        if (shown[active]) pick(shown[active]);
      }
    } else if (e.key === "Escape") {
      if (open) {
        e.preventDefault();
        setOpen(false);
        setQuery("");
      }
    }
  }

  const status = loading ? "Loading…" : loadError ? loadError : null;
  const text = open ? query : selected?.label ?? "";
  const inputPlaceholder = disabled && disabledHint ? disabledHint : loading ? "Loading…" : placeholder;
  const describedBy = error ? `${id}-error` : undefined;

  return (
    <div className="form-field">
      <label htmlFor={id}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </label>
      <div className="relative">
        <input
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && shown[active] ? `${listId}-${active}` : undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          aria-required={required || undefined}
          autoComplete="off"
          spellCheck={false}
          disabled={disabled}
          value={text}
          placeholder={inputPlaceholder}
          style={{ paddingRight: 38, ...(error ? { borderColor: "#b91c1c" } : null) }}
          onFocus={openList}
          onClick={() => !open && openList()}
          onChange={(e) => {
            if (!open) setOpen(true);
            setQuery(e.target.value);
            setActive(0);
          }}
          onBlur={() => {
            setOpen(false);
            setQuery("");
          }}
          onKeyDown={onKeyDown}
        />
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          className={`pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="m5 8 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>

        {open && (
          <ul
            id={listId}
            ref={listRef}
            role="listbox"
            aria-label={label}
            className="absolute z-30 mt-1 max-h-64 w-full overflow-auto rounded-[10px] border border-[#ded6ca] bg-white py-1 text-sm shadow-card"
            // keep focus in the input so a click on a row is not swallowed by the blur
            onMouseDown={(e) => e.preventDefault()}
          >
            {shown.length === 0 ? (
              <li role="presentation" className="px-3 py-2 text-muted">
                {options.length === 0 ? emptyText : <>No match for “{query.trim()}”</>}
              </li>
            ) : (
              shown.map((o, i) => (
                <li
                  key={o.value}
                  id={`${listId}-${i}`}
                  data-index={i}
                  role="option"
                  aria-selected={o.value === value}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => pick(o)}
                  className={`cursor-pointer px-3 py-2 ${i === active ? "bg-cream" : ""} ${o.value === value ? "font-semibold text-gold-dark" : ""}`}
                >
                  {o.label}
                </li>
              ))
            )}
          </ul>
        )}
      </div>

      {status && (
        <p role="status" className={`text-xs ${loadError ? "text-red-700" : "text-muted"}`}>
          {status}{" "}
          {loadError && onRetry && (
            <button type="button" onClick={onRetry} className="font-semibold text-gold-dark underline">
              Try again
            </button>
          )}
        </p>
      )}
      {!status && !disabled && options.length === 0 && <p className="text-xs text-muted">{emptyText}</p>}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
