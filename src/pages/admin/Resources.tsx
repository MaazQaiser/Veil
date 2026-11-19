import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/choice";
import { Field } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/controls";
import { Dialog } from "@/components/ui/overlays";
import { HELP_DISTRICTS, deleteGuide, getGuides, getPageSettings, saveGuide, setGuideStatus, type Guide } from "@/lib/adminStore";
import { relativeTime } from "@/lib/time";
import { useAdmin } from "@/lib/useAdmin";
import { PageSettingsForm } from "./PageSettingsForm";
import { AdminPageHeader, EmptyPanel, Panel, StatusPill, TabBar } from "./parts";

type Draft = { id?: string; title: string; summary: string; body: string; districtIds: string[] };
const ALL_DISTRICTS = HELP_DISTRICTS.map((item) => item.id);
const BLANK: Draft = { title: "", summary: "", body: "", districtIds: ALL_DISTRICTS };

/** "All districts", one name, or a count: short enough for a tag. */
function districtTag(ids: string[]) {
  if (ids.length === ALL_DISTRICTS.length) return "All districts";
  if (ids.length === 1) return HELP_DISTRICTS.find((item) => item.id === ids[0])?.name ?? "1 district";
  return `${ids.length} districts`;
}

export function AdminResourcesPage() {
  useAdmin();
  const [tab, setTab] = useState<"guides" | "page">("guides");
  const [params] = useSearchParams();
  const [editing, setEditing] = useState<Draft | null>(params.get("new") === "1" ? { ...BLANK } : null);
  const [preview, setPreview] = useState<Draft | null>(null);
  const [removing, setRemoving] = useState<Guide | null>(null);
  const [error, setError] = useState("");
  const guides = getGuides();

  function save(status: "draft" | "published") {
    if (!editing) return;
    try {
      saveGuide(editing, status);
      setEditing(null);
      setError("");
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "Could not save this guide.");
    }
  }

  return (
    <>
      <AdminPageHeader
        title="Resources"
        lede="Guides members can read on Vael. Choose which districts each guide appears in, from one district to all of them."
        action={
          tab === "guides" && !editing ? (
            <Button type="button" onClick={() => setEditing({ ...BLANK })}>
              New guide
            </Button>
          ) : null
        }
      />
      <TabBar
        label="Resources"
        value={tab}
        onChange={setTab}
        tabs={[
          { id: "guides", label: "Guides", count: guides.length },
          { id: "page", label: "Page settings" },
        ]}
      />

      {tab === "page" ? (
        <PageSettingsForm page="resources" label="Resources" />
      ) : editing ? (
        <Panel title={editing.id ? "Edit guide" : "New guide"} bodyClassName="space-y-5">
          <Field label="Title" htmlFor="guide-title" required>
            <Input id="guide-title" value={editing.title} onChange={(event) => setEditing({ ...editing, title: event.target.value })} />
          </Field>
          <Field label="Summary" htmlFor="guide-summary" hint="One line shown in the list.">
            <Input id="guide-summary" value={editing.summary} onChange={(event) => setEditing({ ...editing, summary: event.target.value })} />
          </Field>
          <Field label="Guide" htmlFor="guide-body" required>
            <Textarea
              id="guide-body"
              value={editing.body}
              onChange={(event) => setEditing({ ...editing, body: event.target.value })}
              className="min-h-[12rem]"
            />
          </Field>
          <fieldset className="space-y-3">
            <legend className="flex w-full items-center justify-between text-label font-medium text-foreground">
              <span>Which districts see it?</span>
              <button
                type="button"
                className="text-body-sm font-medium text-accent hover:underline"
                onClick={() => setEditing({ ...editing, districtIds: editing.districtIds.length === ALL_DISTRICTS.length ? [] : ALL_DISTRICTS })}
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
      ) : guides.length === 0 ? (
        <EmptyPanel
          title="No guides yet"
          body="Write a guide and publish it. It shows up for members in the districts you choose straight away."
          action={<Button type="button" onClick={() => setEditing({ ...BLANK })}>New guide</Button>}
        />
      ) : (
        <ul className="space-y-3">
          {guides.map((guide) => (
            <li key={guide.id} className="rounded-2xl border border-border bg-surface p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1 basis-64">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-body font-semibold text-foreground">{guide.title}</h3>
                    <StatusPill tone={guide.status === "published" ? "done" : "muted"}>
                      {guide.status === "published" ? "Published" : "Draft"}
                    </StatusPill>
                    <span className="rounded-full border border-border-subtle bg-surface-muted/60 px-2.5 py-1 text-caption text-muted">{districtTag(guide.districtIds)}</span>
                  </div>
                  {guide.summary ? <p className="mt-1 text-body-sm text-muted">{guide.summary}</p> : null}
                  {guide.updatedAt ? <p className="mt-2 text-caption text-muted">Updated {relativeTime(guide.updatedAt)}</p> : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" className="h-10" onClick={() => setEditing({ id: guide.id, title: guide.title, summary: guide.summary, body: guide.body, districtIds: guide.districtIds })}>
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-10"
                    onClick={() => setGuideStatus(guide.id, guide.status === "published" ? "draft" : "published")}
                  >
                    {guide.status === "published" ? "Unpublish" : "Publish"}
                  </Button>
                  <Button type="button" variant="destructive" size="sm" className="h-10" onClick={() => setRemoving(guide)}>
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
          <article>
            <p className="text-body-sm text-muted">{getPageSettings().resources.welcome}</p>
            <h3 className="mt-5 text-h4 font-semibold text-foreground">{preview.title || "Untitled guide"}</h3>
            {preview.summary ? <p className="mt-1 text-body-sm text-muted">{preview.summary}</p> : null}
            <p className="mt-4 whitespace-pre-line text-body-sm leading-6 text-foreground/90">{preview.body || "Nothing written yet."}</p>
            <p className="mt-6 border-t border-border-subtle pt-4 text-caption text-muted">{getPageSettings().resources.disclaimer}</p>
          </article>
        ) : null}
      </Dialog>

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
                setRemoving(null);
              }}
            >
              Delete guide
            </Button>
          </>
        }
      >
        <p className="text-body-sm text-muted">&ldquo;{removing?.title}&rdquo; will be removed for everyone. You can unpublish it instead and keep the text.</p>
      </Dialog>
    </>
  );
}
