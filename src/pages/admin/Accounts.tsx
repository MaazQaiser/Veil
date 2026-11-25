import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/controls";
import { IconBlock, IconUserCheck, IconUserMinus } from "@/components/ui/icons";
import { Tooltip } from "@/components/ui/menu";
import { Dialog } from "@/components/ui/overlays";
import { cn } from "@/lib/cn";
import { districts } from "@/lib/districts";
import { adminAccounts, memberPhoto, setAccountStatus, type AdminAccount } from "@/lib/adminStore";
import { formatDate } from "@/lib/time";
import { useAdmin } from "@/lib/useAdmin";
import { CARD } from "./gauges";
import { AdminPageHeader, EmptyPanel, FilterSelect, StatusPill, TabBar } from "./parts";

type Tab = "all" | "active" | "deactivated" | "blocked";
type Pending = { member: AdminAccount; kind: "deactivate" | "block" } | null;

const ICON_BUTTON =
  "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted motion-safe:transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70";

/** The Members page. The route is still /admin/accounts so existing links keep working. */
export function AdminAccountsPage() {
  useAdmin();
  const [tab, setTab] = useState<Tab>("all");
  const [params] = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");
  // The search in the top bar sends its words here in the address, so the list follows it.
  const urlQuery = params.get("q") ?? "";
  useEffect(() => setQuery(urlQuery), [urlQuery]);
  const [district, setDistrict] = useState("all");
  const [pending, setPending] = useState<Pending>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const all = adminAccounts();
  const wanted = query.trim().toLowerCase();
  const rows = all.filter(
    (member) =>
      (tab === "all" || member.status === tab) &&
      (district === "all" || member.districtId === district) &&
      (!wanted || `${member.displayName} ${member.email} ${member.handle}`.toLowerCase().includes(wanted)),
  );
  const count = (status: AdminAccount["status"]) => all.filter((member) => member.status === status).length;

  function close() {
    setPending(null);
    setReason("");
    setError("");
  }

  function confirm() {
    if (!pending) return;
    try {
      setAccountStatus(pending.member.handle, pending.kind === "block" ? "blocked" : "deactivated", reason);
      close();
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "Could not change this member.");
    }
  }

  const nameOf = (member: AdminAccount) => member.displayName || member.handle;

  return (
    <>
      <AdminPageHeader
        title="Members"
        lede="Here is an overview of everyone who has joined Vael."
        action={
          <div className="flex flex-wrap items-end gap-3">
            <label className="block">
              <span className="mb-1 block text-caption font-medium text-muted">Search</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Name or email"
                aria-label="Search members"
                className="h-10 w-full rounded-xl border border-border bg-surface px-4 text-body-sm text-foreground placeholder:text-quiet focus-visible:border-foreground focus-visible:outline-none sm:w-52"
              />
            </label>
            <FilterSelect label="District" value={district} onChange={setDistrict}>
              <option value="all">All districts</option>
              {districts.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
              <option value="none">No district yet</option>
            </FilterSelect>
            {/* The same choice as the tabs below, so the two always agree. */}
            <FilterSelect label="Status" value={tab} onChange={(value) => setTab(value as Tab)}>
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="deactivated">Deactivated</option>
              <option value="blocked">Blocked</option>
            </FilterSelect>
          </div>
        }
      />

      <TabBar
        label="Members"
        value={tab}
        onChange={setTab}
        tabs={[
          { id: "all", label: "All", count: all.length },
          { id: "active", label: "Active", count: count("active") },
          { id: "deactivated", label: "Deactivated", count: count("deactivated") },
          { id: "blocked", label: "Blocked", count: count("blocked") },
        ]}
      />

      {rows.length === 0 ? (
        <EmptyPanel
          title={all.length === 0 ? "No members yet" : "No one matches"}
          body={all.length === 0 ? "Members appear here as people sign up." : "Try another tab, district or search."}
        />
      ) : (
        <section className={cn(CARD, "overflow-hidden")}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[44rem] text-left text-body-sm">
              <thead>
                <tr className="border-b border-border-subtle bg-surface-muted/30 text-caption uppercase tracking-wide text-muted">
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-3 py-3 font-medium">Email</th>
                  <th className="px-3 py-3 font-medium">Joined</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {rows.map((member) => (
                  <tr key={member.handle} className="hover:bg-surface-muted/50">
                    <td className="px-5 py-3.5">
                      <span className="flex items-center gap-3">
                        <Avatar name={nameOf(member)} src={memberPhoto(member.handle)} size="sm" />
                        <span className="truncate font-medium text-foreground">{nameOf(member)}</span>
                      </span>
                    </td>
                    <td className="px-3 py-3.5 text-muted">{member.email}</td>
                    <td className="whitespace-nowrap px-3 py-3.5 text-muted">{formatDate(member.createdAt)}</td>
                    <td className="px-3 py-3.5">
                      <span title={member.reason ? `Reason: ${member.reason}` : undefined}>
                        <StatusPill tone={member.status === "active" ? "done" : member.status === "blocked" ? "bad" : "warn"}>
                          {member.status === "active" ? "Active" : member.status === "blocked" ? "Blocked" : "Deactivated"}
                        </StatusPill>
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="flex items-center justify-end gap-2">
                        {member.status === "blocked" ? (
                          <span className="text-caption text-muted">Blocked for good</span>
                        ) : (
                          <>
                            {member.status === "active" ? (
                              <Tooltip label="Deactivate this member">
                                <button
                                  type="button"
                                  aria-label={`Deactivate ${nameOf(member)}`}
                                  onClick={() => setPending({ member, kind: "deactivate" })}
                                  className={cn(ICON_BUTTON, "hover:border-foreground/40 hover:text-foreground")}
                                >
                                  <IconUserMinus className="h-[18px] w-[18px]" />
                                </button>
                              </Tooltip>
                            ) : (
                              <Tooltip label="Reactivate this member">
                                <button
                                  type="button"
                                  aria-label={`Reactivate ${nameOf(member)}`}
                                  onClick={() => setAccountStatus(member.handle, "active")}
                                  className={cn(ICON_BUTTON, "hover:border-success/50 hover:bg-success-muted hover:text-success")}
                                >
                                  <IconUserCheck className="h-[18px] w-[18px]" />
                                </button>
                              </Tooltip>
                            )}
                            <Tooltip label="Block this member" align="left">
                              <button
                                type="button"
                                aria-label={`Block ${nameOf(member)}`}
                                onClick={() => setPending({ member, kind: "block" })}
                                className={cn(ICON_BUTTON, "hover:border-destructive/50 hover:bg-destructive-muted hover:text-destructive")}
                              >
                                <IconBlock className="h-[18px] w-[18px]" />
                              </button>
                            </Tooltip>
                          </>
                        )}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <Dialog
        open={Boolean(pending)}
        onClose={close}
        title={pending?.kind === "block" ? `Block ${nameOf(pending.member)} for good?` : `Deactivate ${pending ? nameOf(pending.member) : ""}?`}
        footer={
          <>
            <Button type="button" variant="outline" size="sm" onClick={close}>
              Cancel
            </Button>
            <Button type="button" size="sm" variant={pending?.kind === "block" ? "destructive" : "primary"} onClick={confirm}>
              {pending?.kind === "block" ? "Block for good" : "Deactivate"}
            </Button>
          </>
        }
      >
        <p className="text-body-sm text-muted">
          {pending?.kind === "block"
            ? "They won't be able to sign in again, and this can't be undone."
            : "They won't be able to sign in until you reactivate them."}
        </p>
        <label htmlFor="member-reason" className="mt-4 block text-body-sm font-medium text-foreground">
          Reason (kept in the audit log)
        </label>
        <Textarea id="member-reason" value={reason} onChange={(event) => setReason(event.target.value)} className="mt-2 min-h-[5rem]" />
        {error ? <p className="mt-2 text-body-sm text-destructive">{error}</p> : null}
      </Dialog>
    </>
  );
}
