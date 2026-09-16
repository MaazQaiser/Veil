import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClassName } from "@/components/ui/button";
import { Card, CardBody, CardFooter, CardHeader, CardMeta, CardTitle } from "@/components/ui/card";
import { DistrictStatus, VaelStatus, type DistrictLotStatus, type VaelKind } from "./status";
import { MatchPercent } from "./match";
import { Avatar } from "@/components/ui/avatar";
import { IconDocument, IconLock } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

export function ListingCard({
  title,
  side,
  location,
  summary,
  hoursLeft,
  expired,
}: {
  title: string;
  side: VaelKind;
  location: string;
  summary: string;
  hoursLeft?: number;
  expired?: boolean;
}) {
  return (
    <Card className={expired ? "opacity-70" : undefined}>
      <CardHeader>
        <VaelStatus kind={expired ? "expired" : side} hoursLeft={hoursLeft} />
        <CardTitle>{title}</CardTitle>
        <CardMeta>{location}</CardMeta>
      </CardHeader>
      <CardBody>{summary}</CardBody>
    </Card>
  );
}

export function MatchCard({
  name,
  role,
  percent,
  why,
}: {
  name: string;
  role: string;
  percent: number;
  why: string;
}) {
  return (
    <Card className="grid gap-4 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center">
      <MatchPercent value={percent} />
      <div>
        <CardHeader className="mb-2">
          <CardTitle>{name}</CardTitle>
          <CardMeta>{role}</CardMeta>
        </CardHeader>
        <CardBody>{why}</CardBody>
        <CardFooter>
          <Button size="sm">Request Handshake</Button>
          <Button size="sm" variant="ghost">
            View match
          </Button>
        </CardFooter>
      </div>
    </Card>
  );
}

export function ProfileCard({
  name,
  handle,
  headline,
  locked,
  avatarUrl,
  photoLocked,
}: {
  name: string;
  handle: string;
  headline: string;
  locked?: boolean;
  avatarUrl?: string;
  /** Obscure the face only where the name is withheld too, so the two never disagree. */
  photoLocked?: boolean;
}) {
  return (
    <Card>
      <div className="flex gap-3">
        <Avatar name={name} src={avatarUrl} size="lg" locked={photoLocked} />
        <div className="min-w-0">
          <p className="vael-h4">{name}</p>
          <p className="text-caption text-muted">@{handle}</p>
          {locked ? (
            <p className="mt-2 inline-flex items-center gap-2 text-body-sm text-muted">
              <IconLock /> Full profile opens after a Handshake.
            </p>
          ) : (
            <p className="mt-2 text-body-sm">{headline}</p>
          )}
        </div>
      </div>
    </Card>
  );
}

export function DistrictCard({
  name,
  status,
  summary,
  href,
  note,
  selection,
}: {
  name: string;
  status: DistrictLotStatus;
  summary: string;
  href?: string;
  /** Extra line of honest context, e.g. what a district expects of you. */
  note?: string;
  /** Turns the card into a radio choice. Live districts only. */
  selection?: { group: string; selected: boolean; onSelect: () => void };
}) {
  const enterable = status === "live";
  const action = enterable ? "Enter district" : "View status";
  const statusLabel = status === "live" ? "Live" : status === "future" ? "Future" : status === "early" ? "Early Access" : "Coming Soon";

  if (selection && enterable) {
    return (
      <Card
        className={cn(
          "motion-safe:transition-colors motion-safe:duration-200 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
          selection.selected ? "border-foreground bg-surface-muted" : "hover:border-foreground/40",
        )}
      >
        <label className="flex cursor-pointer flex-col">
          <input
            type="radio"
            name={selection.group}
            className="sr-only"
            checked={selection.selected}
            onChange={selection.onSelect}
          />
          <CardHeader>
            <DistrictStatus status={status} />
            <CardTitle>{name}</CardTitle>
          </CardHeader>
          <CardBody>{summary}</CardBody>
          {note ? <CardMeta className="mt-3">{note}</CardMeta> : null}
          <CardFooter>
            <span
              className={cn(
                "inline-flex items-center gap-2 text-body-sm",
                selection.selected ? "font-medium text-foreground" : "text-muted",
              )}
            >
              <span aria-hidden>{selection.selected ? "✓" : "○"}</span>
              {selection.selected ? "Selected" : "Select"}
            </span>
          </CardFooter>
        </label>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <DistrictStatus status={status} />
        <CardTitle>{name}</CardTitle>
      </CardHeader>
      <CardBody>{summary}</CardBody>
      {note ? <CardMeta className="mt-3">{note}</CardMeta> : null}
      <CardFooter>
        {href ? (
          <Link
            to={href}
            aria-label={`${action}: ${name}, ${statusLabel}`}
            className={buttonClassName({ size: "sm", variant: enterable ? "primary" : "outline" })}
          >
            {action}
          </Link>
        ) : (
          <Button size="sm" variant={enterable ? "primary" : "outline"} disabled>
            {action}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

export function CommunityPostCard({
  author,
  time,
  body,
  handle,
  district,
  likeCount,
  commentCount,
  liked,
  saved,
  href,
  authorHref,
  districtHref,
  onLike,
  onSave,
}: {
  author: string;
  time: string;
  body: string;
  handle?: string;
  district?: string;
  likeCount?: number;
  commentCount?: number;
  liked?: boolean;
  saved?: boolean;
  href?: string;
  authorHref?: string;
  districtHref?: string;
  onLike?: () => void;
  onSave?: () => void;
}) {
  const authorLabel = handle ? `@${handle}` : author;
  return (
    <article className="rounded-2xl border border-transparent bg-surface-muted p-5 md:p-6">
      <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        {authorHref ? (
          <Link to={authorHref} className="text-body-sm font-medium hover:underline">
            {authorLabel}
          </Link>
        ) : (
          <p className="text-body-sm font-medium">{authorLabel}</p>
        )}
        {district ? (
          districtHref ? (
            <Link to={districtHref} className="text-label text-muted hover:underline">
              {district}
            </Link>
          ) : (
            <p className="text-label text-muted">{district}</p>
          )
        ) : null}
      </header>
      <p className="mt-4 text-body">{body}</p>
      <footer className="mt-5 flex flex-wrap items-center gap-4">
        {onLike ? (
          <button
            type="button"
            className="text-caption font-medium text-muted hover:text-foreground focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgba(17,17,17,0.06)]"
            aria-pressed={liked}
            onClick={onLike}
          >
            {liked ? "Liked" : "Like"}
            {typeof likeCount === "number" ? ` · ${likeCount}` : ""}
          </button>
        ) : typeof likeCount === "number" ? (
          <span className="text-caption text-muted">{likeCount} like{likeCount === 1 ? "" : "s"}</span>
        ) : null}
        {typeof commentCount === "number" ? (
          <span className="text-caption text-muted">
            {commentCount} comment{commentCount === 1 ? "" : "s"}
          </span>
        ) : null}
        {onSave ? (
          <button
            type="button"
            className="text-caption font-medium text-muted hover:text-foreground focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgba(17,17,17,0.06)]"
            aria-pressed={saved}
            onClick={onSave}
          >
            {saved ? "Saved" : "Save"}
          </button>
        ) : null}
        <time className="text-caption text-muted">
          {time}
        </time>
        {href ? (
          <Link to={href} className={buttonClassName({ size: "sm", variant: "ghost" })}>
            Read
          </Link>
        ) : null}
      </footer>
    </article>
  );
}

export function DocumentCard({
  title,
  type,
  status,
  access = "available",
}: {
  title: string;
  type: string;
  status: "uploaded" | "public" | "review";
  access?: "available" | "restricted";
}) {
  const statusLabel =
    status === "public" ? "Listed" : status === "review" ? "Review (demo)" : "On this device";
  return (
    <Card className="flex items-center gap-3 p-4">
      {access === "restricted" ? <IconLock className="text-muted" /> : <IconDocument className="text-accent" />}
      <div className="min-w-0 flex-1">
        <p className="text-body-sm font-semibold">{title}</p>
        <p className="text-caption text-muted">{type}</p>
      </div>
      <Badge tone={status === "public" ? "outline" : status === "review" ? "soon" : "muted"}>
        {access === "restricted" ? "Restricted" : statusLabel}
      </Badge>
    </Card>
  );
}

export function NotificationCard({
  title,
  body,
  unread,
  href,
}: {
  title: string;
  body: string;
  unread?: boolean;
  href?: string;
}) {
  return (
    <Card className={unread ? "border-border-strong" : undefined}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-body-sm font-semibold">{title}</p>
          <p className="mt-1 text-caption text-muted">{body}</p>
        </div>
        {unread ? <Badge>New</Badge> : <span className="text-caption text-muted">Read</span>}
      </div>
      {href ? (
        <Link to={href} className={buttonClassName({ variant: "outline", size: "sm", className: "mt-4" })}>
          Open
        </Link>
      ) : null}
    </Card>
  );
}
