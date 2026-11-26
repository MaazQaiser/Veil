import { useEffect, useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Textarea } from "@/components/ui/controls";
import { IconReturn } from "@/components/ui/icons";
import { Tooltip } from "@/components/ui/menu";
import {
  FOUNDING_CAP,
  RETURN_NOTE_MAX,
  RETURN_REASONS,
  foundingRows,
  memberPhoto,
  returnFoundingPlace,
  type FoundingRow,
  type ReturnReason,
} from "@/lib/adminStore";
import { districts } from "@/lib/districts";
import { formatDate } from "@/lib/time";
import { useAdmin } from "@/lib/useAdmin";
import { AdminPageHeader, ChoiceCard, EmptyPanel, FilterSelect, Pagination, Panel, StatTile, StatusPill, TabBar } from "./parts";
import { SideSheet } from "./SideSheet";

type Tab = "all" | "held" | "completed";

/** How many places show on one page. */
const PAGE_SIZE = 8;

const COLUMNS = "md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)_8rem_3.5rem]";

export function AdminFoundingPage() {
  useAdmin();
  const [order, setOrder] = useState<"oldest" | "newest">("oldest");
  const [tab, setTab] = useState<Tab>("all");
  // The place being returned. It stays set while the panel slides out, so the panel does not go blank on the way.
  const [returning, setReturning] = useState<FoundingRow | null>(null);
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [district, setDistrict] = useState("all");
  const rows = foundingRows();
  const completed = rows.filter((row) => row.completed).length;
  // The district filter narrows the tabs and their counts too. The three cards above stay about the whole of Vael.
  const inDistrict = rows.filter((row) => district === "all" || row.district === district);
  const completedHere = inDistrict.filter((row) => row.completed).length;
  // Place 1 is the first member to join, so oldest first reads as 1, 2, 3 and newest first counts back down.
  const shown = inDistrict
    .filter((row) => (tab === "all" ? true : tab === "completed" ? row.completed : !row.completed))
    .sort((a, b) => (a.place - b.place) * (order === "oldest" ? 1 : -1));

  // A new tab, district or order starts again from the first page, and a page that no longer exists falls back to the last one.
  useEffect(() => setPage(1), [tab, district, order]);
  const current = Math.min(page, Math.max(1, Math.ceil(shown.length / PAGE_SIZE)));
  const pageRows = shown.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  function startReturn(row: FoundingRow) {
    setReturning(row);
    setOpen(true);
  }

  return (
    <>
      <AdminPageHeader
        title="Founding"
        lede="Here is an overview of the members who hold a founding place."
        action={
          <div className="flex flex-wrap items-end gap-3">
            <FilterSelect label="District" value={district} onChange={setDistrict}>
              <option value="all">All districts</option>
              {districts.map((item) => (
                <option key={item.id} value={item.name}>
                  {item.name}
                </option>
              ))}
              <option value="No district yet">No district yet</option>
            </FilterSelect>
            <FilterSelect label="Order" value={order} onChange={(value) => setOrder(value as "oldest" | "newest")}>
              <option value="oldest">Oldest first</option>
              <option value="newest">Newest first</option>
            </FilterSelect>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile label="Places held" value={`${rows.length} of ${FOUNDING_CAP}`} />
        <StatTile label="Completed" value={completed} hint="Profile filled in." />
        <StatTile label="Still to finish" value={rows.length - completed} hint="Joined, profile not finished." />
      </div>

      <TabBar
        label="Founding places"
        value={tab}
        onChange={setTab}
        tabs={[
          { id: "all", label: "All", count: inDistrict.length },
          { id: "held", label: "Held", count: inDistrict.length - completedHere },
          { id: "completed", label: "Completed", count: completedHere },
        ]}
      />

      {shown.length === 0 ? (
        <EmptyPanel
          title={
            rows.length === 0 ? "No founding places held yet" : inDistrict.length === 0 ? "No founding places in this district" : tab === "held" ? "No places are just held" : "No completed places yet"
          }
          body={
            rows.length === 0
              ? "The first people to join Vael show up here."
              : inDistrict.length === 0
                ? "Choose another district, or All districts."
                : tab === "held"
                ? "Every member with a founding place has finished their profile."
                : "A place is completed once the member has finished their profile."
          }
        />
      ) : (
        <Panel bodyClassName="p-0">
          <div className={`hidden ${COLUMNS} gap-4 border-b border-border-subtle px-5 py-3 text-caption font-medium uppercase tracking-wide text-muted md:grid`}>
            <span>Member</span>
            <span>District</span>
            <span>Joined</span>
            <span>Status</span>
            <span className="text-right">Action</span>
          </div>
          <ul className="divide-y divide-border-subtle">
            {pageRows.map((row) => (
              <li key={row.handle} className={`grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-4 gap-y-1 px-5 py-4 ${COLUMNS}`}>
                <span className="flex min-w-0 items-center gap-3">
                  <Avatar name={row.name} src={memberPhoto(row.handle)} size="sm" />
                  <span className="min-w-0">
                    <span className="block truncate text-body-sm font-medium text-foreground">{row.name}</span>
                    <span className="block truncate text-caption text-muted">{row.email}</span>
                  </span>
                </span>
                <span className="hidden truncate text-body-sm text-foreground/90 md:block">{row.district}</span>
                <span className="hidden text-body-sm text-muted md:block">{formatDate(row.joinedAt)}</span>
                <span>
                  <StatusPill tone={row.completed ? "done" : "warn"}>{row.completed ? "Completed" : "Held"}</StatusPill>
                </span>
                <span className="flex justify-end">
                  <Tooltip label="Return this founding place" align="left">
                    <button
                      type="button"
                      aria-label={`Return the founding place of ${row.name}`}
                      onClick={() => startReturn(row)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted motion-safe:transition-colors hover:border-destructive/50 hover:bg-destructive-muted hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
                    >
                      <IconReturn className="h-[18px] w-[18px]" />
                    </button>
                  </Tooltip>
                </span>
              </li>
            ))}
          </ul>
          <Pagination page={current} pageSize={PAGE_SIZE} total={shown.length} onChange={setPage} noun="places" />
        </Panel>
      )}

      {/* A new key for each member, so the form starts clean every time. */}
      {returning ? <ReturnSheet key={returning.handle} row={returning} open={open} onClose={() => setOpen(false)} /> : null}
    </>
  );
}

/** Takes a founding place back. The reason and note are for the record only, and the member never sees them. */
function ReturnSheet({ row, open, onClose }: { row: FoundingRow; open: boolean; onClose: () => void }) {
  const [reason, setReason] = useState<ReturnReason>("duplicate");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  function confirm() {
    try {
      returnFoundingPlace(row.handle, reason, note);
      onClose();
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "Could not return this place.");
    }
  }

  return (
    <SideSheet
      open={open}
      onClose={onClose}
      dirty={note.trim() !== ""}
      title="Return this founding place?"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={confirm}>
            Return it
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Avatar name={row.name} src={memberPhoto(row.handle)} size="lg" />
          <div className="min-w-0">
            <p className="truncate text-body font-semibold text-foreground">{row.name}</p>
            <p className="truncate text-body-sm text-muted">{row.email}</p>
            <p className="truncate text-caption text-muted">{row.district}</p>
          </div>
        </div>

        <p className="text-body-sm leading-6 text-muted">
          The place goes back to the pool and the member loses free access. Only you can restore it. They are told Vael returned it, never your note.
        </p>

        <fieldset className="space-y-2.5">
          <legend className="mb-2 text-body-sm font-semibold text-foreground">Why are you returning it?</legend>
          {RETURN_REASONS.map((item) => (
            <ChoiceCard
              key={item.id}
              name="return-reason"
              checked={reason === item.id}
              onSelect={() => setReason(item.id)}
              title={item.label}
              hint={item.hint}
            />
          ))}
        </fieldset>

        <Field label="Why (kept in the audit log, not sent to the member)" htmlFor="return-note">
          <Textarea
            id="return-note"
            value={note}
            maxLength={RETURN_NOTE_MAX}
            onChange={(event) => {
              setNote(event.target.value);
              setError("");
            }}
            className="min-h-[7rem]"
            placeholder={reason === "duplicate" ? "Which account it duplicates, and how you know" : "What happened, and what you checked"}
          />
        </Field>
        <p className="-mt-3 text-right text-caption tabular-nums text-muted">
          {note.length} / {RETURN_NOTE_MAX.toLocaleString("en-US")}
        </p>
        {error ? <p className="text-body-sm text-destructive">{error}</p> : null}
      </div>
    </SideSheet>
  );
}
