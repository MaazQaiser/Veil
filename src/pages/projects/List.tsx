import { useState } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { DashboardShell } from "@/components/mt/DashboardShell";
import { ActionIcon } from "@/components/ui/action-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IconClock, IconClose, IconEdit, IconImage, IconMapPin, IconRefresh, IconVideo, IconWallet } from "@/components/ui/icons";
import { Dialog } from "@/components/ui/overlays";
import { cn } from "@/lib/cn";
import { projectHref } from "@/lib/cxRoutes";
import { CX_LIVE_DAYS, closeCxProject, extendCxProject, respondentCount, type CxProject } from "@/lib/cxProjectStore";
import { stockPhoto } from "@/lib/stockPhotos";
import { formatDate } from "@/lib/time";
import { CategoryMark } from "@/pages/need/OpportunityChrome";

/** Residential workspace inside Contractor Exchange. Not a second dashboard. */
export function ContractorProjectsLayout() {
  return (
    <DashboardShell>
      <Outlet />
    </DashboardShell>
  );
}

type OpportunityStatus = "draft" | "published" | "closing" | "closed";

const STATUS_LABEL: Record<OpportunityStatus, string> = {
  draft: "Draft",
  published: "Live",
  closing: "Closing soon",
  closed: "Closed",
};

function daysLeft(item: CxProject) {
  if (item.status !== "live" || !item.liveUntil) return 0;
  return Math.max(0, Math.ceil((Date.parse(item.liveUntil) - Date.now()) / 86400000));
}

export function opportunityStatus(item: CxProject): OpportunityStatus {
  if (item.status === "draft") return "draft";
  if (item.status === "live") return item.day5Reminded ? "closing" : "published";
  return "closed";
}

export function OpportunityCard({ item }: { item: CxProject }) {
  const navigate = useNavigate();
  const [closeOpen, setCloseOpen] = useState(false);
  const status = opportunityStatus(item);
  const left = daysLeft(item);
  const responses = respondentCount(item.id);
  const live = item.status === "live";
  const ended = status === "closed";
  const fullTime = live && left >= CX_LIVE_DAYS;
  const posted = formatDate(item.publishedAt || item.createdAt);
  const place = [item.city, item.postalCode].filter(Boolean).join(" · ");
  const open = projectHref(item.id);
  const stock = item.photos[0] ? undefined : stockPhoto(item.category);
  const cover = item.photos[0] ?? stock?.src;
  const chips = [
    place ? { icon: IconMapPin, text: place } : null,
    item.timing ? { icon: IconClock, text: item.timing } : null,
    item.budgetBand ? { icon: IconWallet, text: item.budgetBand } : null,
  ].filter((chip): chip is { icon: typeof IconMapPin; text: string } => Boolean(chip));

  return (
    <article className="group/card flex h-full flex-col rounded-2xl border border-border bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.3),0_14px_30px_-16px_rgba(0,0,0,0.6)] motion-safe:transition-all motion-safe:duration-200 hover:-translate-y-0.5 hover:border-accent/40">
      <div className="relative h-36">
        <Link to={open} aria-label={`View ${item.category || "opportunity"}`} className="block h-full overflow-hidden rounded-t-2xl">
          {cover ? (
            <img
              src={cover}
              alt=""
              className={cn(
                "h-full w-full object-cover motion-safe:transition-transform motion-safe:duration-500",
                stock && !stock.exact ? "scale-110 blur-[5px]" : "group-hover/card:scale-105",
              )}
            />
          ) : (
            <div className="relative flex h-full w-full items-center justify-center bg-gradient-to-br from-accent/25 via-accent/[0.07] to-transparent">
              <div
                aria-hidden
                className="absolute inset-0 opacity-40 [background-image:radial-gradient(rgba(238,138,74,0.35)_1px,transparent_1px)] [background-size:16px_16px]"
              />
              <span className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-accent/30 bg-background/60 text-accent shadow-[0_8px_24px_-8px_rgba(238,138,74,0.4)] backdrop-blur-sm [&_svg]:h-8 [&_svg]:w-8">
                <CategoryMark category={item.category} />
              </span>
            </div>
          )}
          {cover ? <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-16 rounded-b-none bg-gradient-to-t from-black/60 to-transparent" /> : null}
        </Link>
        <span className="pointer-events-none absolute left-3 top-3">
          <Badge tone={status === "published" ? "live" : status === "closing" ? "soon" : "default"} className="bg-background/70 backdrop-blur-sm">
            {STATUS_LABEL[status]}
          </Badge>
        </span>
        <div className="absolute right-3 top-3 flex items-center gap-1.5">
          {live ? (
            <>
              <ActionIcon size="sm" tone="overlay" tooltip="above" label="Edit" onClick={() => navigate(`${open}?edit=1`)}>
                <IconEdit className="h-4 w-4" />
              </ActionIcon>
              <ActionIcon
                size="sm"
                tone="overlay"
                tooltip="above"
                label={fullTime ? "Already at the full 7 days" : "Extend 7 days"}
                disabled={fullTime}
                onClick={() => extendCxProject(item.id)}
              >
                <IconRefresh className="h-4 w-4" />
              </ActionIcon>
              <ActionIcon size="sm" tone="overlay" tooltip="above" align="end" label="Close early" onClick={() => setCloseOpen(true)}>
                <IconClose className="h-4 w-4" />
              </ActionIcon>
            </>
          ) : ended ? (
            <ActionIcon size="sm" tone="overlay" tooltip="above" align="end" label="Reopen for 7 days" onClick={() => extendCxProject(item.id)}>
              <IconRefresh className="h-4 w-4" />
            </ActionIcon>
          ) : null}
        </div>
        {stock ? (
          <span className="pointer-events-none absolute bottom-3 left-3 inline-flex items-center rounded-full bg-black/60 px-2.5 py-1 text-caption font-medium leading-none text-white/80 backdrop-blur-sm">
            Sample photo
          </span>
        ) : null}
        {item.video || item.photos.length > 1 ? (
          <span className="pointer-events-none absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-caption font-medium leading-none text-white backdrop-blur-sm">
            {item.video ? <IconVideo className="h-3.5 w-3.5" /> : <IconImage className="h-3.5 w-3.5" />}
            {item.video ? "Video" : `${item.photos.length} photos`}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-accent/25 bg-accent/10 text-accent">
            <CategoryMark category={item.category} />
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-body-lg font-semibold leading-snug text-foreground">{item.category || "Opportunity"}</h3>
            <p className="mt-0.5 truncate text-caption text-muted">
              Posted {posted}
              {responses > 0 ? ` · ${responses} interested` : ""}
            </p>
          </div>
        </div>

        {item.description ? <p className="mt-4 line-clamp-2 text-body-sm leading-6 text-foreground/80">{item.description}</p> : null}

        {chips.length > 0 ? (
          <ul className="mt-4 flex flex-wrap gap-2">
            {chips.map(({ icon: Icon, text }) => (
              <li
                key={text}
                className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-border-subtle bg-surface-muted/60 px-2.5 py-1 text-caption text-muted"
              >
                <Icon className="h-3.5 w-3.5 shrink-0 text-accent" />
                <span className="truncate">{text}</span>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-auto pt-6">
          <div className="flex items-center justify-between gap-3 border-t border-border-subtle pt-4">
            <Link to={open} className="text-body-sm font-semibold text-accent underline-offset-4 hover:underline">
              View opportunity <span aria-hidden>→</span>
            </Link>
            {live ? (
              <span className="inline-flex items-center gap-1.5 text-caption text-muted">
                <IconClock className="h-3.5 w-3.5" />
                {left} {left === 1 ? "day" : "days"} left
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <Dialog
        open={closeOpen}
        onClose={() => setCloseOpen(false)}
        title="Close this opportunity early?"
        footer={
          <>
            <Button type="button" variant="outline" size="sm" onClick={() => setCloseOpen(false)}>
              Keep it open
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                closeCxProject(item.id);
                setCloseOpen(false);
              }}
            >
              Close early
            </Button>
          </>
        }
      >
        <p className="text-body-sm text-muted">
          New contractors will not be able to respond. Open Handshakes stay available, and you can reopen it for 7 days later.
        </p>
      </Dialog>
    </article>
  );
}
