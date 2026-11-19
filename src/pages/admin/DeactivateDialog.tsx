import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/controls";
import { Dialog } from "@/components/ui/overlays";
import { setAccountStatus } from "@/lib/adminStore";

/** Asks before pausing an account. The reason goes in the audit log, the same as on the Accounts page. */
export function DeactivateDialog({ member, onClose }: { member: { handle: string; name: string } | null; onClose: () => void }) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  function close() {
    setReason("");
    setError("");
    onClose();
  }

  function confirm() {
    if (!member) return;
    try {
      setAccountStatus(member.handle, "deactivated", reason);
      close();
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "Could not change this account.");
    }
  }

  return (
    <Dialog
      open={Boolean(member)}
      onClose={close}
      title={`Deactivate ${member?.name ?? "this account"}?`}
      footer={
        <>
          <Button type="button" variant="outline" size="sm" onClick={close}>
            Cancel
          </Button>
          <Button type="button" size="sm" onClick={confirm}>
            Deactivate
          </Button>
        </>
      }
    >
      <p className="text-body-sm text-muted">They won't be able to sign in until you reactivate them on the Accounts page.</p>
      <label htmlFor="deactivate-reason" className="mt-4 block text-body-sm font-medium text-foreground">
        Reason (kept in the audit log)
      </label>
      <Textarea id="deactivate-reason" value={reason} onChange={(event) => setReason(event.target.value)} className="mt-2 min-h-[5rem]" />
      {error ? <p className="mt-2 text-body-sm text-destructive">{error}</p> : null}
    </Dialog>
  );
}
