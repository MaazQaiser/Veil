import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/controls";
import { normalizePortfolio } from "@/lib/profileFields";
import type { PortfolioItem } from "@/lib/vaelStore";

export function ProfilePhotoField({
  name,
  src,
  onChange,
}: {
  name: string;
  src?: string;
  onChange: (dataUrl: string) => void;
}) {
  return (
    <Field label="Profile photo" htmlFor="photo" hint="Recommended. Helps people recognise you after a Handshake.">
      <div className="flex items-center gap-4">
        <Avatar name={name} src={src} size="xl" />
        <input
          id="photo"
          type="file"
          accept="image/*"
          aria-label="Add profile photo"
          className="block text-body-sm"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => onChange(String(reader.result));
            reader.readAsDataURL(file);
          }}
        />
      </div>
    </Field>
  );
}

export function PortfolioEditor({
  items,
  onChange,
}: {
  items: PortfolioItem[];
  onChange: (next: PortfolioItem[]) => void;
}) {
  const rows = items.length > 0 ? items : [{ label: "", url: "" }];

  function update(index: number, patch: Partial<PortfolioItem>) {
    onChange(rows.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  return (
    <div className="space-y-6">
      {rows.map((item, index) => (
        <div key={index} className="space-y-4 rounded-xl border border-border-subtle p-4">
          <Field label="Project or link label" htmlFor={`pl-${index}`}>
            <Input
              id={`pl-${index}`}
              value={item.label}
              placeholder="Selected work"
              onChange={(event) => update(index, { label: event.target.value })}
            />
          </Field>
          <Field label="URL" htmlFor={`pu-${index}`}>
            <Input
              id={`pu-${index}`}
              type="url"
              value={item.url}
              placeholder="https://"
              onChange={(event) => update(index, { url: event.target.value })}
            />
          </Field>
          <Field label="Description" htmlFor={`pn-${index}`} hint="Optional.">
            <Textarea
              id={`pn-${index}`}
              value={item.note ?? ""}
              onChange={(event) => update(index, { note: event.target.value })}
            />
          </Field>
          {rows.length > 1 ? (
            <Button type="button" variant="ghost" onClick={() => onChange(rows.filter((_, i) => i !== index))}>
              Remove
            </Button>
          ) : null}
        </div>
      ))}
      <Button type="button" variant="ghost" onClick={() => onChange([...normalizePortfolio(rows), { label: "", url: "" }])}>
        Add another project
      </Button>
    </div>
  );
}
