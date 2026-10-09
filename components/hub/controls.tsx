"use client";

import { useEffect, useId, useRef, useState } from "react";
import { IconCheck, IconChevronDown, IconSearch, IconUpload } from "@tabler/icons-react";
import "@/components/cobalt/community.css";
import "./hub.css";

// Themed form controls for the account and admin screens. They reuse the
// Cobalt field and popover styles; nothing here renders a native select,
// checkbox or file input on screen.

export type PickerOption = { value: string; label: string; hint?: string; disabled?: boolean };

/** Single-choice dropdown with search for long lists. Keyboard: arrows, Home/End, Enter, Escape. */
export function Picker({ label, placeholder, options, value, onChange, disabled, loading, searchPlaceholder }: {
  label: string;
  placeholder: string;
  options: PickerOption[];
  value: string | null;
  onChange: (value: string) => void;
  disabled?: boolean;
  loading?: boolean;
  searchPlaceholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const id = useId();
  const selected = options.find((option) => option.value === value);
  const searchable = options.length > 8;
  const q = query.trim().toLocaleLowerCase("en");
  const matches = q ? options.filter((option) => `${option.label} ${option.hint ?? ""}`.toLocaleLowerCase("en").includes(q)) : options;
  const visible = matches.slice(0, 80);

  useEffect(() => {
    if (!open) return;
    const list = listRef.current;
    (searchable ? inputRef.current : list?.querySelector<HTMLElement>('[aria-selected="true"]:not([disabled])') ?? list?.querySelector<HTMLElement>('[role="option"]:not([disabled])'))?.focus();
    function onPointer(event: PointerEvent) { if (!ref.current?.contains(event.target as Node)) close(); }
    window.addEventListener("pointerdown", onPointer);
    return () => window.removeEventListener("pointerdown", onPointer);
  }, [open, searchable]);

  function close(refocus = false) {
    setOpen(false);
    setQuery("");
    if (refocus) triggerRef.current?.focus();
  }

  function choose(option: PickerOption) {
    if (option.disabled) return;
    onChange(option.value);
    close(true);
  }

  function onTriggerKey(event: React.KeyboardEvent) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); setOpen(true); }
    else if (event.key === "Escape" && open) { event.preventDefault(); close(); }
  }

  function onPopoverKey(event: React.KeyboardEvent) {
    const inSearch = event.target === inputRef.current;
    if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); close(true); return; }
    if (event.key === "Tab") { close(); return; }
    if (event.key === "Enter" && inSearch) {
      // Enter in the search box picks the first match instead of submitting the surrounding form.
      event.preventDefault();
      const first = visible.find((option) => !option.disabled);
      if (first) choose(first);
      return;
    }
    if (inSearch && (event.key === "Home" || event.key === "End")) return;
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const items = [...(listRef.current?.querySelectorAll<HTMLElement>('[role="option"]:not([disabled])') ?? [])];
    if (!items.length) return;
    if (event.key === "Home") { items[0].focus(); return; }
    if (event.key === "End") { items[items.length - 1].focus(); return; }
    const at = items.indexOf(document.activeElement as HTMLElement);
    if (at === -1) { items[event.key === "ArrowDown" ? 0 : items.length - 1].focus(); return; }
    if (event.key === "ArrowUp" && at === 0 && searchable) { inputRef.current?.focus(); return; }
    items[(at + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length].focus();
  }

  return (
    <div className="cb-popover-wrap cb-cm-filter cb-hub-picker" ref={ref}>
      <span className="cb-hub-label" id={`${id}-label`}>{label}</span>
      <button ref={triggerRef} type="button" className="cb-cm-filter-trigger" data-set={selected ? true : undefined} disabled={disabled || loading}
        aria-haspopup="listbox" aria-expanded={open} aria-controls={open ? `${id}-list` : undefined} aria-labelledby={`${id}-label ${id}-value`}
        onKeyDown={onTriggerKey} onClick={() => (open ? close() : setOpen(true))}>
        <span className="cb-cm-filter-value cb-truncate" id={`${id}-value`}>{loading ? "Loading…" : selected?.label ?? placeholder}</span>
        <IconChevronDown size={15} stroke={2} aria-hidden />
      </button>
      {open ? (
        <div className="cb-popover cb-menu cb-cm-filter-pop" onKeyDown={onPopoverKey}>
          {searchable ? (
            <label className="cb-cm-filter-search">
              <IconSearch size={15} stroke={1.75} aria-hidden />
              <span className="cb-sr-only">Search {label}</span>
              <input ref={inputRef} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={searchPlaceholder ?? `Search ${options.length}`}
                autoComplete="off" spellCheck={false} aria-controls={`${id}-list`} />
            </label>
          ) : null}
          <div className="cb-cm-filter-list cb-scroll-autohide" ref={listRef} role="listbox" id={`${id}-list`} aria-labelledby={`${id}-label`}>
            {visible.map((option) => (
              <button key={option.value} type="button" role="option" aria-selected={option.value === value} disabled={option.disabled} onClick={() => choose(option)}>
                <span className="cb-cm-filter-option">
                  <span>{option.label}</span>
                  {option.hint ? <small>{option.hint}</small> : null}
                </span>
                {option.value === value ? <IconCheck size={16} stroke={2.25} aria-hidden /> : null}
              </button>
            ))}
          </div>
          {!visible.length ? <p className="cb-cm-filter-none" role="status">Nothing matches “{query}”.</p> : null}
          {matches.length > visible.length ? <p className="cb-cm-filter-more">Showing {visible.length} of {matches.length}. Type to narrow the list.</p> : null}
        </div>
      ) : null}
    </div>
  );
}

export function TextField({ label, value, onChange, max, placeholder, type = "text", error, hint, required, autoComplete, prefix, inputMode, counter = true }: {
  label: string; value: string; onChange: (value: string) => void; max: number; placeholder?: string; type?: "text" | "url" | "email";
  error?: string; hint?: string; required?: boolean; autoComplete?: string; prefix?: string; inputMode?: "numeric" | "url" | "email" | "text"; counter?: boolean;
}) {
  return (
    <label className="cb-cm-field cb-hub-field" data-invalid={error ? true : undefined}>
      <span>{label}{counter ? <small>{value.length}/{max}</small> : null}</span>
      <div className="cb-hub-input">
        {prefix ? <em aria-hidden="true">{prefix}</em> : null}
        <input type={type} value={value} maxLength={max} placeholder={placeholder} required={required} autoComplete={autoComplete ?? "off"} inputMode={inputMode}
          onChange={(event) => onChange(event.target.value)} aria-invalid={error ? true : undefined} />
      </div>
      {error ? <p className="cb-hub-error">{error}</p> : hint ? <p className="cb-hub-hint">{hint}</p> : null}
    </label>
  );
}

export function TextArea({ label, value, onChange, max, placeholder, rows = 4, error, hint }: {
  label: string; value: string; onChange: (value: string) => void; max: number; placeholder?: string; rows?: number; error?: string; hint?: string;
}) {
  return (
    <label className="cb-cm-field cb-hub-field" data-invalid={error ? true : undefined}>
      <span>{label}<small>{value.length}/{max}</small></span>
      <textarea value={value} maxLength={max} placeholder={placeholder} rows={rows} onChange={(event) => onChange(event.target.value)} aria-invalid={error ? true : undefined} />
      {error ? <p className="cb-hub-error">{error}</p> : hint ? <p className="cb-hub-hint">{hint}</p> : null}
    </label>
  );
}

/** Checkbox drawn by CSS; the input stays in the accessibility tree. */
export function Check({ checked, onChange, children, disabled }: { checked: boolean; onChange: (checked: boolean) => void; children: React.ReactNode; disabled?: boolean }) {
  return (
    <label className="cb-hub-check" data-disabled={disabled ? true : undefined}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} />
      <span className="cb-hub-box" aria-hidden="true"><IconCheck size={13} stroke={3} /></span>
      <span>{children}</span>
    </label>
  );
}

export function Switch({ checked, onChange, label, hint, disabled }: { checked: boolean; onChange: (checked: boolean) => void; label: string; hint?: string; disabled?: boolean }) {
  const id = useId();
  return (
    <button type="button" role="switch" aria-checked={checked} aria-labelledby={`${id}-label`} aria-describedby={hint ? `${id}-hint` : undefined}
      className="cb-switch-row cb-hub-switch" disabled={disabled} onClick={() => onChange(!checked)}>
      <span><span id={`${id}-label`}>{label}</span>{hint ? <small id={`${id}-hint`}>{hint}</small> : null}</span>
      <span className="cb-switch" aria-hidden="true"><i /></span>
    </button>
  );
}

/** Button that opens the file chooser for one PDF. */
export function PdfButton({ label, busy, onFile, variant = "ink" }: { label: string; busy?: boolean; onFile: (file: File) => void; variant?: "ink" | "outline" }) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <input ref={inputRef} type="file" accept="application/pdf,.pdf" hidden onChange={(event) => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (file) onFile(file);
      }} />
      <button type="button" className={`cb-button cb-button-${variant} cb-button-sm`} disabled={busy} onClick={() => inputRef.current?.click()}>
        <IconUpload size={15} stroke={1.9} aria-hidden />
        {busy ? "Uploading…" : label}
      </button>
    </>
  );
}

export function Notice({ tone = "info", children }: { tone?: "info" | "warn" | "error" | "ok"; children: React.ReactNode }) {
  return <p className="cb-hub-notice" data-tone={tone} role={tone === "error" ? "alert" : "status"}>{children}</p>;
}
