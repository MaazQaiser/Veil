import { useState, type ReactNode } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Checkbox } from "@/components/ui/choice";
import { IconClock, IconEdit, IconImage, IconInfo, IconLock, IconMapPin, IconWallet } from "@/components/ui/icons";
import { JOIN_ROUTE } from "@/components/city/CityShell";
import { useCitySession } from "@/lib/citySession";
import { CX_BUDGET_BANDS } from "@/lib/cxProjectStore";
import {
  NEED_HOME_PATH,
  NEED_LOCATION_PATH,
  NEED_SAVE_PATH,
  MY_OPPORTUNITIES_PATH,
} from "@/lib/cxRoutes";
import { cn } from "@/lib/cn";
import { clearNeedWork, readNeedWork, saveNeedWork } from "@/lib/needWork";
import { NEED_START_OPTIONS, type NeedStart } from "./Timing";
import { CategoryMark, OpportunityAction, OpportunityFrame, timingLabel, opportunityTitleClass } from "./OpportunityChrome";
import { publishResidentialOpportunity } from "@/lib/publishOpportunity";

function CheckRow({
  icon,
  label,
  value,
  to,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  to: string;
}) {
  return (
    <div className="flex items-center gap-3 border-t border-border px-4 py-4 first:border-t-0">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EE8A4A]/15 text-[#EE8A4A]">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-muted">{label}</p>
        <p className="mt-0.5 whitespace-pre-wrap text-body text-foreground">{value}</p>
      </div>
      <Link
        to={to}
        className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-border px-3 text-caption font-medium text-muted motion-safe:transition-colors hover:border-accent/50 hover:text-accent"
      >
        <IconEdit className="h-3.5 w-3.5" />
        Edit
      </Link>
    </div>
  );
}

export function NeedReviewPage() {
  const navigate = useNavigate();
  const { session } = useCitySession();
  const work = readNeedWork();
  const [error, setError] = useState("");
  const [homeProject, setHomeProject] = useState(work.homeProject);
  const categories = work.categories.filter((item) => item.trim());

  if (categories.length === 0) return <Navigate to={NEED_HOME_PATH} replace />;
  if (!work.city.trim()) return <Navigate to={NEED_LOCATION_PATH} replace />;
  if (!NEED_START_OPTIONS.includes(work.timing as NeedStart)) return <Navigate to={NEED_LOCATION_PATH} replace />;
  if (!(CX_BUDGET_BANDS as readonly string[]).includes(work.budget)) return <Navigate to={NEED_LOCATION_PATH} replace />;

  const place = [work.city.trim(), work.postalCode.trim()].filter(Boolean).join(" · ");
  const media =
    [
      work.photos.length > 0 ? `${work.photos.length} photo${work.photos.length === 1 ? "" : "s"}` : "",
      work.video ? "1 video" : "",
    ]
      .filter(Boolean)
      .join(", ") || "None";

  function publish() {
    if (!homeProject) {
      setError("Confirm this is a home project to continue.");
      return;
    }
    if (!session.signedIn || !session.handle) {
      navigate(`${JOIN_ROUTE}?from=project`);
      return;
    }
    try {
      publishResidentialOpportunity(session.handle);
      clearNeedWork();
      navigate(MY_OPPORTUNITIES_PATH, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not publish this opportunity.");
    }
  }

  return (
    <OpportunityFrame
      step={4}
      category={categories[0]}
      backTo={NEED_SAVE_PATH}
      action={
        <OpportunityAction disabled={!homeProject} onClick={publish}>
          Publish opportunity
        </OpportunityAction>
      }
    >
      <h1 className={opportunityTitleClass}>
        Check your opportunity
      </h1>
      <p className="mt-3 text-body leading-relaxed text-muted">
        Contractors will see all of this except your contact details. Use Edit to change a line.
      </p>
      <div className="mt-6 overflow-hidden rounded-xl border border-border bg-white/[0.02]">
        <CheckRow
          icon={<CategoryMark category={categories[0]} />}
          label="Type of work"
          value={categories.join(", ")}
          to={`${NEED_HOME_PATH}?return=review`}
        />
        <CheckRow
          icon={<IconEdit className="h-5 w-5" />}
          label="Description"
          value={work.description.trim() || "None"}
          to={`${NEED_HOME_PATH}?return=review`}
        />
        <CheckRow
          icon={<IconImage className="h-5 w-5" />}
          label="Photos and video"
          value={media}
          to={`${NEED_HOME_PATH}?return=review`}
        />
        <CheckRow
          icon={<IconMapPin className="h-5 w-5" />}
          label="Where"
          value={place}
          to={`${NEED_LOCATION_PATH}?return=review`}
        />
        <CheckRow
          icon={<IconClock className="h-5 w-5" />}
          label="Start"
          value={timingLabel(work.timing)}
          to={`${NEED_LOCATION_PATH}?return=review`}
        />
        <CheckRow
          icon={<IconWallet className="h-5 w-5" />}
          label="Budget"
          value={work.budget}
          to={`${NEED_LOCATION_PATH}?return=review`}
        />
        <CheckRow
          icon={<IconLock className="h-5 w-5" />}
          label="Your contact · private"
          value={[work.saveEmail, work.savePhone].filter(Boolean).join("\n") || "Not added"}
          to={`${NEED_SAVE_PATH}?return=review`}
        />
      </div>
      <div className="mt-4 rounded-lg border border-border bg-surface px-4 py-4 text-body-sm leading-relaxed text-muted">
        <span className="font-medium text-foreground">Your details stay private.</span> Your opportunity card is public: your
        first name, your town and these answers. Never your surname, address, email or phone, until you choose to
        connect.
      </div>
      <div
        className={cn(
          "mt-4 rounded-lg border px-4 py-4 motion-safe:transition-colors",
          homeProject ? "border-accent/50 bg-accent/[0.06]" : "border-border bg-surface",
        )}
      >
        <Checkbox
          checked={homeProject}
          onChange={(event) => {
            setHomeProject(event.target.checked);
            saveNeedWork({ homeProject: event.target.checked });
            setError("");
          }}
          label={<span className="text-body font-medium">This is a home project, not work I'm subcontracting for a client.</span>}
        />
        <p className="mt-3 flex items-start gap-2 border-t border-border-subtle pt-3 text-caption leading-relaxed text-muted">
          <IconInfo className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
          <span>
            VAEL doesn't check whether your project legally needs a licensed contractor. Check your state's rules before you
            hire. A contractor's profile shows the licenses and documents they've chosen to make public.
          </span>
        </p>
      </div>
      {error ? <p className="mt-3 text-body-sm text-destructive">{error}</p> : null}
    </OpportunityFrame>
  );
}
