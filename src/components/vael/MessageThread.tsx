import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/controls";
import { cn } from "@/lib/cn";
import { relativeTime } from "@/lib/time";
import type { ThreadMessage } from "@/lib/vaelStore";

export function MessageThread({
  handle,
  messages,
  enabled,
  onSend,
}: {
  handle: string;
  messages: ThreadMessage[];
  enabled: boolean;
  onSend: (body: string, attachmentName?: string) => void;
}) {
  const [body, setBody] = useState("");
  const [fileName, setFileName] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "failed">("idle");

  if (!enabled) {
    return <p className="text-caption text-muted">The conversation opens after both people accept.</p>;
  }

  function send() {
    if (!body.trim()) return;
    setState("sending");
    try {
      onSend(body.trim(), fileName || undefined);
      setBody("");
      setFileName("");
      setState("idle");
    } catch {
      setState("failed");
    }
  }

  return (
    <div className="flex min-h-[22rem] flex-col">
      {messages.length === 0 ? (
        <p className="mt-3 text-body-sm text-muted">No messages yet. This thread is private to the two of you on this device.</p>
      ) : (
        <ul className="mt-3 max-h-[28rem] flex-1 space-y-3 overflow-y-auto">
          {messages.map((item) => {
            const mine = item.fromHandle === handle;
            return (
              <li key={item.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-3",
                    mine ? "bg-foreground text-background" : "border border-border bg-surface",
                  )}
                >
                  <p className="text-body-sm">{item.body}</p>
                  {item.attachmentName ? (
                    <p className={cn("mt-1 text-caption", mine ? "text-background/70" : "text-muted")}>
                      {item.attachmentName}
                    </p>
                  ) : null}
                  <p className={cn("mt-1 text-caption", mine ? "text-background/60" : "text-quiet")}>
                    {relativeTime(item.createdAt)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <form
        className="mt-4 space-y-2 border-t border-border-subtle pt-4"
        onSubmit={(event) => {
          event.preventDefault();
          send();
        }}
      >
        <label htmlFor={`msg-${handle}`} className="text-label font-medium text-foreground">
          Message
        </label>
        <Textarea id={`msg-${handle}`} value={body} onChange={(e) => setBody(e.target.value)} rows={3} />
        <label className="block text-caption text-muted">
          Attachment preview (local demo)
          <input
            type="file"
            className="mt-1 block"
            onChange={(event) => setFileName(event.target.files?.[0]?.name ?? "")}
          />
        </label>
        {fileName ? <p className="text-caption text-muted">{fileName}</p> : null}
        {state === "failed" ? (
          <p role="alert" className="text-caption text-destructive">
            Message did not send.
          </p>
        ) : null}
        <Button type="submit" loading={state === "sending"} disabled={!body.trim()}>
          Send
        </Button>
      </form>
    </div>
  );
}
