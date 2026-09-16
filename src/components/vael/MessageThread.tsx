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
  placeholder = "Write a message...",
  compact = false,
}: {
  handle: string;
  messages: ThreadMessage[];
  enabled: boolean;
  onSend: (body: string, attachmentName?: string) => void;
  placeholder?: string;
  /** Fill the parent and pin the composer to the bottom (inbox layout). */
  compact?: boolean;
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

  const thread =
    messages.length === 0 ? (
      <p className="text-body-sm text-muted">
        No messages yet. This thread is private to the two of you on this device.
      </p>
    ) : (
      <ul className="space-y-3">
        {messages.map((item) => {
          const mine = item.fromHandle === handle;
          return (
            <li key={item.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-3",
                  mine
                    ? "bg-foreground text-background dark:bg-gradient-to-br dark:from-accent-hover dark:to-accent dark:text-[#1A1410]"
                    : "border border-border bg-surface",
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
    );

  return (
    <div className={cn("flex flex-col", compact ? "min-h-0 flex-1" : "min-h-[22rem]")}>
      <div className={cn("min-h-0 flex-1 overflow-y-auto", compact ? "py-4" : "mt-3 max-h-[28rem]")}>{thread}</div>
      <form
        className={cn("shrink-0 border-t border-border-subtle", compact ? "flex items-end gap-2 pt-3" : "mt-4 space-y-2 pt-4")}
        onSubmit={(event) => {
          event.preventDefault();
          send();
        }}
      >
        {compact ? (
          <>
            <label htmlFor={`msg-${handle}`} className="sr-only">
              Message
            </label>
            <Textarea
              id={`msg-${handle}`}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={1}
              placeholder={placeholder}
              className="min-h-11 max-h-24 resize-none rounded-full py-2.5 pl-5 pr-4"
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  send();
                }
              }}
            />
            <Button
              type="submit"
              className="h-11 shrink-0 rounded-full border-transparent bg-[#FFC555] px-5 text-[#0B0C0C] hover:bg-[#FFC555]/90 dark:bg-accent dark:text-[#1A1410] dark:hover:bg-accent-hover"
              loading={state === "sending"}
              disabled={!body.trim()}
            >
              Send
            </Button>
          </>
        ) : (
          <>
            <label htmlFor={`msg-${handle}`} className="text-label font-medium text-foreground">
              Message
            </label>
            <Textarea
              id={`msg-${handle}`}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
              placeholder={placeholder}
            />
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
          </>
        )}
        {compact && state === "failed" ? (
          <p role="alert" className="basis-full text-caption text-destructive">
            Message did not send.
          </p>
        ) : null}
      </form>
    </div>
  );
}
