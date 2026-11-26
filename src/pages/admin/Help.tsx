import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Checkbox, Radio } from "@/components/ui/choice";
import { Input, Select, Textarea } from "@/components/ui/controls";
import { Field } from "@/components/ui/field";
import { IconEdit, IconLink, IconSettings, IconTrash } from "@/components/ui/icons";
import { Tooltip } from "@/components/ui/menu";
import { Dialog } from "@/components/ui/overlays";
import { cn } from "@/lib/cn";
import {
  HELP_CATEGORIES,
  HELP_DISTRICTS,
  HELP_KINDS,
  HELP_LIMITS,
  HELP_MAX_LINKS,
  HELP_PLACEMENTS,
  defaultReviewBy,
  deleteHelpListing,
  getHelpListings,
  helpExpiresAt,
  saveHelpListing,
  type HelpKind,
  type HelpLink,
  type HelpListing,
  type HelpPlacement,
  type PublishState,
} from "@/lib/adminStore";
import { formatDate } from "@/lib/time";
import { useAdmin } from "@/lib/useAdmin";
import { CARD } from "./gauges";
import { PageSettingsSheet } from "./PageSettingsForm";
import { AdminPageHeader, Detail, EmptyPanel, FilterSelect, StatusPill, TabBar } from "./parts";
import { SideSheet } from "./SideSheet";

type Draft = {
  id?: string;
  title: string;
  kind: HelpKind;
  summary: string;
  category: string;
  coverage: "nationwide" | "state";
  state: string;
  availability: string;
  links: HelpLink[];
  placements: HelpPlacement[];
  districtIds: string[];
  reviewBy: string;
  status: PublishState;
};

type Filter = "all" | PublishState;

const ALL_DISTRICTS = HELP_DISTRICTS.map((item) => item.id);

/** A fresh listing. The review date starts a year from today. */
const blank = (): Draft => ({
  title: "",
  kind: "Official resource",
  summary: "",
  category: HELP_CATEGORIES[0],
  coverage: "nationwide",
  state: "",
  availability: "",
  links: [],
  placements: ["district_help"],
  districtIds: ["construction"],
  reviewBy: defaultReviewBy(),
  status: "draft",
});

const STATE_LABEL: Record<PublishState, string> = { draft: "Draft", published: "Published" };

function toDraft(item: HelpListing): Draft {
  return {
    id: item.id,
    title: item.title,
    kind: item.kind,
    summary: item.summary,
    category: item.category || HELP_CATEGORIES[0],
    coverage: item.coverage,
    state: item.state,
    availability: item.availability,
    links: item.links,
    placements: item.placements,
    districtIds: item.districtIds,
    reviewBy: item.reviewBy,
    status: item.status,
  };
}

function toggle<T>(list: T[], value: T) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

/** "All districts", one name, or a count: short enough for a table cell. */
function districtTag(ids: string[]) {
  if (ids.length === ALL_DISTRICTS.length) return "All districts";
  if (ids.length === 1) return HELP_DISTRICTS.find((item) => item.id === ids[0])?.name ?? "1 district";
  return `${ids.length} districts`;
}

/** A published listing whose review day has passed. Members no longer see it until its facts are checked and the date moved. */
function isExpired(status: PublishState, reviewBy: string) {
  const at = status === "published" && reviewBy ? helpExpiresAt(reviewBy) : null;
  return at !== null && Date.now() >= at;
}

/** When a listing stops showing, in the viewer's own time: the end of its review day in UTC. */
function hiddenFrom(reviewBy: string) {
  const at = reviewBy ? helpExpiresAt(reviewBy) : null;
  return at === null
    ? ""
    : new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }).format(at);
}

/** The read-only card shown when a listing is opened: everything on the form, laid out to read. */
function ListingDetails({ draft, listing }: { draft: Draft; listing?: HelpListing }) {
  const districts =
    draft.districtIds.length === ALL_DISTRICTS.length
      ? "All districts"
      : draft.districtIds.map((id) => HELP_DISTRICTS.find((item) => item.id === id)?.name ?? id).join(", ") || "None chosen";
  const places = HELP_PLACEMENTS.filter((place) => draft.placements.includes(place.id)).map((place) => place.label);
  const links = draft.links.filter((link) => link.url.trim());
  const hidden = hiddenFrom(draft.reviewBy);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-accent/15 px-2.5 py-1 text-caption font-medium text-accent">{draft.kind}</span>
        {draft.category ? <span className="rounded-full border border-border px-2.5 py-1 text-caption text-muted">{draft.category}</span> : null}
        <span className="rounded-full border border-border px-2.5 py-1 text-caption text-muted">
          {draft.coverage === "nationwide" ? "Nationwide" : draft.state.trim() || "Particular states"}
        </span>
      </div>
      <dl className="space-y-5">
        <Detail label="What they offer">{draft.summary.trim() || "Not written yet."}</Detail>
        {draft.availability.trim() ? <Detail label="When they're available">{draft.availability}</Detail> : null}
        <Detail label="Districts">{districts}</Detail>
        <Detail label="Where it shows">
          {places.length > 0 ? (
            <ul className="space-y-1">
              {places.map((place) => (
                <li key={place}>{place}</li>
              ))}
            </ul>
          ) : (
            "Nowhere yet"
          )}
        </Detail>
        <Detail label="Review by">
          {draft.reviewBy ? `${draft.reviewBy}${hidden ? `. Hidden from ${hidden}, your time.` : ""}` : "No date, so it never stops showing."}
        </Detail>
        <Detail label="Changed">{listing?.updatedAt ? formatDate(listing.updatedAt) : "Not changed yet"}</Detail>
      </dl>
      {links.length > 0 ? (
        <div>
          <p className="text-caption font-medium uppercase tracking-wide text-muted">Links to their own site</p>
          <ul className="mt-2 space-y-2">
            {links.map((link) => (
              <li key={link.url} className="min-w-0 text-body-sm">
                <a href={link.url} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-2 font-medium text-accent hover:underline">
                  <IconLink className="h-4 w-4" />
                  {link.label.trim() || link.url}
                </a>
                <span className="block truncate text-caption text-muted">{link.url}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export function AdminHelpPage() {
  useAdmin();
  const [params] = useSearchParams();
  const [filter, setFilter] = useState<Filter>("all");
  const [district, setDistrict] = useState("all");
  // The listing in the side panel. It stays set while the panel slides out, so the panel does not go blank on the way.
  const [editing, setEditing] = useState<Draft | null>(params.get("new") === "1" ? blank() : null);
  const [sheetOpen, setSheetOpen] = useState(params.get("new") === "1");
  // What the panel looked like when the form opened, to tell whether anything was changed before it is closed.
  const [initial, setInitial] = useState("");
  // A listing first opens to read. Edit turns the same panel into the form.
  const [mode, setMode] = useState<"view" | "edit">(params.get("new") === "1" ? "edit" : "view");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [removing, setRemoving] = useState<HelpListing | null>(null);
  const [error, setError] = useState("");
  const listings = getHelpListings();
  // The district filter narrows the tabs and their counts too, so what the tab says is what the table shows.
  const inDistrict = listings.filter((item) => district === "all" || item.districtIds.includes(district));
  const count = (state: PublishState) => inDistrict.filter((item) => item.status === state).length;
  const shown = inDistrict.filter((item) => filter === "all" || item.status === filter);

  function openListing(draft: Draft, how: "view" | "edit" = "view") {
    setEditing(draft);
    setInitial(JSON.stringify(draft));
    setMode(how);
    setError("");
    setSheetOpen(true);
  }

  function leave() {
    setSheetOpen(false);
    setError("");
  }

  function save(status: PublishState) {
    if (!editing) return;
    try {
      saveHelpListing(editing, status);
      leave();
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "Could not save this listing.");
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
          <div className="flex items-end gap-3">
            <FilterSelect label="District" value={district} onChange={setDistrict}>
              <option value="all">All districts</option>
              {HELP_DISTRICTS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </FilterSelect>
            <Tooltip label="Page settings" align="left">
              <button
                type="button"
                aria-label="Page settings"
                onClick={() => setSettingsOpen(true)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border text-muted motion-safe:transition-colors hover:bg-surface-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
              >
                <IconSettings className="h-[18px] w-[18px]" />
              </button>
            </Tooltip>
          </div>
        }
      />

      <section className="space-y-5">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-h4 font-semibold text-foreground">Listings</h2>
            <p className="mt-1 text-body-sm text-muted">Here is an overview of the listings members can find under Help and services.</p>
          </div>
          <Button type="button" onClick={() => openListing(blank(), "edit")}>
            + New listing
          </Button>
        </header>

        <TabBar
          label="Listings"
          value={filter}
          onChange={setFilter}
          tabs={[
            { id: "all", label: "All", count: inDistrict.length },
            { id: "draft", label: "Draft", count: count("draft") },
            { id: "published", label: "Published", count: count("published") },
          ]}
        />

        {listings.length === 0 ? (
          <EmptyPanel
            title="No listings yet"
            body="Add a listing and choose where members see it."
            action={
              <Button type="button" onClick={() => openListing(blank(), "edit")}>
                New listing
              </Button>
            }
          />
        ) : shown.length === 0 ? (
          <p className="py-6 text-center text-body-sm text-muted">
            No {filter === "all" ? "" : `${filter} `}listings{district === "all" ? "" : " in this district"}.
          </p>
        ) : (
          <section className={cn(CARD, "overflow-hidden")}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[46rem] text-left text-body-sm">
                <thead>
                  <tr className="border-b border-border-subtle bg-surface-muted/30 text-caption uppercase tracking-wide text-muted">
                    <th className="px-5 py-3 font-medium">Listing</th>
                    <th className="px-3 py-3 font-medium">Category</th>
                    <th className="px-3 py-3 font-medium">Districts</th>
                    <th className="px-3 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Changed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {shown.map((item) => (
                    <tr
                      key={item.id}
                      tabIndex={0}
                      onClick={() => openListing(toDraft(item))}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          openListing(toDraft(item));
                        }
                      }}
                      aria-label={`Open the listing ${item.title}`}
                      className="cursor-pointer motion-safe:transition-colors hover:bg-surface-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent/70"
                    >
                      <td className="max-w-[22rem] px-5 py-3.5">
                        <span className="block truncate font-medium text-foreground">{item.title}</span>
                        {item.summary ? <span className="block truncate text-caption text-muted">{item.summary}</span> : null}
                      </td>
                      <td className="max-w-[14rem] truncate px-3 py-3.5 text-muted">{item.category || "—"}</td>
                      <td className="whitespace-nowrap px-3 py-3.5 text-muted">{districtTag(item.districtIds)}</td>
                      <td className="px-3 py-3.5">
                        {isExpired(item.status, item.reviewBy) ? (
                          <StatusPill tone="warn">Needs review</StatusPill>
                        ) : (
                          <StatusPill tone={item.status === "published" ? "done" : "muted"}>{STATE_LABEL[item.status]}</StatusPill>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-muted">{item.updatedAt ? formatDate(item.updatedAt) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </section>

      <PageSettingsSheet
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        page="help"
        titleField
        disclaimerWhere="above every listing"
        disclaimerHint="For example: “Listing a provider here is not an endorsement.” It can’t be removed while a listing is published. Use the approved wording."
      />

      <SideSheet
        open={sheetOpen}
        dirty={mode === "edit" && Boolean(editing) && JSON.stringify(editing) !== initial}
        // Escape closes the delete question on top first, not the panel under it.
        onClose={() => {
          if (!removing) leave();
        }}
        title={mode === "view" ? (editing?.title ?? "") : editing?.title.trim() || "New listing"}
        headerAction={
          mode === "view" && editing?.id ? (
            <>
              <Tooltip label="Delete">
                <button
                  type="button"
                  aria-label="Delete this listing"
                  onClick={() => setRemoving(listings.find((item) => item.id === editing.id) ?? null)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted hover:border-destructive/50 hover:bg-destructive-muted hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
                >
                  <IconTrash className="h-4 w-4" />
                </button>
              </Tooltip>
              <Tooltip label="Edit">
                <button
                  type="button"
                  aria-label="Edit this listing"
                  onClick={() => {
                    setInitial(JSON.stringify(editing));
                    setMode("edit");
                  }}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
                >
                  <IconEdit className="h-4 w-4" />
                </button>
              </Tooltip>
            </>
          ) : undefined
        }
        badge={
          editing?.id ? (
            isExpired(editing.status, editing.reviewBy) ? (
              <StatusPill tone="warn">Needs review</StatusPill>
            ) : (
              <StatusPill tone={editing.status === "published" ? "done" : "muted"}>{STATE_LABEL[editing.status]}</StatusPill>
            )
          ) : undefined
        }
        footer={
          editing && mode === "edit" ? (
            editing.status === "published" ? (
              <>
                <Button type="button" variant="outline" disabled={!editing.title.trim()} onClick={() => save("draft")}>
                  Unpublish
                </Button>
                <Button type="button" disabled={!editing.title.trim()} onClick={() => save("published")}>
                  Save
                </Button>
              </>
            ) : (
              <>
                {/* Publish is the main action for a listing that is not live yet; Save keeps it a draft. */}
                <Button type="button" variant="ghost" disabled={!editing.title.trim()} onClick={() => save("draft")}>
                  Save
                </Button>
                <Button
                  type="button"
                  disabled={!editing.title.trim() || !editing.summary.trim() || editing.districtIds.length === 0 || editing.placements.length === 0}
                  onClick={() => save("published")}
                >
                  Publish
                </Button>
              </>
            )
          ) : undefined
        }
      >
        {editing && mode === "view" ? (
          <ListingDetails draft={editing} listing={listings.find((item) => item.id === editing.id)} />
        ) : editing ? (
          <div className="space-y-6">
            {editing.id ? (
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:bg-destructive-muted"
                  onClick={() => setRemoving(listings.find((item) => item.id === editing.id) ?? null)}
                >
                  Delete
                </Button>
              </div>
            ) : null}

            <div className="space-y-6">
              <Field label="Kind" htmlFor="help-kind">
                <Select id="help-kind" value={editing.kind} onChange={(event) => setEditing({ ...editing, kind: event.target.value as HelpKind })}>
                  {HELP_KINDS.map((kind) => (
                    <option key={kind} value={kind}>
                      {kind}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Category" htmlFor="help-category">
                <Select id="help-category" value={editing.category} onChange={(event) => setEditing({ ...editing, category: event.target.value })}>
                  {HELP_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <Field
              label="Name"
              htmlFor="help-title"
              required
              hint={
                <span className="tabular-nums">
                  {editing.title.length} / {HELP_LIMITS.title}
                </span>
              }
            >
              <Input
                id="help-title"
                value={editing.title}
                maxLength={HELP_LIMITS.title}
                placeholder="Acme Contractor Insurance"
                onChange={(event) => setEditing({ ...editing, title: event.target.value })}
              />
            </Field>

            <Field
              label="What they offer"
              htmlFor="help-summary"
              required
              hint={
                <>
                  Their facts, in plain words; never a recommendation.{" "}
                  <span className="tabular-nums">
                    {editing.summary.length} / {HELP_LIMITS.summary}
                  </span>
                </>
              }
            >
              <Textarea
                id="help-summary"
                value={editing.summary}
                maxLength={HELP_LIMITS.summary}
                placeholder="General liability and workers' comp for residential contractors"
                onChange={(event) => setEditing({ ...editing, summary: event.target.value })}
                className="min-h-[6rem]"
              />
            </Field>

            <fieldset className="space-y-3">
              <legend className="text-label font-medium text-foreground">Where they serve</legend>
              <div className="flex flex-wrap gap-6">
                <Radio
                  label="Nationwide"
                  name="help-coverage"
                  checked={editing.coverage === "nationwide"}
                  onChange={() => setEditing({ ...editing, coverage: "nationwide" })}
                />
                <Radio
                  label="Particular states"
                  name="help-coverage"
                  checked={editing.coverage === "state"}
                  onChange={() => setEditing({ ...editing, coverage: "state" })}
                />
              </div>
              {editing.coverage === "state" ? (
                <Field label="States" htmlFor="help-state" hint="For example Florida, or FL. Separate several with commas.">
                  <Input id="help-state" value={editing.state} onChange={(event) => setEditing({ ...editing, state: event.target.value })} />
                </Field>
              ) : null}
            </fieldset>

            <Field
              label="When they're available"
              htmlFor="help-availability"
              hint={
                <span className="tabular-nums">
                  {editing.availability.length} / {HELP_LIMITS.availability}
                </span>
              }
            >
              <Input
                id="help-availability"
                value={editing.availability}
                maxLength={HELP_LIMITS.availability}
                placeholder="Mon to Fri, 8 am to 6 pm Eastern"
                onChange={(event) => setEditing({ ...editing, availability: event.target.value })}
              />
            </Field>

            <fieldset className="space-y-3">
              <legend className="text-label font-medium text-foreground">
                Links to their own site <span className="font-normal text-muted">(https only, up to {HELP_MAX_LINKS})</span>
              </legend>
              {editing.links.map((link, index) => (
                <div key={index} className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)_auto]">
                  <Input
                    aria-label={`Link ${index + 1} name`}
                    placeholder="Name"
                    value={link.label}
                    onChange={(event) => setLink(index, { label: event.target.value })}
                  />
                  <Input
                    aria-label={`Link ${index + 1} address`}
                    placeholder="https://"
                    value={link.url}
                    onChange={(event) => setLink(index, { url: event.target.value })}
                  />
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
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-10"
                  onClick={() => setEditing({ ...editing, links: [...editing.links, { label: "", url: "" }] })}
                >
                  + Add a link
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
              <legend className="text-label font-medium text-foreground">Where it shows</legend>
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

            <Field
              label="Review by"
              htmlFor="help-review"
              hint={
                <>
                  Check the facts again by then. Shown through this day in UTC.
                  {hiddenFrom(editing.reviewBy) ? ` Hidden from ${hiddenFrom(editing.reviewBy)}, your time.` : " With no date, it never stops showing."}
                </>
              }
            >
              <Input id="help-review" type="date" value={editing.reviewBy} onChange={(event) => setEditing({ ...editing, reviewBy: event.target.value })} />
            </Field>

            {!editing.title.trim() ? (
              <p className="text-body-sm text-destructive">To save, add a name.</p>
            ) : editing.status !== "published" && !editing.summary.trim() ? (
              <p className="text-body-sm text-muted">To publish, say what they offer.</p>
            ) : editing.status !== "published" && editing.districtIds.length === 0 ? (
              <p className="text-body-sm text-muted">To publish, choose at least one district.</p>
            ) : editing.status !== "published" && editing.placements.length === 0 ? (
              <p className="text-body-sm text-muted">To publish, choose where it shows.</p>
            ) : null}
            {error ? <p className="text-body-sm text-destructive">{error}</p> : null}
          </div>
        ) : null}
      </SideSheet>

      <Dialog
        open={Boolean(removing)}
        onClose={() => setRemoving(null)}
        title="Delete this listing?"
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
                leave();
              }}
            >
              Delete listing
            </Button>
          </>
        }
      >
        <p className="text-body-sm text-muted">&ldquo;{removing?.title}&rdquo; will be removed for everyone. You can unpublish it instead and keep the text.</p>
      </Dialog>
    </>
  );
}
