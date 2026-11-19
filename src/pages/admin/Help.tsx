import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/choice";
import { Input, Select, Textarea } from "@/components/ui/controls";
import { Field } from "@/components/ui/field";
import { IconLink } from "@/components/ui/icons";
import { Dialog } from "@/components/ui/overlays";
import { cn } from "@/lib/cn";
import {
  HELP_DISTRICTS,
  HELP_KINDS,
  HELP_MAX_LINKS,
  HELP_PLACEMENTS,
  deleteHelpListing,
  getHelpListings,
  getPageSettings,
  saveHelpListing,
  setHelpStatus,
  type HelpKind,
  type HelpLink,
  type HelpListing,
  type HelpPlacement,
} from "@/lib/adminStore";
import { relativeTime } from "@/lib/time";
import { useAdmin } from "@/lib/useAdmin";
import { PageSettingsForm } from "./PageSettingsForm";
import { AdminPageHeader, EmptyPanel, Panel, StatusPill, TabBar } from "./parts";

type Draft = {
  id?: string;
  title: string;
  kind: HelpKind;
  summary: string;
  coverage: "nationwide" | "state";
  state: string;
  links: HelpLink[];
  placements: HelpPlacement[];
  districtIds: string[];
};

const BLANK: Draft = {
  title: "",
  kind: "Official resource",
  summary: "",
  coverage: "nationwide",
  state: "",
  links: [{ label: "", url: "" }],
  placements: ["district_help"],
  districtIds: ["construction"],
};

function toDraft(item: HelpListing): Draft {
  return {
    id: item.id,
    title: item.title,
    kind: item.kind,
    summary: item.summary,
    coverage: item.coverage,
    state: item.state,
    links: item.links.length > 0 ? item.links : [{ label: "", url: "" }],
    placements: item.placements,
    districtIds: item.districtIds,
  };
}

function toggle<T>(list: T[], value: T) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

export function AdminHelpPage() {
  useAdmin();
  const [tab, setTab] = useState<"listings" | "page">("listings");
  const [params] = useSearchParams();
  const [editing, setEditing] = useState<Draft | null>(params.get("new") === "1" ? { ...BLANK, links: [{ label: "", url: "" }] } : null);
  const [preview, setPreview] = useState<Draft | null>(null);
  const [removing, setRemoving] = useState<HelpListing | null>(null);
  const [error, setError] = useState("");
  const listings = getHelpListings();

  function save(status: "draft" | "published") {
    if (!editing) return;
    try {
      saveHelpListing(editing, status);
      setEditing(null);
      setError("");
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "Could not save this service.");
    }
  }

  function setLink(index: number, patch: Partial<HelpLink>) {
    if (!editing) return;
    setEditing({ ...editing, links: editing.links.map((link, i) => (i === index ? { ...link, ...patch } : link)) });
  }

  return (
    <>
      <AdminPageHeader
        title="Help and services"
        lede="Useful services and resources for members. Choose which districts see each one, and where it shows."
        action={
          tab === "listings" && !editing ? (
            <Button type="button" onClick={() => setEditing({ ...BLANK, links: [{ label: "", url: "" }] })}>
              New service
            </Button>
          ) : null
        }
      />
      <TabBar
        label="Help and services"
        value={tab}
        onChange={setTab}
        tabs={[
          { id: "listings", label: "Services", count: listings.length },
          { id: "page", label: "Page settings" },
        ]}
      />

      {tab === "page" ? (
        <PageSettingsForm page="help" label="Help and services" />
      ) : editing ? (
        <Panel title={editing.id ? "Edit service" : "New service"} bodyClassName="space-y-6">
          <Field label="Title" htmlFor="help-title" required>
            <Input id="help-title" value={editing.title} onChange={(event) => setEditing({ ...editing, title: event.target.value })} />
          </Field>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Field label="What kind is it?" htmlFor="help-kind">
              <Select id="help-kind" value={editing.kind} onChange={(event) => setEditing({ ...editing, kind: event.target.value as HelpKind })}>
                {HELP_KINDS.map((kind) => (
                  <option key={kind} value={kind}>
                    {kind}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Where does it apply?" htmlFor="help-coverage">
              <Select
                id="help-coverage"
                value={editing.coverage}
                onChange={(event) => setEditing({ ...editing, coverage: event.target.value as Draft["coverage"] })}
              >
                <option value="nationwide">Nationwide</option>
                <option value="state">One state only</option>
              </Select>
            </Field>
          </div>

          {editing.coverage === "state" ? (
            <Field label="State" htmlFor="help-state" hint="For example Florida, or FL.">
              <Input id="help-state" value={editing.state} onChange={(event) => setEditing({ ...editing, state: event.target.value })} />
            </Field>
          ) : null}

          <Field label="Description" htmlFor="help-summary" required hint="What it is and who it helps, in a sentence or two.">
            <Textarea id="help-summary" value={editing.summary} onChange={(event) => setEditing({ ...editing, summary: event.target.value })} className="min-h-[6rem]" />
          </Field>

          <fieldset className="space-y-3">
            <legend className="text-label font-medium text-foreground">
              Links <span className="font-normal text-muted">(optional, up to {HELP_MAX_LINKS})</span>
            </legend>
            {editing.links.map((link, index) => (
              <div key={index} className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)_auto]">
                <Input aria-label={`Link ${index + 1} name`} placeholder="Name" value={link.label} onChange={(event) => setLink(index, { label: event.target.value })} />
                <Input aria-label={`Link ${index + 1} address`} placeholder="https://" value={link.url} onChange={(event) => setLink(index, { url: event.target.value })} />
                <Button
                  type="button"
                  variant="ghost"
                  className="px-3"
                  aria-label={`Remove link ${index + 1}`}
                  onClick={() => setEditing({ ...editing, links: editing.links.filter((_, i) => i !== index) })}
                >
                  Remove
                </Button>
              </div>
            ))}
            {editing.links.length < HELP_MAX_LINKS ? (
              <Button type="button" variant="outline" size="sm" className="h-10" onClick={() => setEditing({ ...editing, links: [...editing.links, { label: "", url: "" }] })}>
                Add a link
              </Button>
            ) : null}
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="text-label font-medium text-foreground">Which districts see it?</legend>
            <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
              {HELP_DISTRICTS.map((district) => (
                <Checkbox
                  key={district.id}
                  label={district.name}
                  checked={editing.districtIds.includes(district.id)}
                  onChange={() => setEditing({ ...editing, districtIds: toggle(editing.districtIds, district.id) })}
                />
              ))}
            </div>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="text-label font-medium text-foreground">Where does it show?</legend>
            <div className="space-y-3">
              {HELP_PLACEMENTS.map((place) => (
                <Checkbox
                  key={place.id}
                  label={place.label}
                  checked={editing.placements.includes(place.id)}
                  onChange={() => setEditing({ ...editing, placements: toggle(editing.placements, place.id) })}
                />
              ))}
            </div>
          </fieldset>

          {error ? <p className="text-body-sm text-destructive">{error}</p> : null}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setEditing(null);
                setError("");
              }}
            >
              Cancel
            </Button>
            <div className="flex flex-wrap gap-3">
              <Button type="button" variant="outline" onClick={() => setPreview(editing)}>
                Preview
              </Button>
              <Button type="button" variant="outline" onClick={() => save("draft")}>
                Save draft
              </Button>
              <Button type="button" onClick={() => save("published")}>
                Publish
              </Button>
            </div>
          </div>
        </Panel>
      ) : listings.length === 0 ? (
        <EmptyPanel
          title="No services yet"
          body="Add a service or resource and choose where members see it."
          action={<Button type="button" onClick={() => setEditing({ ...BLANK, links: [{ label: "", url: "" }] })}>New service</Button>}
        />
      ) : (
        <ul className="space-y-3">
          {listings.map((item) => (
            <li key={item.id} className="rounded-2xl border border-border bg-surface p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1 basis-64">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-body font-semibold text-foreground">{item.title}</h3>
                    <StatusPill tone={item.status === "published" ? "done" : "muted"}>
                      {item.status === "published" ? "Published" : "Draft"}
                    </StatusPill>
                  </div>
                  <p className="mt-1 text-body-sm text-muted">{item.summary}</p>
                  <ListingTags item={item} />
                  {item.updatedAt ? <p className="mt-2 text-caption text-muted">Updated {relativeTime(item.updatedAt)}</p> : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" className="h-10" onClick={() => setEditing(toDraft(item))}>
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-10"
                    onClick={() => setHelpStatus(item.id, item.status === "published" ? "draft" : "published")}
                  >
                    {item.status === "published" ? "Unpublish" : "Publish"}
                  </Button>
                  <Button type="button" variant="destructive" size="sm" className="h-10" onClick={() => setRemoving(item)}>
                    Delete
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={Boolean(preview)} onClose={() => setPreview(null)} title="How members will see it">
        {preview ? (
          <div>
            <p className="text-body-sm text-muted">{getPageSettings().help.welcome}</p>
            <div className="mt-5 rounded-2xl border border-border bg-surface-muted/50 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-accent/15 px-2.5 py-1 text-caption font-medium text-accent">{preview.kind}</span>
                <span className="rounded-full border border-border px-2.5 py-1 text-caption text-muted">
                  {preview.coverage === "nationwide" ? "Nationwide" : preview.state.trim() || "One state"}
                </span>
              </div>
              <h3 className="mt-3 text-body-lg font-semibold text-foreground">{preview.title || "Untitled service"}</h3>
              <p className="mt-1.5 text-body-sm leading-6 text-foreground/90">{preview.summary || "No description yet."}</p>
              {preview.links.filter((link) => link.url.trim()).length > 0 ? (
                <ul className="mt-4 space-y-2">
                  {preview.links
                    .filter((link) => link.url.trim())
                    .map((link) => (
                      <li key={link.url} className="inline-flex items-center gap-2 text-body-sm font-medium text-accent">
                        <IconLink className="h-4 w-4" />
                        {link.label.trim() || link.url}
                      </li>
                    ))}
                </ul>
              ) : null}
            </div>
            <p className="mt-6 border-t border-border-subtle pt-4 text-caption text-muted">{getPageSettings().help.disclaimer}</p>
          </div>
        ) : null}
      </Dialog>

      <Dialog
        open={Boolean(removing)}
        onClose={() => setRemoving(null)}
        title="Delete this service?"
        footer={
          <>
            <Button type="button" variant="outline" size="sm" onClick={() => setRemoving(null)}>
              Keep it
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={() => {
                if (removing) deleteHelpListing(removing.id);
                setRemoving(null);
              }}
            >
              Delete service
            </Button>
          </>
        }
      >
        <p className="text-body-sm text-muted">&ldquo;{removing?.title}&rdquo; will be removed for everyone. You can unpublish it instead and keep the text.</p>
      </Dialog>
    </>
  );
}

function ListingTags({ item }: { item: HelpListing }) {
  const names = item.districtIds.map((id) => HELP_DISTRICTS.find((district) => district.id === id)?.name ?? id);
  const places = HELP_PLACEMENTS.filter((place) => item.placements.includes(place.id)).map((place) => (place.id === "district_help" ? "District help page" : "Handshake room"));
  const tags = [item.kind, item.coverage === "nationwide" ? "Nationwide" : item.state, ...names, ...places];
  return (
    <ul className="mt-3 flex flex-wrap gap-2">
      {tags.map((tag, index) => (
        <li
          key={`${tag}-${index}`}
          className={cn(
            "rounded-full border px-2.5 py-1 text-caption",
            index === 0 ? "border-accent/30 bg-accent/10 text-accent" : "border-border-subtle bg-surface-muted/60 text-muted",
          )}
        >
          {tag}
        </li>
      ))}
    </ul>
  );
}
