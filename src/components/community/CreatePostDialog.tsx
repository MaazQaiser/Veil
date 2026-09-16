import { useState } from "react";
import { Dialog } from "@/components/ui/overlays";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/controls";
import { cn } from "@/lib/cn";
import { useCommunity } from "@/lib/communityCore";
import {
  COMPOSER_POST_KINDS,
  LIVE_COMMUNITY_DISTRICTS,
  communityDistrictLabel,
  communityPostKindLabel,
  isLiveCommunityDistrict,
  type CommunityDistrictId,
  type CommunityPost,
  type CommunityPostKind,
} from "@/lib/communityStore";

export function CreatePostDialog({
  open,
  onClose,
  defaultDistrictId,
  onPublished,
}: {
  open: boolean;
  onClose: () => void;
  defaultDistrictId: CommunityDistrictId;
  onPublished?: (post: CommunityPost) => void;
}) {
  const community = useCommunity();
  const [kind, setKind] = useState<CommunityPostKind>("discussion");
  const [districtId, setDistrictId] = useState<CommunityDistrictId>(
    isLiveCommunityDistrict(defaultDistrictId) ? defaultDistrictId : "city",
  );
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [link, setLink] = useState("");
  const [status, setStatus] = useState<"editing" | "publishing" | "error">("editing");
  const [error, setError] = useState("");

  function reset() {
    setKind("discussion");
    setTitle("");
    setBody("");
    setLink("");
    setError("");
    setStatus("editing");
  }

  function publish() {
    setStatus("publishing");
    try {
      const finalBody = link.trim() ? `${body.trim()}\n\n${link.trim()}` : body;
      const post = community.publish({ districtId, body: finalBody, kind, title });
      reset();
      onPublished?.(post);
      onClose();
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "The post could not be saved on this device.");
    }
  }

  return (
    <Dialog
      open={open}
      onClose={() => {
        onClose();
      }}
      title="Create a Post"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={publish} loading={status === "publishing"} disabled={!body.trim()}>
            Publish
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div>
          <p className="text-label font-medium text-foreground">What do you want to share?</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {COMPOSER_POST_KINDS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setKind(item)}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-body-sm font-medium motion-safe:transition-colors motion-safe:duration-150",
                  kind === item
                    ? "border-foreground bg-foreground text-white dark:border-transparent dark:bg-accent dark:text-[#1A1410]"
                    : "border-border text-muted hover:border-[#C99A28] hover:text-foreground dark:hover:border-accent",
                )}
              >
                {communityPostKindLabel(item)}
              </button>
            ))}
          </div>
        </div>

        <Field label="Community" htmlFor="cp-district">
          <Select id="cp-district" value={districtId} onChange={(e) => setDistrictId(e.target.value as CommunityDistrictId)}>
            {LIVE_COMMUNITY_DISTRICTS.map((id) => (
              <option key={id} value={id}>
                {communityDistrictLabel(id)}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Title" htmlFor="cp-title" hint="Optional.">
          <Input id="cp-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What's this about?" />
        </Field>

        <Field label="Content" htmlFor="cp-body" required>
          <Textarea id="cp-body" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write something..." />
        </Field>

        <Field label="Link" htmlFor="cp-link" hint="Optional. Added to the end of your post.">
          <Input id="cp-link" type="url" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://" />
        </Field>

        {error ? (
          <p role="alert" className="text-caption text-destructive">
            {error}
          </p>
        ) : null}
      </div>
    </Dialog>
  );
}
