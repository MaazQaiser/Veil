import type { ReactNode } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/controls";
import { IconImage, IconUser } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { normalizePortfolio } from "@/lib/profileFields";
import type { PortfolioItem } from "@/lib/vaelStore";

export function readImageFile(file: File | undefined, onChange: (dataUrl: string) => void) {
  if (!file || !file.type.startsWith("image/")) return;
  const reader = new FileReader();
  reader.onload = () => onChange(String(reader.result));
  reader.readAsDataURL(file);
}

/** Icon button that opens an image file. The same picture is stored on the profile. */
export function ImageIconButton({
  id,
  label,
  onChange,
  children,
  className,
}: {
  id?: string;
  label: string;
  onChange: (dataUrl: string) => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label
      className={cn(
        "inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-black/10 bg-white text-[#0B0C0C] shadow-md hover:bg-[#F5F3EE]",
        className,
      )}
    >
      {children}
      <input
        id={id}
        type="file"
        accept="image/*"
        aria-label={label}
        className="sr-only"
        onChange={(event) => {
          readImageFile(event.target.files?.[0], onChange);
          event.currentTarget.value = "";
        }}
      />
    </label>
  );
}

export function ProfilePhotoField({
  name,
  src,
  coverSrc,
  onChange,
  onCoverChange,
}: {
  name: string;
  src?: string;
  coverSrc?: string;
  onChange: (dataUrl: string) => void;
  onCoverChange: (dataUrl: string) => void;
}) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 sm:items-start">
      <Field label="Profile photo" htmlFor="photo" hint="Recommended. Helps people recognise you after a Handshake.">
        <div className="flex items-center gap-4">
          <span className="relative inline-flex">
            <Avatar name={name} src={src} size="xl" />
            <ImageIconButton id="photo" label="Add profile photo" onChange={onChange} className="absolute -bottom-1 -right-1">
              <IconUser className="h-3.5 w-3.5" />
            </ImageIconButton>
          </span>
        </div>
      </Field>
      <Field label="Background picture" htmlFor="cover" hint="Shown behind your profile photo. The same picture on your profile.">
        <div className="relative h-24 overflow-hidden rounded-lg border border-border bg-surface-muted">
          {coverSrc ? (
            <img src={coverSrc} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full items-center justify-center gap-2 text-body-sm text-muted">
              <IconImage className="h-4 w-4" />
              Add a background
            </span>
          )}
          <ImageIconButton id="cover" label="Add background picture" onChange={onCoverChange} className="absolute bottom-2 right-2">
            <IconImage className="h-3.5 w-3.5" />
          </ImageIconButton>
        </div>
      </Field>
    </div>
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
