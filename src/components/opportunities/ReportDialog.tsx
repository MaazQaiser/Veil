import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/controls";
import { Dialog } from "@/components/ui/overlays";
import { cn } from "@/lib/cn";

/**
 * Reporting an opportunity or a person: pick a reason, add a note if you like. Reporting the same thing
 * twice is refused, and the reporter is told it will be reviewed.
 */
export function ReportDialog({
  open,
  onClose,
  title,
  question,
  thanks,
  reasons,
  onSend,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  question: string;
  thanks: string;
  reasons: string[];
  /** Throws a readable message when the report is refused, for example when it was already sent. */
  onSend: (reason: string, details: string) => void;
}) {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (open) {
      setReason("");
      setDetails("");
      setError("");
      setSent(false);
    }
  }, [open]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      footer={
        sent ? (
          <Button type="button" onClick={onClose}>
            Close
          </Button>
        ) : (
          <>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!reason}
              onClick={() => {
                try {
                  onSend(reason, details);
                  setSent(true);
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Could not send the report.");
                }
              }}
            >
              Send report
            </Button>
          </>
        )
      }
    >
      {sent ? (
        <p className="text-body text-foreground">{thanks}</p>
      ) : (
        <div className="space-y-4">
          <fieldset className="space-y-2">
            <legend className="mb-3 text-body-sm text-muted">{question}</legend>
            {reasons.map((item) => (
              <label
                key={item}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-body-sm motion-safe:transition-colors",
                  reason === item ? "border-accent/60 bg-accent/10 text-foreground" : "border-border text-muted hover:text-foreground",
                )}
              >
                <input
                  type="radio"
                  name="report-reason"
                  checked={reason === item}
                  onChange={() => {
                    setReason(item);
                    setError("");
                  }}
                  className="accent-[#EE8A4A]"
                />
                {item}
              </label>
            ))}
          </fieldset>
          <Textarea value={details} onChange={(event) => setDetails(event.target.value)} placeholder="Add anything we should know (optional)" />
          {error ? <p className="text-body-sm text-destructive">{error}</p> : null}
        </div>
      )}
    </Dialog>
  );
}
