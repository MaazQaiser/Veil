import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/choice";
import { Field } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/controls";
import { IconArchive, IconEdit, IconSettings, IconTrash } from "@/components/ui/icons";
import { Tooltip } from "@/components/ui/menu";
import { Dialog } from "@/components/ui/overlays";
import { cn } from "@/lib/cn";
import {
  GUIDE_LIMITS,
  GUIDE_TOPICS,
  deleteGuide,
  HELP_DISTRICTS,
  getGuides,
  saveGuide,
  setGuideStatus,
  type Guide,
  type GuideSource,
  type GuideState,
} from "@/lib/adminStore";
import { formatDate } from "@/lib/time";
import { useAdmin } from "@/lib/useAdmin";
import { CARD } from "./gauges";
import { PageSettingsSheet } from "./PageSettingsForm";
import { AdminPageHeader, Detail, EmptyPanel, StatusPill, TabBar } from "./parts";
import { SideSheet } from "./SideSheet";

type Draft = {
  id?: string;
  title: string;
  summary: string;
  body: string;
  districtIds: string[];
  sources: GuideSource[];
  topic: string;
  /** Two letters, or empty. */
  state: string;
  /** Kept as typed, turned into a number on save. */
  order: string;
  status: GuideState;
};
type Filter = "all" | GuideState;

const ALL_DISTRICTS = HELP_DISTRICTS.map((item) => item.id);
const BLANK: Draft = {
  title: "",
  summary: "",
  body: "",
  districtIds: ALL_DISTRICTS,
  sources: [],
  topic: GUIDE_TOPICS[0],
  state: "",
  order: "0",
  status: "draft",
};

const STATE_LABEL: Record<GuideState, string> = {
  draft: "Draft",
  published: "Published",
  archived: "Archived",
};
const STATE_TONE: Record<GuideState, "done" | "muted" | "warn"> = {
  draft: "muted",
  published: "done",
  archived: "warn",
};

/** "All districts", one name, or a count: short enough for a line of detail. */
function districtTag(ids: string[]) {
  if (ids.length === ALL_DISTRICTS.length) return "All districts";
  if (ids.length === 1) return HELP_DISTRICTS.find((item) => item.id === ids[0])?.name ?? "1 district";
  return `${ids.length} districts`;
}

function toDraft(guide: Guide): Draft {
  return {
    id: guide.id,
    title: guide.title,
    summary: guide.summary,
    body: guide.body,
    districtIds: guide.districtIds,
    sources: guide.sources,
    topic: guide.topic || GUIDE_TOPICS[0],
    state: guide.state,
    order: String(guide.order),
    status: guide.status,
  };
}

/** What the store needs from the form: the order as a real number. */
function payload(draft: Draft) {
  return { ...draft, order: draft.order.trim() === "" ? 0 : Number(draft.order) };
}

/** Plain text with a little structure: "## " starts a subheading, "- " a bullet, "1. " a numbered step, and a blank line a new paragraph. */
function GuideBody({ text }: { text: string }) {
  type Node = { kind: "h"; text: string } | { kind: "p"; text: string } | { kind: "ul"; items: string[] } | { kind: "ol"; items: string[] };
  const nodes: Node[] = [];
  for (const line of text.trim().split("\n")) {
    const last = nodes[nodes.length - 1];
    if (!line.trim()) {
      nodes.push({ kind: "p", text: "" });
    } else if (line.startsWith("## ")) {
      nodes.push({ kind: "h", text: line.slice(3).trim() });
    } else if (line.startsWith("- ")) {
      if (last && last.kind === "ul") last.items.push(line.slice(2));
      else nodes.push({ kind: "ul", items: [line.slice(2)] });
    } else if (/^\d+\.\s/.test(line)) {
      const item = line.replace(/^\d+\.\s/, "");
      if (last && last.kind === "ol") last.items.push(item);
      else nodes.push({ kind: "ol", items: [item] });
    } else if (last && last.kind === "p" && last.text) {
      last.text += `\n${line}`;
    } else {
      nodes.push({ kind: "p", text: line });
    }
  }
  return (
    <div className="space-y-3 text-body-sm leading-6 text-foreground/90">
      {nodes
        .filter((node) => node.kind !== "p" || node.text)
        .map((node, index) =>
          node.kind === "h" ? (
            <h4 key={index} className="pt-1 text-body font-semibold text-foreground">
              {node.text}
            </h4>
          ) : node.kind === "p" ? (
            <p key={index} className="whitespace-pre-line">
              {node.text}
            </p>
          ) : node.kind === "ul" ? (
            <ul key={index} className="list-disc space-y-1 pl-5">
              {node.items.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          ) : (
            <ol key={index} className="list-decimal space-y-1 pl-5">
              {node.items.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ol>
          ),
        )}
    </div>
  );
}

/** The read-only card shown when a guide is opened: everything on the form, laid out to read. */
function GuideDetails({ draft, guide }: { draft: Draft; guide?: Guide }) {
  const districts =
    draft.districtIds.length === ALL_DISTRICTS.length
      ? "All districts"
      : draft.districtIds.map((id) => HELP_DISTRICTS.find((item) => item.id === id)?.name ?? id).join(", ") || "None chosen";
  const sources = draft.sources.filter((source) => source.url.trim());
  return (
    <div className="space-y-6">
      <dl className="grid grid-cols-2 gap-x-4 gap-y-5">
        <Detail label="Topic">
          {draft.topic || "—"}
          {draft.state ? ` · ${draft.state}` : ""}
        </Detail>
        <Detail label="Order">{draft.order}</Detail>
        <Detail label="Changed">{guide?.updatedAt ? formatDate(guide.updatedAt) : "Not changed yet"}</Detail>
        <Detail label="Districts">{districts}</Detail>
      </dl>
      {draft.summary.trim() ? (
        <dl>
          <Detail label="Summary">{draft.summary}</Detail>
        </dl>
      ) : null}
      <div>
        <p className="text-caption font-medium uppercase tracking-wide text-muted">The guide</p>
        <div className="mt-2 rounded-xl border border-border-subtle bg-surface-muted/40 p-4">
          {draft.body.trim() ? <GuideBody text={draft.body} /> : <p className="text-body-sm text-muted">Nothing written yet.</p>}
        </div>
      </div>
      {sources.length > 0 ? (
        <div>
          <p className="text-caption font-medium uppercase tracking-wide text-muted">Official sources</p>
          <ul className="mt-2 space-y-2">
            {sources.map((source) => (
              <li key={source.url} className="min-w-0 text-body-sm">
                <a href={source.url} target="_blank" rel="noreferrer noopener" className="font-medium text-accent hover:underline">
                  {source.label.trim() || source.url}
                </a>
                <span className="block truncate text-caption text-muted">{source.url}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export function AdminResourcesPage() {
  useAdmin();
  const [params] = useSearchParams();
  const [filter, setFilter] = useState<Filter>("all");
  // The guide in the side panel. It stays set while the panel slides out, so the panel does not go blank on the way.
  const [editing, setEditing] = useState<Draft | null>(params.get("new") === "1" ? { ...BLANK } : null);
  const [sheetOpen, setSheetOpen] = useState(params.get("new") === "1");
  // A guide first opens to read. Edit turns the same panel into the form.
  const [mode, setMode] = useState<"view" | "edit">(params.get("new") === "1" ? "edit" : "view");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [error, setError] = useState("");
  // What the panel looked like when it opened, to tell whether anything was changed before it is closed.
  const [initial, setInitial] = useState("");
  const [discarding, setDiscarding] = useState(false);
  const [removing, setRemoving] = useState<Guide | null>(null);
  const guides = getGuides();
  const count = (state: GuideState) => guides.filter((item) => item.status === state).length;
  const shown = guides.filter((item) => filter === "all" || item.status === filter);

  function openGuide(draft: Draft, how: "view" | "edit" = "view") {
    setEditing(draft);
    setMode(how);
    setInitial(JSON.stringify(draft));
    setError("");
    setSheetOpen(true);
  }

  const dirty = mode === "edit" && Boolean(editing) && JSON.stringify(editing) !== initial;

  /** Archives a guide straight from the table, or brings an archived one back as a draft. */
  function archiveRow(guide: Guide) {
    setGuideStatus(guide.id, guide.status === "archived" ? "draft" : "archived");
  }

  /** Archives the guide that is open to read, or brings an archived one back, without opening the form. */
  function archiveOpened() {
    if (!editing?.id) return;
    run(() => setGuideStatus(editing.id as string, editing.status === "archived" ? "draft" : "archived"));
  }

  function startEdit() {
    setInitial(JSON.stringify(editing));
    setMode("edit");
  }

  /** Closing with changes asks first, so a long guide is never lost to a stray click. */
  function tryClose() {
    if (discarding || removing) return;
    if (dirty) setDiscarding(true);
    else leave();
  }

  function leave() {
    setSheetOpen(false);
    setError("");
  }

  /** Runs a change to the guide being edited, and goes back to the list when it works. */
  function run(change: () => void, stay = false) {
    try {
      change();
      if (!stay) leave();
      else setError("");
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "Could not save this guide.");
    }
  }

  function save(status: GuideState) {
    if (!editing) return;
    run(() => saveGuide(payload(editing), status));
  }

  function changeStatus(status: GuideState) {
    if (!editing?.id) return;
    const id = editing.id;
    run(() => {
      // Saves what is on screen first, so nothing typed is lost, then moves the guide.
      saveGuide(payload(editing), editing.status);
      setGuideStatus(id, status);
    });
  }

  function setSource(index: number, patch: Partial<GuideSource>) {
    if (!editing) return;
    setEditing({
      ...editing,
      sources: editing.sources.map((source, i) => (i === index ? { ...source, ...patch } : source)),
    });
  }

  return (
    <>
      <AdminPageHeader
        title="Resources"
        lede="Guides members can read on Vael. Choose which districts each guide appears in, from one district to all of them."
        action={
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
        }
      />

      <section className="space-y-5">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-h4 font-semibold text-foreground">Guides</h2>
            <p className="mt-1 text-body-sm text-muted">Here is an overview of the guides members can read on Vael.</p>
          </div>
          <Button type="button" onClick={() => openGuide({ ...BLANK }, "edit")}>
            + New guide
          </Button>
        </header>

        <TabBar
          label="Guides"
          value={filter}
          onChange={setFilter}
          tabs={[
            { id: "all", label: "All", count: guides.length },
            { id: "draft", label: "Draft", count: count("draft") },
            { id: "published", label: "Published", count: count("published") },
            { id: "archived", label: "Archived", count: count("archived") },
          ]}
        />

        {guides.length === 0 ? (
          <EmptyPanel
            title="No guides yet"
            body="Write a guide and publish it. It shows up for members in the districts you choose straight away."
            action={
              <Button type="button" onClick={() => openGuide({ ...BLANK }, "edit")}>
                New guide
              </Button>
            }
          />
        ) : shown.length === 0 ? (
          <p className="py-6 text-center text-body-sm text-muted">No {filter} guides.</p>
        ) : (
          <section className={cn(CARD, "overflow-hidden")}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[44rem] text-left text-body-sm">
                <thead>
                  <tr className="border-b border-border-subtle bg-surface-muted/30 text-caption uppercase tracking-wide text-muted">
                    <th className="px-5 py-3 font-medium">Guide</th>
                    <th className="px-3 py-3 font-medium">Topic</th>
                    <th className="px-3 py-3 font-medium">Districts</th>
                    <th className="px-3 py-3 font-medium">Status</th>
                    <th className="px-3 py-3 font-medium">Changed</th>
                    <th className="px-5 py-3 text-right font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {shown.map((guide) => (
                    <tr
                      key={guide.id}
                      tabIndex={0}
                      onClick={() => openGuide(toDraft(guide))}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          openGuide(toDraft(guide));
                        }
                      }}
                      aria-label={`Open the guide ${guide.title}`}
                      className="cursor-pointer motion-safe:transition-colors hover:bg-surface-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent/70"
                    >
                      <td className="max-w-[22rem] px-5 py-3.5">
                        <span className="block truncate font-medium text-foreground">{guide.title}</span>
                        {guide.summary ? <span className="block truncate text-caption text-muted">{guide.summary}</span> : null}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3.5 text-muted">
                        {guide.topic || "—"}
                        {guide.state ? ` · ${guide.state}` : ""}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3.5 text-muted">{districtTag(guide.districtIds)}</td>
                      <td className="px-3 py-3.5">
                        <StatusPill tone={STATE_TONE[guide.status]}>{STATE_LABEL[guide.status]}</StatusPill>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3.5 text-muted">{guide.updatedAt ? formatDate(guide.updatedAt) : "—"}</td>
                      <td className="px-5 py-3.5">
                        <span className="flex items-center justify-end gap-2">
                          <Tooltip label={guide.status === "archived" ? "Unarchive" : "Archive"}>
                            <button
                              type="button"
                              aria-label={`${guide.status === "archived" ? "Unarchive" : "Archive"} ${guide.title}`}
                              onClick={(event) => {
                                event.stopPropagation();
                                archiveRow(guide);
                              }}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted motion-safe:transition-colors hover:border-foreground/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
                            >
                              <IconArchive className="h-[18px] w-[18px]" />
                            </button>
                          </Tooltip>
                          <Tooltip label="Delete" align="left">
                            <button
                              type="button"
                              aria-label={`Delete ${guide.title}`}
                              onClick={(event) => {
                                event.stopPropagation();
                                setRemoving(guide);
                              }}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted motion-safe:transition-colors hover:border-destructive/50 hover:bg-destructive-muted hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
                            >
                              <IconTrash className="h-[18px] w-[18px]" />
                            </button>
                          </Tooltip>
                        </span>
                      </td>
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
        page="resources"
        disclaimerWhere="at the top of every guide"
        welcomeWhere="at the top of the Resources page, above the guides"
        audienceLabel="Who can read the guides"
      />

      <SideSheet
        open={sheetOpen}
        // Escape closes a question on top first, not the panel under it.
        onClose={tryClose}
        title={mode === "view" ? (editing?.title ?? "") : editing?.title.trim() || "New guide"}
        headerAction={
          mode === "view" && editing?.id ? (
            <>
              <Tooltip label="Delete">
                <button
                  type="button"
                  aria-label="Delete this guide"
                  onClick={() => setRemoving(guides.find((item) => item.id === editing.id) ?? null)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted hover:border-destructive/50 hover:bg-destructive-muted hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
                >
                  <IconTrash className="h-4 w-4" />
                </button>
              </Tooltip>
              <Tooltip label={editing.status === "archived" ? "Unarchive" : "Archive"}>
                <button
                  type="button"
                  aria-label={editing.status === "archived" ? "Unarchive this guide" : "Archive this guide"}
                  onClick={archiveOpened}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
                >
                  <IconArchive className="h-4 w-4" />
                </button>
              </Tooltip>
              <Tooltip label="Edit">
                <button
                  type="button"
                  aria-label="Edit this guide"
                  onClick={startEdit}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
                >
                  <IconEdit className="h-4 w-4" />
                </button>
              </Tooltip>
            </>
          ) : undefined
        }
        badge={editing?.id ? <StatusPill tone={STATE_TONE[editing.status]}>{STATE_LABEL[editing.status]}</StatusPill> : undefined}
        footer={
          editing && mode === "edit" ? (
            <>
              {/* The main action is the one that moves the guide forward: Publish for something unpublished, Save once it is live. Save elsewhere keeps the guide in the state it is in. */}
              {editing.id && editing.status !== "archived" ? (
                <Button type="button" variant="ghost" onClick={() => changeStatus("archived")}>
                  Archive
                </Button>
              ) : null}
              {editing.status === "published" ? (
                <>
                  <Button type="button" variant="outline" onClick={() => changeStatus("draft")}>
                    Unpublish
                  </Button>
                  <Button type="button" disabled={!editing.title.trim()} onClick={() => save("published")}>
                    Save
                  </Button>
                </>
              ) : editing.status === "archived" ? (
                <>
                  <Button type="button" variant="ghost" disabled={!editing.title.trim()} onClick={() => save("archived")}>
                    Save
                  </Button>
                  <Button type="button" onClick={() => changeStatus("draft")}>
                    Unarchive
                  </Button>
                </>
              ) : (
                <>
                  <Button type="button" variant="ghost" disabled={!editing.title.trim()} onClick={() => save("draft")}>
                    Save
                  </Button>
                  <Button
                    type="button"
                    disabled={!editing.title.trim() || !editing.body.trim() || editing.districtIds.length === 0}
                    onClick={() => (editing.id ? changeStatus("published") : save("published"))}
                  >
                    Publish
                  </Button>
                </>
              )}
            </>
          ) : undefined
        }
      >
        {editing && mode === "view" ? (
          <GuideDetails draft={editing} guide={guides.find((item) => item.id === editing.id)} />
        ) : editing ? (
          <div className="space-y-6">
            <Field label="Topic" htmlFor="guide-topic">
              <Select id="guide-topic" value={editing.topic} onChange={(event) => setEditing({ ...editing, topic: event.target.value })}>
                {GUIDE_TOPICS.map((topic) => (
                  <option key={topic} value={topic}>
                    {topic}
                  </option>
                ))}
              </Select>
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="State" htmlFor="guide-state" hint="Optional. Two letters, for a guide about one state.">
                <Input
                  id="guide-state"
                  value={editing.state}
                  maxLength={2}
                  placeholder="FL"
                  autoComplete="off"
                  onChange={(event) => setEditing({ ...editing, state: event.target.value.toUpperCase().replace(/[^A-Z]/g, "") })}
                />
              </Field>
              <Field label="Order" htmlFor="guide-order" hint="Lower numbers show first.">
                <Input
                  id="guide-order"
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  value={editing.order}
                  onChange={(event) => setEditing({ ...editing, order: event.target.value })}
                />
              </Field>
            </div>

            <Field
              label="Title"
              htmlFor="guide-title"
              required
              hint={
                <span className="tabular-nums">
                  {editing.title.length} / {GUIDE_LIMITS.title}
                </span>
              }
            >
              <Input
                id="guide-title"
                value={editing.title}
                maxLength={GUIDE_LIMITS.title}
                onChange={(event) => setEditing({ ...editing, title: event.target.value })}
              />
            </Field>

            <Field
              label="Summary (shown in the list of guides)"
              htmlFor="guide-summary"
              hint={
                <span className="tabular-nums">
                  {editing.summary.length} / {GUIDE_LIMITS.summary}
                </span>
              }
            >
              <Textarea
                id="guide-summary"
                value={editing.summary}
                maxLength={GUIDE_LIMITS.summary}
                onChange={(event) => setEditing({ ...editing, summary: event.target.value })}
                className="min-h-[5rem]"
              />
            </Field>

            <Field
              label="The guide"
              htmlFor="guide-body"
              required
              hint={
                <>
                  Plain text. A line starting &ldquo;## &rdquo; is a subheading, &ldquo;- &rdquo; a bullet, &ldquo;1. &rdquo; a numbered step; a blank line
                  starts a new paragraph.{" "}
                  <span className="tabular-nums">
                    {editing.body.length} / {GUIDE_LIMITS.body}
                  </span>
                </>
              }
            >
              <Textarea
                id="guide-body"
                value={editing.body}
                maxLength={GUIDE_LIMITS.body}
                onChange={(event) => setEditing({ ...editing, body: event.target.value })}
                className="min-h-[18rem]"
              />
            </Field>

            <fieldset className="space-y-3">
              <legend className="text-label font-medium text-foreground">
                Official sources <span className="font-normal text-muted">(https only, up to {GUIDE_LIMITS.sources})</span>
              </legend>
              {editing.sources.length > 0 ? (
                <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)_2.5rem] gap-2 text-caption text-muted">
                  <span>Label</span>
                  <span>Address</span>
                  <span />
                </div>
              ) : null}
              {editing.sources.map((source, index) => (
                <div key={index} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)_2.5rem] items-center gap-2">
                  <Input
                    aria-label={`Source ${index + 1} label`}
                    placeholder="Florida Statutes §713"
                    value={source.label}
                    onChange={(event) => setSource(index, { label: event.target.value })}
                  />
                  <Input
                    aria-label={`Source ${index + 1} address`}
                    placeholder="https://www.leg.state.fl.us/statutes/"
                    value={source.url}
                    onChange={(event) => setSource(index, { url: event.target.value })}
                  />
                  <button
                    type="button"
                    aria-label={`Remove source ${index + 1}`}
                    title="Remove this source"
                    onClick={() => setEditing({ ...editing, sources: editing.sources.filter((_, i) => i !== index) })}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border text-muted motion-safe:transition-colors hover:border-destructive/50 hover:bg-destructive-muted hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
                  >
                    <IconTrash className="h-[18px] w-[18px]" />
                  </button>
                </div>
              ))}
              {editing.sources.length < GUIDE_LIMITS.sources ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-10"
                  onClick={() => setEditing({ ...editing, sources: [...editing.sources, { label: "", url: "" }] })}
                >
                  + Add a source
                </Button>
              ) : null}
            </fieldset>

            <fieldset className="space-y-3">
              <legend className="flex w-full items-center justify-between text-label font-medium text-foreground">
                <span>Which districts see it?</span>
                <button
                  type="button"
                  className="text-body-sm font-medium text-accent hover:underline"
                  onClick={() =>
                    setEditing({
                      ...editing,
                      districtIds: editing.districtIds.length === ALL_DISTRICTS.length ? [] : ALL_DISTRICTS,
                    })
                  }
                >
                  {editing.districtIds.length === ALL_DISTRICTS.length ? "Clear all" : "Select all"}
                </button>
              </legend>
              <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
                {HELP_DISTRICTS.map((district) => (
                  <Checkbox
                    key={district.id}
                    label={district.name}
                    checked={editing.districtIds.includes(district.id)}
                    onChange={() =>
                      setEditing({
                        ...editing,
                        districtIds: editing.districtIds.includes(district.id)
                          ? editing.districtIds.filter((id) => id !== district.id)
                          : [...editing.districtIds, district.id],
                      })
                    }
                  />
                ))}
              </div>
            </fieldset>
            {error ? (
              <p className="text-body-sm text-destructive">{error}</p>
            ) : !editing.title.trim() ? (
              <p className="text-body-sm text-destructive">To save, add a title.</p>
            ) : editing.status !== "published" && !editing.body.trim() ? (
              <p className="text-body-sm text-muted">To publish, write the guide.</p>
            ) : editing.status !== "published" && editing.districtIds.length === 0 ? (
              <p className="text-body-sm text-muted">To publish, choose at least one district.</p>
            ) : null}
          </div>
        ) : null}
      </SideSheet>

      <Dialog
        open={Boolean(removing)}
        onClose={() => setRemoving(null)}
        title="Delete this guide?"
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
                if (removing) deleteGuide(removing.id);
                // If it was the guide open in the panel, the panel goes with it.
                if (removing && editing?.id === removing.id) leave();
                setRemoving(null);
              }}
            >
              Delete guide
            </Button>
          </>
        }
      >
        <p className="text-body-sm text-muted">&ldquo;{removing?.title}&rdquo; will be removed for everyone. You can archive it instead and keep the text.</p>
      </Dialog>

      <Dialog
        open={discarding}
        onClose={() => setDiscarding(false)}
        title="Discard your changes?"
        footer={
          <>
            <Button type="button" variant="outline" size="sm" onClick={() => setDiscarding(false)}>
              Keep editing
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={() => {
                setDiscarding(false);
                leave();
              }}
            >
              Discard
            </Button>
          </>
        }
      >
        <p className="text-body-sm text-muted">What you typed in this guide has not been saved.</p>
      </Dialog>
    </>
  );
}
