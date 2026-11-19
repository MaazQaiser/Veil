import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/controls";
import { Dialog } from "@/components/ui/overlays";
import { cn } from "@/lib/cn";
import { adminAccounts, setAccountStatus, type AdminAccount } from "@/lib/adminStore";
import { formatDate } from "@/lib/time";
import { useAdmin } from "@/lib/useAdmin";
import { AdminPageHeader, EmptyPanel, Panel, StatusPill } from "./parts";

type Filter = "all" | "active" | "deactivated" | "blocked";
type Pending = { account: AdminAccount; kind: "deactivate" | "block" } | null;

export function AdminAccountsPage() {
  useAdmin();
  const [filter, setFilter] = useState<Filter>("all");
  const [params] = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [pending, setPending] = useState<Pending>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const all = adminAccounts();
  const wanted = query.trim().toLowerCase();
  const rows = all.filter(
    (account) =>
      (filter === "all" || account.status === filter) &&
      (!wanted || `${account.displayName} ${account.email} ${account.handle}`.toLowerCase().includes(wanted)),
  );

  function close() {
    setPending(null);
    setReason("");
    setError("");
  }

  function confirm() {
    if (!pending) return;
    try {
      setAccountStatus(pending.account.handle, pending.kind === "block" ? "blocked" : "deactivated", reason);
      close();
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "Could not change this account.");
    }
  }

  const chips: { id: Filter; label: string; count: number }[] = [
    { id: "all", label: "All", count: all.length },
    { id: "active", label: "Active", count: all.filter((a) => a.status === "active").length },
    { id: "deactivated", label: "Deactivated", count: all.filter((a) => a.status === "deactivated").length },
    { id: "blocked", label: "Blocked", count: all.filter((a) => a.status === "blocked").length },
  ];

  return (
    <>
      <AdminPageHeader
        title="Accounts"
        lede="Deactivate someone to pause their account, or block them for good. They can't sign in either way."
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {chips.map((chip) => (
            <button
              key={chip.id}
              type="button"
              aria-pressed={filter === chip.id}
              onClick={() => setFilter(chip.id)}
              className={cn(
                "inline-flex h-9 items-center gap-2 rounded-full border px-3.5 text-body-sm font-medium motion-safe:transition-colors",
                filter === chip.id ? "border-accent bg-accent/15 text-accent" : "border-border text-muted hover:text-foreground",
              )}
            >
              {chip.label}
              <span className="text-caption opacity-80">{chip.count}</span>
            </button>
          ))}
        </div>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search name or email"
          aria-label="Search accounts"
          className="h-10 w-full rounded-full border border-border bg-surface px-4 text-body-sm text-foreground placeholder:text-quiet focus-visible:border-foreground focus-visible:outline-none sm:w-64"
        />
      </div>

      {rows.length === 0 ? (
        <EmptyPanel
          title={all.length === 0 ? "No accounts yet" : "No one matches"}
          body={all.length === 0 ? "Accounts appear here as people sign up." : "Try another filter or search."}
        />
      ) : (
        <Panel bodyClassName="p-0">
          <ul className="divide-y divide-border-subtle">
            {rows.map((account) => (
              <li key={account.handle} className="flex flex-wrap items-center gap-x-4 gap-y-3 px-5 py-4">
                <Avatar name={account.displayName || account.handle} size="md" />
                <div className="min-w-0 flex-1 basis-48">
                  <p className="truncate text-body-sm font-semibold text-foreground">{account.displayName || account.handle}</p>
                  <p className="truncate text-caption text-muted">
                    {account.email} · Joined {formatDate(account.createdAt)}
                  </p>
                  {account.reason ? <p className="mt-0.5 truncate text-caption text-muted">Reason: {account.reason}</p> : null}
                </div>
                <StatusPill tone={account.status === "active" ? "done" : account.status === "blocked" ? "bad" : "warn"}>
                  {account.status === "active" ? "Active" : account.status === "blocked" ? "Blocked" : "Deactivated"}
                </StatusPill>
                <div className="flex gap-2">
                  {account.status === "active" ? (
                    <>
                      <Button type="button" variant="outline" size="sm" className="h-10" onClick={() => setPending({ account, kind: "deactivate" })}>
                        Deactivate
                      </Button>
                      <Button type="button" variant="destructive" size="sm" className="h-10" onClick={() => setPending({ account, kind: "block" })}>
                        Block
                      </Button>
                    </>
                  ) : account.status === "deactivated" ? (
                    <>
                      <Button type="button" variant="outline" size="sm" className="h-10" onClick={() => setAccountStatus(account.handle, "active")}>
                        Reactivate
                      </Button>
                      <Button type="button" variant="destructive" size="sm" className="h-10" onClick={() => setPending({ account, kind: "block" })}>
                        Block
                      </Button>
                    </>
                  ) : (
                    <span className="text-caption text-muted">Blocked for good</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <Dialog
        open={Boolean(pending)}
        onClose={close}
        title={pending?.kind === "block" ? `Block ${pending.account.displayName || pending.account.handle} for good?` : `Deactivate ${pending?.account.displayName || pending?.account.handle}?`}
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
        <label htmlFor="account-reason" className="mt-4 block text-body-sm font-medium text-foreground">
          Reason (kept in the audit log)
        </label>
        <Textarea id="account-reason" value={reason} onChange={(event) => setReason(event.target.value)} className="mt-2 min-h-[5rem]" />
        {error ? <p className="mt-2 text-body-sm text-destructive">{error}</p> : null}
      </Dialog>
    </>
  );
}
