import { useEffect, useState, type ReactNode, type SVGProps } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { CityPage } from "@/components/city/CityShell";
import { useJoinedDistricts } from "@/components/mt/DistrictsRow";
import { DashboardShell } from "@/components/mt/DashboardShell";
import { CATEGORY_ICON } from "@/components/opportunities/OpportunityBoard";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClassName } from "@/components/ui/button";
import { Textarea } from "@/components/ui/controls";
import {
  IconCalendar,
  IconCheck,
  IconChevronLeft,
  IconClock,
  IconLock,
  IconMessageCircle,
  IconMapPin,
  IconWallet,
} from "@/components/ui/icons";
import { Dialog } from "@/components/ui/overlays";
import { useCitySession } from "@/lib/citySession";
import { cn } from "@/lib/cn";
import {
  askProjectQuestion,
  contractorInterested,
  contractorStanding,
  getCxProject,
  ineligibleReason,
  interestBetween,
  publicProjectCard,
  questionsForProject,
} from "@/lib/cxProjectStore";
import { BROWSE_OPPORTUNITIES_PATH, projectHandshakeHref, projectHref } from "@/lib/cxRoutes";
import { MARKETING_PROJECTS, type MarketingProjectIcon } from "@/lib/marketingProjects";
import { relativeTime } from "@/lib/time";
import { useCxProjects } from "@/lib/useCxProjects";
import { useVael } from "@/lib/vaelCore";
import { CategoryGlyph } from "@/pages/city/Projects";

const JOIN_PATH = "/join/contractor-exchange";
const SAMPLE_INTEREST_KEY = "vael_sample_interest_v1";
const REPORTS_KEY = "vael_opportunity_reports_v1";
const REPORT_REASONS = ["Not a real home project", "Contains personal details", "Looks like spam or a scam", "Something else"];

type IconProps = SVGProps<SVGSVGElement>;

function GlyphSvg({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="h-[1.1em] w-[1.1em] shrink-0"
      {...props}
    >
      {children}
    </svg>
  );
}

const IconHand = (props: IconProps) => (
  <GlyphSvg {...props}>
    <path d="M18 11V6a2 2 0 0 0-4 0" />
    <path d="M14 10V4a2 2 0 0 0-4 0v2" />
    <path d="M10 10.5V6a2 2 0 0 0-4 0v8" />
    <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
  </GlyphSvg>
);
const IconShield = (props: IconProps) => (
  <GlyphSvg {...props}>
    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    <path d="m9 12 2 2 4-4" />
  </GlyphSvg>
);
const IconFlag = (props: IconProps) => (
  <GlyphSvg {...props}>
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
    <path d="M4 22v-7" />
  </GlyphSvg>
);
const IconExpand = (props: IconProps) => (
  <GlyphSvg {...props}>
    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
  </GlyphSvg>
);
const IconPlay = (props: IconProps) => (
  <GlyphSvg {...props} fill="currentColor" stroke="none">
    <path d="M7 4.5v15a1 1 0 0 0 1.5.86l12.5-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5z" />
  </GlyphSvg>
);

/** What the page shows, whether the opportunity is a real posting or one of the website's sample cards. */
type View = {
  id: string;
  category: string;
  icon: MarketingProjectIcon;
  poster: string;
  posted: string;
  description: string;
  photos: string[];
  video: string;
  city: string;
  timing: string;
  budget: string;
  daysLeft: number;
  expires: string;
  sample: boolean;
};

function expiryLabel(daysLeft: number, at: number) {
  const date = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(at);
  return `In ${daysLeft} ${daysLeft === 1 ? "day" : "days"} · ${date}`;
}

function readList(key: string): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(key) ?? "[]");
    return Array.isArray(raw) ? raw.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function writeList(key: string, list: string[]) {
  try {
    localStorage.setItem(key, JSON.stringify(list));
  } catch {
    /* the demo keeps working without storage */
  }
}

function Stat({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-xl border border-border-subtle bg-white/[0.02] px-3.5 py-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">{icon}</span>
      <div className="min-w-0">
        <dt className="text-caption leading-none text-muted">{label}</dt>
        <dd className="mt-1.5 truncate text-body font-semibold leading-none text-foreground">{children}</dd>
      </div>
    </div>
  );
}

type Media = { kind: "photo" | "video"; src: string };

/** A stand-in photo for the trade, used only to fill the mosaic when a posting has fewer photos than tiles. */
const STOCK: Partial<Record<MarketingProjectIcon, string>> = {
  plumbing: "/projects/plumbing.jpg",
  construction: "/projects/construction.jpg",
  doors: "/projects/doors.jpg",
  roofing: "/projects/roofing.jpg",
  bathroom: "/projects/bathroom.jpg",
  electrical: "/projects/electrical.jpg",
  painting: "/projects/painting.jpg",
  kitchen: "/projects/bathroom.jpg",
};

const FILLER_POSITION = ["left top", "right bottom", "center", "right top"];

/**
 * The photos as a mosaic straight on the page: one large tile and four smaller ones. Real photos are sharp;
 * any tile without a photo shows a blurred version of the first one, so the mosaic always looks full.
 */
function Gallery({ media, locked, icon }: { media: Media[]; locked: boolean; icon: MarketingProjectIcon }) {
  const [viewing, setViewing] = useState<number | null>(null);
  const firstPhoto = media.find((item) => item.kind === "photo")?.src;
  const source = firstPhoto ?? STOCK[icon] ?? "/projects/construction.jpg";
  const slots = Array.from({ length: 5 }, (_, position) => media[position] ?? null);
  const shown = viewing === null ? undefined : media[viewing];

  return (
    <>
      <div className="grid gap-3 md:h-[clamp(17rem,40dvh,30rem)] md:grid-cols-[2fr_1fr_1fr] md:grid-rows-2">
        {slots.map((item, position) => {
          const real = Boolean(item) && !locked;
          const picture = item?.kind === "photo" ? item.src : source;
          const body = (
            <>
              {item?.kind === "video" && real ? (
                <video src={item.src} preload="metadata" muted className="h-full w-full object-cover" />
              ) : (
                <img
                  src={picture}
                  alt=""
                  style={real ? undefined : { objectPosition: FILLER_POSITION[(position - 1) % FILLER_POSITION.length] }}
                  className={cn(
                    "h-full w-full object-cover motion-safe:transition-transform motion-safe:duration-500",
                    real ? "group-hover:scale-105" : "scale-110 blur-[6px] brightness-90",
                  )}
                />
              )}
              {item?.kind === "video" && real ? (
                <span className="absolute inset-0 flex items-center justify-center bg-black/35">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-primary-foreground shadow-lg">
                    <IconPlay className="h-4 w-4" />
                  </span>
                </span>
              ) : null}
              {position === 0 && !real ? (
                <span className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full bg-black/60 px-4 py-2 text-body-sm font-medium text-white backdrop-blur-md">
                  {locked ? <IconLock className="h-4 w-4" /> : null}
                  {locked ? "Photos are for members" : "Sample photo"}
                </span>
              ) : null}
              {position === 4 && real && media.length > 1 ? (
                <span className="absolute bottom-3 right-3 inline-flex h-9 items-center gap-2 rounded-full bg-black/60 px-3.5 text-caption font-medium text-white backdrop-blur-md">
                  <IconExpand className="h-3.5 w-3.5" />
                  Show all {media.length}
                </span>
              ) : null}
              {position === 0 && real && media.length === 1 && item?.kind === "photo" ? (
                <span className="absolute bottom-3 right-3 inline-flex h-9 items-center gap-2 rounded-full bg-black/60 px-3.5 text-caption font-medium text-white backdrop-blur-md">
                  <IconExpand className="h-3.5 w-3.5" />
                  Enlarge
                </span>
              ) : null}
            </>
          );
          const tile = cn(
            "group relative block overflow-hidden rounded-3xl bg-surface-muted",
            position === 0 ? "h-60 md:row-span-2 md:h-auto" : "hidden md:block",
          );
          return real ? (
            <button
              key={position}
              type="button"
              aria-label={item?.kind === "video" ? "Play video" : `Open photo ${position + 1}`}
              onClick={() => setViewing(position)}
              className={cn(tile, "cursor-zoom-in text-left")}
            >
              {body}
            </button>
          ) : (
            <div key={position} className={tile}>
              {body}
            </div>
          );
        })}
      </div>

      <Dialog open={viewing !== null} onClose={() => setViewing(null)} title="Project photos" className="w-[min(64rem,calc(100%-2rem))]">
        {shown ? (
          <div>
            {shown.kind === "photo" ? (
              <img src={shown.src} alt="Project photo" className="max-h-[70dvh] w-full rounded-lg object-contain" />
            ) : (
              <video key={shown.src} src={shown.src} controls autoPlay className="max-h-[70dvh] w-full rounded-lg bg-black" />
            )}
            {media.length > 1 ? (
              <div className="mt-4 flex items-center justify-between">
                <Button type="button" variant="outline" onClick={() => setViewing((viewing! + media.length - 1) % media.length)}>
                  Previous
                </Button>
                <span className="text-body-sm text-muted">
                  {viewing! + 1} of {media.length}
                </span>
                <Button type="button" variant="outline" onClick={() => setViewing((viewing! + 1) % media.length)}>
                  Next
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}
      </Dialog>
    </>
  );
}

type QuestionRow = { id: string; body: string; answer?: string };

const SAMPLE_QUESTIONS_KEY = "vael_sample_questions_v1";

function readSampleQuestions(id: string): QuestionRow[] {
  try {
    const all = JSON.parse(localStorage.getItem(SAMPLE_QUESTIONS_KEY) ?? "{}");
    return Array.isArray(all?.[id]) ? all[id] : [];
  } catch {
    return [];
  }
}

function writeSampleQuestions(id: string, rows: QuestionRow[]) {
  try {
    const all = JSON.parse(localStorage.getItem(SAMPLE_QUESTIONS_KEY) ?? "{}");
    localStorage.setItem(SAMPLE_QUESTIONS_KEY, JSON.stringify({ ...all, [id]: rows }));
  } catch {
    /* the demo keeps working without storage */
  }
}

/** The public questions on an opportunity. Everyone can read them; members can ask. */
function QuestionsCard({ items, canAsk, onAsk }: { items: QuestionRow[]; canAsk: boolean; onAsk: (body: string) => void }) {
  const [draft, setDraft] = useState("");
  return (
    <section className="rounded-2xl border border-border bg-surface p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-body-lg font-semibold text-foreground">
          <IconMessageCircle className="h-5 w-5 text-accent" />
          Questions
          {items.length > 0 ? <span className="rounded-full bg-accent/15 px-2 py-0.5 text-caption font-semibold text-accent">{items.length}</span> : null}
        </h2>
        <p className="text-caption text-muted">Public, not a private message</p>
      </div>

      {items.length === 0 ? (
        <p className="mt-3 text-body-sm text-muted">Nobody has asked anything yet.</p>
      ) : (
        <ul className="mt-4 space-y-2.5">
          {items.map((item) => (
            <li key={item.id} className="rounded-xl border border-border-subtle bg-white/[0.02] px-4 py-3 text-body-sm">
              <p className="text-foreground">{item.body}</p>
              {item.answer ? <p className="mt-1.5 border-l-2 border-accent/50 pl-3 text-muted">{item.answer}</p> : null}
            </li>
          ))}
        </ul>
      )}

      {canAsk ? (
        <form
          className="mt-4 flex items-start gap-2.5"
          onSubmit={(event) => {
            event.preventDefault();
            const body = draft.trim();
            if (!body) return;
            onAsk(body);
            setDraft("");
          }}
        >
          <label htmlFor="project-question" className="sr-only">
            Question about this opportunity
          </label>
          <Textarea
            id="project-question"
            rows={1}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Ask a question about this opportunity"
            className="min-h-11 flex-1"
          />
          <Button type="submit" disabled={!draft.trim()} className="h-11 shrink-0 rounded-full">
            Ask
          </Button>
        </form>
      ) : (
        <p className="mt-4 flex items-center gap-2 text-body-sm text-muted">
          <IconLock className="h-3.5 w-3.5 text-accent" />
          Make your profile to ask a question.
        </p>
      )}
    </section>
  );
}

function ReportDialog({ id, open, onClose }: { id: string; open: boolean; onClose: () => void }) {
  const [reason, setReason] = useState("");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (open) {
      setReason("");
      setSent(false);
    }
  }, [open]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Report this opportunity"
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
                writeList(REPORTS_KEY, [...readList(REPORTS_KEY), `${id}: ${reason}`]);
                setSent(true);
              }}
            >
              Send report
            </Button>
          </>
        )
      }
    >
      {sent ? (
        <p className="text-body text-foreground">Thanks. We'll look at this opportunity.</p>
      ) : (
        <fieldset className="space-y-2">
          <legend className="mb-3 text-body-sm text-muted">What's wrong with it?</legend>
          {REPORT_REASONS.map((item) => (
            <label
              key={item}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-body-sm motion-safe:transition-colors",
                reason === item ? "border-accent/60 bg-accent/10 text-foreground" : "border-border text-muted hover:text-foreground",
              )}
            >
              <input type="radio" name="report-reason" checked={reason === item} onChange={() => setReason(item)} className="accent-[#EE8A4A]" />
              {item}
            </label>
          ))}
        </fieldset>
      )}
    </Dialog>
  );
}

/**
 * One live opportunity, seen by a contractor: the photos, what the work is, the details, and one
 * clear way to say "I'm interested". The same page serves the website's sample opportunities.
 */
export function OpportunityDetailPage() {
  useCxProjects();
  const { projectId = "" } = useParams();
  const { session } = useCitySession();
  const { handle, profile, documents } = useVael();
  const mine = handle ? profile(handle) : undefined;
  const joined = useJoinedDistricts(handle, mine, handle ? documents(handle) : []).some(
    (row) => row.district.id === "construction",
  );
  const [error, setError] = useState("");
  const [sampleQuestions, setSampleQuestions] = useState(() => readSampleQuestions(projectId));
  const [reporting, setReporting] = useState(false);
  const [sampleInterested, setSampleInterested] = useState(() => readList(SAMPLE_INTEREST_KEY).includes(projectId));
  const project = getCxProject(projectId);
  const sample = project ? undefined : MARKETING_PROJECTS.find((item) => item.id === projectId);

  if (!session.signedIn) return <Navigate to={`/sign-in?next=/districts/contractor/opportunities/${projectId}`} replace />;
  if (project && project.handle === session.handle) return <Navigate to={projectHref(project.id)} replace />;

  if ((!project || project.status !== "live") && !sample) {
    return (
      <CityPage width="narrow">
        <h1 className="font-sans text-h2 font-medium text-foreground">This opportunity isn't open</h1>
        <p className="mt-2 text-body text-muted">It may have closed, or it isn't on this device.</p>
        <Link to={BROWSE_OPPORTUNITIES_PATH} className={buttonClassName({ className: "mt-6" })}>
          Back to opportunities
        </Link>
      </CityPage>
    );
  }

  let view: View;
  if (project && project.status === "live") {
    const card = publicProjectCard(project);
    const left = project.liveUntil ? Math.max(0, Math.ceil((Date.parse(project.liveUntil) - Date.now()) / 86400000)) : 0;
    view = {
      id: project.id,
      category: card.category || "Opportunity",
      icon: CATEGORY_ICON[card.category] ?? "construction",
      poster: project.firstName,
      posted: card.postedAt ? relativeTime(card.postedAt) || "today" : "",
      description: card.description,
      photos: card.photos,
      video: project.video,
      city: [card.city, card.postalCode].filter(Boolean).join(" · "),
      timing: card.timing,
      budget: card.budgetBand,
      daysLeft: left,
      expires: project.liveUntil ? expiryLabel(left, Date.parse(project.liveUntil)) : "",
      sample: false,
    };
  } else {
    const item = sample!;
    view = {
      id: item.id,
      category: item.category,
      icon: item.icon,
      poster: item.name,
      posted: item.posted.replace(/^Posted\s*/i, ""),
      description: item.description,
      photos: [item.image],
      video: "",
      city: item.city,
      timing: item.timing,
      budget: item.budget,
      daysLeft: item.daysLeft,
      expires: expiryLabel(item.daysLeft, Date.now() + item.daysLeft * 86400000),
      sample: true,
    };
  }

  const standing = project ? contractorStanding(project.id, session.handle) : sampleInterested ? "interested" : "open";
  const interest = project ? interestBetween(project.id, session.handle) : undefined;
  const reason = project && project.status === "live" ? ineligibleReason(project, session.handle) : "";
  const questions = project ? questionsForProject(project.id) : [];
  const media: Media[] = [
    ...view.photos.map((src) => ({ kind: "photo" as const, src })),
    ...(view.video ? [{ kind: "video" as const, src: view.video }] : []),
  ];
  const postedLine = [view.posted ? `Posted ${view.posted}` : "", view.poster ? `by ${view.poster}` : ""].filter(Boolean).join(" ");

  function showInterest() {
    try {
      if (project) contractorInterested(project.id, session.handle);
      else {
        writeList(SAMPLE_INTEREST_KEY, [...readList(SAMPLE_INTEREST_KEY), view.id]);
        setSampleInterested(true);
      }
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not respond.");
    }
  }

  return (
    <DashboardShell sidebar={false}>
      <div className="mx-auto w-full max-w-6xl space-y-4">
        <Link
          to={BROWSE_OPPORTUNITIES_PATH}
          className="inline-flex items-center gap-1.5 text-body-sm font-medium text-muted motion-safe:transition-colors hover:text-foreground"
        >
          <IconChevronLeft className="h-3.5 w-3.5" />
          All opportunities
        </Link>

        <Gallery media={media} locked={!joined} icon={view.icon} />

        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
          <div className="min-w-0 space-y-4">
            <section className="rounded-2xl border border-border bg-surface p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] sm:p-6">
              <header className="flex items-center gap-4">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-accent/30 bg-accent/10 text-accent">
                  <span className="scale-125">
                    <CategoryGlyph icon={view.icon} />
                  </span>
                </span>
                <div className="min-w-0 flex-1">
                  <h1 className="font-sans text-[clamp(1.5rem,2.6vw,2.125rem)] font-semibold leading-none tracking-tight text-foreground">{view.category}</h1>
                  {postedLine ? <p className="mt-2 text-body-sm text-muted">{postedLine}</p> : null}
                </div>
                <Badge tone="live" className="shrink-0">
                  Live
                </Badge>
              </header>
              <dl className="mt-5 grid gap-3 sm:grid-cols-2">
                <Stat icon={<IconMapPin className="h-4 w-4" />} label="Location">
                  {view.city || "Not listed"}
                </Stat>
                <Stat icon={<IconCalendar className="h-4 w-4" />} label="Timeline">
                  {view.timing || "Not listed"}
                </Stat>
                <Stat icon={<IconWallet className="h-4 w-4" />} label="Budget">
                  {view.budget || "Not listed"}
                </Stat>
                <Stat icon={<IconClock className="h-4 w-4" />} label="Listing expires">
                  {view.expires || "Not listed"}
                </Stat>
              </dl>
            </section>

            <section className="rounded-2xl border border-border bg-surface p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] sm:p-6">
              <h2 className="text-body-lg font-semibold text-foreground">Project description</h2>
              {joined ? (
                <p className="mt-2 whitespace-pre-wrap text-body leading-relaxed text-foreground/85">{view.description || "No description."}</p>
              ) : (
                <p className="mt-3 flex items-start gap-3 rounded-xl border border-border-subtle bg-surface-muted p-4 text-body-sm text-muted">
                  <IconLock className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  The description is for members of Contractor Exchange.
                </p>
              )}
            </section>

            <div className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-surface px-5 py-3.5">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <IconShield className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-body-sm font-medium text-foreground">The homeowner's privacy is protected</p>
                  <p className="mt-0.5 text-caption text-muted">Surname, street address, email and phone are never shown.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReporting(true)}
                aria-label="Report this project"
                title="Report this project"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border text-muted motion-safe:transition-colors hover:border-accent/50 hover:text-foreground"
              >
                <IconFlag className="h-4 w-4" />
              </button>
            </div>
          </div>


          <aside className="min-w-0 space-y-4">
            <section className="relative overflow-hidden rounded-2xl border border-accent/35 bg-gradient-to-br from-accent/[0.14] via-surface to-surface p-6 shadow-[0_20px_50px_-24px_rgba(238,138,74,0.45)]">
              <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-accent/20 blur-3xl" />
              <div className="relative">
                {standing === "connected" && interest?.connectionId && joined ? (
                  <>
                    <h2 className="flex items-center gap-2 text-h3 font-semibold text-foreground">
                      <IconCheck className="h-5 w-5 text-success" />
                      You're connected
                    </h2>
                    <p className="mt-1.5 text-body-sm text-muted">You're both interested. A private chat is open.</p>
                    <Link to={projectHandshakeHref(project!.id, interest.connectionId)} className={buttonClassName({ className: "mt-5 w-full rounded-full" })}>
                      Open Handshake
                    </Link>
                  </>
                ) : standing === "interested" && joined ? (
                  <>
                    <h2 className="flex items-center gap-2 text-h3 font-semibold text-foreground">
                      <IconCheck className="h-5 w-5 text-success" />
                      You're interested
                    </h2>
                    <p className="mt-1.5 text-body-sm text-muted">
                      The homeowner can now see your profile. If they're interested too, a private chat opens.
                    </p>
                  </>
                ) : (
                  <>
                    <h2 className="text-h3 font-semibold text-foreground">Want this job?</h2>
                    <p className="mt-1.5 text-body-sm text-muted">Raise your hand. If the homeowner is interested too, a private chat opens.</p>
                    {!joined ? (
                      <Link
                        to={JOIN_PATH}
                        className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-accent px-6 text-button font-bold uppercase tracking-wide text-primary-foreground shadow-[0_10px_28px_-8px_rgba(238,138,74,0.7)] motion-safe:transition-transform hover:-translate-y-0.5"
                      >
                        <IconHand className="h-4 w-4" />
                        Make my profile to respond
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={showInterest}
                        disabled={Boolean(reason)}
                        className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-accent px-6 text-button font-bold uppercase tracking-wide text-primary-foreground shadow-[0_10px_28px_-8px_rgba(238,138,74,0.7)] motion-safe:transition-transform hover:-translate-y-0.5 hover:opacity-95 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
                      >
                        <IconHand className="h-4 w-4" />
                        I'm interested
                      </button>
                    )}
                    {joined && reason ? (
                      <p className="mt-3 text-body-sm text-muted">
                        {reason}{" "}
                        <Link to={JOIN_PATH} className="font-medium text-accent underline-offset-4 hover:underline">
                          Update my profile
                        </Link>
                      </p>
                    ) : null}
                    <p className="mt-4 text-caption leading-relaxed text-muted">
                      By showing interest you agree to communicate professionally and lawfully. VAEL isn't a party to any agreement between users.
                    </p>
                  </>
                )}
                {error ? <p className="mt-3 text-label text-destructive">{error}</p> : null}
              </div>
            </section>


            <QuestionsCard
              items={project ? questions : sampleQuestions}
              canAsk={joined}
              onAsk={(body) => {
                if (project) askProjectQuestion(project.id, session.handle, body);
                else {
                  const next = [...sampleQuestions, { id: `sq_${Date.now()}`, body }];
                  setSampleQuestions(next);
                  writeSampleQuestions(view.id, next);
                }
              }}
            />
          </aside>
        </div>

      </div>
      <ReportDialog id={view.id} open={reporting} onClose={() => setReporting(false)} />
    </DashboardShell>
  );
}
