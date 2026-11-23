import { useState, type FormEvent } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/controls";
import { IconTrash, IconUserCheck, IconUserMinus } from "@/components/ui/icons";
import { Tooltip } from "@/components/ui/menu";
import { Dialog } from "@/components/ui/overlays";
import { cn } from "@/lib/cn";
import { addAdmin, adminStaff, deleteAdmin, removeAdmin, restoreAdmin, type StaffMember } from "@/lib/adminStore";
import { formatDate } from "@/lib/time";
import { useAdmin } from "@/lib/useAdmin";
import { CARD } from "./gauges";
import { AdminPageHeader, StatusPill } from "./parts";
import { SideSheet } from "./SideSheet";

type Pending = { member: StaffMember; kind: "remove" | "delete" } | null;

const ICON_BUTTON =
  "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted motion-safe:transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70";

/** The people who can use this admin area. Only the owner can add or take away admins. */
export function AdminAdminsPage() {
  useAdmin();
  const staff = adminStaff();
  const [adding, setAdding] = useState(false);
  const [pending, setPending] = useState<Pending>(null);
  const [error, setError] = useState("");

  function act() {
    if (!pending) return;
    try {
      if (pending.kind === "remove") removeAdmin(pending.member.id);
      else deleteAdmin(pending.member.id);
      setPending(null);
      setError("");
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "Could not change this admin.");
    }
  }

  return (
    <>
      <AdminPageHeader
        title="Admins"
        lede="Here are the people who can manage Vael."
        action={
          <Button type="button" onClick={() => setAdding(true)}>
            Add admin
          </Button>
        }
      />

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
              {staff.map((member) => {
                const removed = member.status === "removed";
                return (
                  <tr key={member.id} className={cn("hover:bg-surface-muted/50", removed && "opacity-75")}>
                    <td className="px-5 py-3.5">
                      <span className="flex items-center gap-3">
                        <Avatar name={member.name} size="sm" />
                        <span className="min-w-0">
                          <span className="block truncate font-medium text-foreground">{member.name}</span>
                          <span className="block text-caption text-muted">{member.role === "owner" ? "Owner" : "Admin"}</span>
                        </span>
                      </span>
                    </td>
                    <td className="px-3 py-3.5 text-muted">{member.email}</td>
                    <td className="whitespace-nowrap px-3 py-3.5 text-muted">{formatDate(member.addedAt)}</td>
                    <td className="px-3 py-3.5">
                      <StatusPill tone={removed ? "warn" : "done"}>{removed ? "Removed" : "Active"}</StatusPill>
                    </td>
                    <td className="px-5 py-3.5">
                      {member.role === "owner" ? (
                        <span className="block text-right text-caption text-muted">Can't be changed</span>
                      ) : (
                        <span className="flex items-center justify-end gap-2">
                          {removed ? (
                            <Tooltip label="Give back access">
                              <button
                                type="button"
                                aria-label={`Restore ${member.name}`}
                                onClick={() => restoreAdmin(member.id)}
                                className={cn(ICON_BUTTON, "hover:border-success/50 hover:bg-success-muted hover:text-success")}
                              >
                                <IconUserCheck className="h-[18px] w-[18px]" />
                              </button>
                            </Tooltip>
                          ) : (
                            <Tooltip label="Remove this admin">
                              <button
                                type="button"
                                aria-label={`Remove ${member.name}`}
                                onClick={() => setPending({ member, kind: "remove" })}
                                className={cn(ICON_BUTTON, "hover:border-foreground/40 hover:text-foreground")}
                              >
                                <IconUserMinus className="h-[18px] w-[18px]" />
                              </button>
                            </Tooltip>
                          )}
                          <Tooltip label="Delete permanently" align="left">
                            <button
                              type="button"
                              aria-label={`Delete ${member.name} permanently`}
                              onClick={() => setPending({ member, kind: "delete" })}
                              className={cn(ICON_BUTTON, "hover:border-destructive/50 hover:bg-destructive-muted hover:text-destructive")}
                            >
                              <IconTrash className="h-[18px] w-[18px]" />
                            </button>
                          </Tooltip>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <AddAdminSheet open={adding} onClose={() => setAdding(false)} />

      <Dialog
        open={Boolean(pending)}
        onClose={() => {
          setPending(null);
          setError("");
        }}
        title={pending?.kind === "delete" ? `Delete ${pending.member.name} permanently?` : `Remove ${pending?.member.name ?? "this admin"}?`}
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setPending(null);
                setError("");
              }}
            >
              Cancel
            </Button>
            <Button type="button" size="sm" variant={pending?.kind === "delete" ? "destructive" : "primary"} onClick={act}>
              {pending?.kind === "delete" ? "Delete permanently" : "Remove"}
            </Button>
          </>
        }
      >
        <p className="text-body-sm text-muted">
          {pending?.kind === "delete"
            ? "They are taken off the list for good and lose all access. This can't be undone."
            : "They lose access to this area straight away. They stay on the list, so you can give it back later."}
        </p>
        {error ? <p className="mt-3 text-body-sm text-destructive">{error}</p> : null}
      </Dialog>
    </>
  );
}

/** The panel that slides in to add an admin: a name, an email and one button. */
function AddAdminSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  function close() {
    onClose();
    // Cleared after it has slid away, so the form does not flash empty on the way out.
    window.setTimeout(() => {
      setName("");
      setEmail("");
      setError("");
    }, 250);
  }

  function submit(event?: FormEvent) {
    event?.preventDefault();
    try {
      addAdmin(name, email);
      close();
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "Could not add this admin.");
    }
  }

  return (
    <SideSheet
      open={open}
      onClose={close}
      title="Add an admin"
      footer={
        <>
          <Button type="button" variant="outline" onClick={close}>
            Cancel
          </Button>
          <Button type="submit" form="add-admin-form">
            Add admin
          </Button>
        </>
      }
    >
      <form id="add-admin-form" onSubmit={submit} className="space-y-5" noValidate>
        <p className="text-body-sm leading-6 text-muted">An admin works in this area only and can't use the member side. Only you can add or remove admins.</p>
        <Field label="Name" htmlFor="admin-name">
          <Input
            id="admin-name"
            value={name}
            autoComplete="off"
            onChange={(event) => {
              setName(event.target.value);
              setError("");
            }}
            placeholder="Full name"
          />
        </Field>
        <Field label="Email" htmlFor="admin-email">
          <Input
            id="admin-email"
            type="email"
            value={email}
            autoComplete="off"
            onChange={(event) => {
              setEmail(event.target.value);
              setError("");
            }}
            placeholder="name@company.com"
          />
        </Field>
        {error ? <p className="text-body-sm text-destructive">{error}</p> : null}
      </form>
    </SideSheet>
  );
}
