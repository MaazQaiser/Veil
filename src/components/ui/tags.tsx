import { useState } from "react";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/controls";

/** Searchable multi-select. Suggestions come from the City's own vocabulary. */
export function TagField({
  id,
  label,
  hint,
  values,
  options,
  placeholder,
  onChange,
}: {
  id: string;
  label: string;
  hint?: string;
  values: string[];
  options: string[];
  placeholder?: string;
  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = useState("");
  const query = draft.trim().toLowerCase();
  const matches = options
    .filter((option) => !values.includes(option) && option.toLowerCase().includes(query))
    .slice(0, 6);

  function add(value: string) {
    const clean = value.trim();
    setDraft("");
    if (!clean || values.includes(clean)) return;
    onChange([...values, clean]);
  }

  return (
    <Field label={label} htmlFor={id} hint={hint}>
      <div className="flex flex-col gap-3">
        {values.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {values.map((value) => (
              <li key={value}>
                <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-body-sm">
                  {value}
                  <button
                    type="button"
                    aria-label={`Remove ${value}`}
                    className="text-muted hover:text-foreground"
                    onClick={() => onChange(values.filter((item) => item !== value))}
                  >
                    ×
                  </button>
                </span>
              </li>
            ))}
          </ul>
        ) : null}
        <Input
          id={id}
          value={draft}
          placeholder={placeholder}
          autoComplete="off"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === ",") {
              event.preventDefault();
              add(draft);
            }
          }}
        />
        {matches.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {matches.map((option) => (
              <li key={option}>
                <button
                  type="button"
                  className="rounded-full border border-border-subtle px-3 py-1.5 text-body-sm text-muted hover:border-border hover:text-foreground"
                  onClick={() => add(option)}
                >
                  + {option}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </Field>
  );
}

/** Shared between the profile form and the Vael form, which both store comma text. */
export function splitTags(value: string | string[]) {
  if (Array.isArray(value)) return value;
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
