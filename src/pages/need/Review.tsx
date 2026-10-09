import { useEffect, useState, type ReactNode } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/controls";
import { IconCheck, IconClock, IconEdit, IconImage, IconMapPin, IconWallet } from "@/components/ui/icons";
import { Dialog } from "@/components/ui/overlays";
import { JOIN_ROUTE } from "@/components/city/CityShell";
import { handleIssue, isHandleAvailable } from "@/lib/accounts";
import { useCitySession } from "@/lib/citySession";
import { claimOnboardingHandle } from "@/lib/onboarding";
import { CX_BUDGET_BANDS } from "@/lib/cxProjectStore";
import {
  NEED_BUDGET_PATH,
  NEED_DESCRIBE_PATH,
  NEED_HOME_PATH,
  NEED_LOCATION_PATH,
  NEED_MEDIA_PATH,
  NEED_TIMING_PATH,
  PROJECTS_PATH,
} from "@/lib/cxRoutes";
import { readNeedWork } from "@/lib/needWork";
import { NEED_START_OPTIONS, type NeedStart } from "./Timing";
import { CategoryMark, OpportunityAction, OpportunityFrame, timingLabel, opportunityTitleClass } from "./OpportunityChrome";
import { publishResidentialOpportunity } from "./Publish";

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
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#DE7C40]/15 text-[#DE7C40]">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-muted">{label}</p>
        <p className="mt-0.5 whitespace-pre-wrap text-body text-foreground">{value}</p>
      </div>
      <Link to={to} className="shrink-0 text-body-sm font-medium text-accent hover:text-accent-hover">
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
  const [claimOpen, setClaimOpen] = useState(false);
  const [claimedHandle, setClaimedHandle] = useState("");
  const categories = work.categories.filter((item) => item.trim());

  if (categories.length === 0) return <Navigate to={NEED_HOME_PATH} replace />;
  if (!work.city.trim()) return <Navigate to={NEED_LOCATION_PATH} replace />;
  if (!NEED_START_OPTIONS.includes(work.timing as NeedStart)) return <Navigate to={NEED_TIMING_PATH} replace />;
  if (!(CX_BUDGET_BANDS as readonly string[]).includes(work.budget)) return <Navigate to={NEED_BUDGET_PATH} replace />;

  const place = [work.city.trim(), work.postalCode.trim()].filter(Boolean).join(" · ");
  const photos = work.photos.length > 0 ? `${work.photos.length} photo${work.photos.length === 1 ? "" : "s"}` : "None";

  function makeVisible() {
    const handle = claimedHandle || session.handle;
    try {
      publishResidentialOpportunity(handle);
      navigate(PROJECTS_PATH);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not publish this project.");
    }
  }

  function publish() {
    if (!session.signedIn || !session.handle) {
      navigate(`${JOIN_ROUTE}?from=project`);
      return;
    }
    setClaimOpen(true);
  }

  return (
    <OpportunityFrame
      step={8}
      category={categories[0]}
      backTo={NEED_BUDGET_PATH}
      action={
        claimedHandle ? (
          <OpportunityAction onClick={makeVisible}>Make it visible to the contractors</OpportunityAction>
        ) : (
          <OpportunityAction onClick={publish}>Publish project</OpportunityAction>
        )
      }
    >
      <h1 className={opportunityTitleClass}>
        Check your project
      </h1>
      <p className="mt-3 text-body leading-relaxed text-muted">
        This is what contractors will see. Tap any line to change it.
      </p>
      <div className="mt-6 rounded-lg border border-border bg-surface">
        <CheckRow
          icon={<CategoryMark category={categories[0]} />}
          label="Project"
          value={categories.join(", ")}
          to={`${NEED_HOME_PATH}?return=review`}
        />
        <CheckRow
          icon={<IconEdit className="h-5 w-5" />}
          label="Details"
          value={work.description.trim() || "None"}
          to={`${NEED_DESCRIBE_PATH}?return=review`}
        />
        <CheckRow
          icon={<IconImage className="h-5 w-5" />}
          label="Photos"
          value={photos}
          to={`${NEED_MEDIA_PATH}?return=review`}
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
          to={`${NEED_TIMING_PATH}?return=review`}
        />
        <CheckRow
          icon={<IconWallet className="h-5 w-5" />}
          label="Budget"
          value={work.budget}
          to={`${NEED_BUDGET_PATH}?return=review`}
        />
      </div>
      <div className="mt-4 rounded-lg border border-border bg-surface px-4 py-4 text-body-sm leading-relaxed text-muted">
        <span className="font-medium text-foreground">Your details stay private.</span> Your project card is public: your
        first name, your town and these answers. Never your surname, address, email or phone, until you choose to
        connect.
      </div>
      {session.signedIn ? null : (
        <p className="mt-4 text-body text-foreground">To publish your project, enter your details.</p>
      )}
      {error ? <p className="mt-3 text-body-sm text-destructive">{error}</p> : null}
      <ClaimHandleDialog
        open={claimOpen}
        currentHandle={session.handle}
        onClose={() => setClaimOpen(false)}
        onClaimed={(handle) => setClaimedHandle(handle)}
      />
    </OpportunityFrame>
  );
}

function ClaimHandleDialog({
  open,
  currentHandle,
  onClose,
  onClaimed,
}: {
  open: boolean;
  currentHandle: string;
  onClose: () => void;
  onClaimed: (handle: string) => void;
}) {
  const { signIn, signOut } = useCitySession();
  const [handleValue, setHandleValue] = useState(currentHandle);
  const [handleError, setHandleError] = useState("");
  const [available, setAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    if (open) {
      setHandleValue(currentHandle);
      setHandleError("");
    }
  }, [open, currentHandle]);

  useEffect(() => {
    const clean = handleValue.trim().toLowerCase().replace(/^@/, "");
    if (handleIssue(clean)) {
      setAvailable(null);
      return;
    }
    const timer = window.setTimeout(() => setAvailable(isHandleAvailable(clean, currentHandle)), 200);
    return () => window.clearTimeout(timer);
  }, [handleValue, currentHandle]);

  const clean = handleValue.trim().toLowerCase().replace(/^@/, "");
  const wellFormed = !handleIssue(clean);

  function claim() {
    const result = claimOnboardingHandle(currentHandle, handleValue);
    if (!result.ok) {
      setHandleError(result.error);
      setAvailable(false);
      return;
    }
    if (result.handle !== currentHandle) signIn(result.handle);
    onClose();
    onClaimed(result.handle);
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Claim your @handle"
      footer={
        <div className="flex w-full items-center justify-between gap-4">
          <button type="button" onClick={() => { signOut(); onClose(); }} className="text-body font-medium text-muted hover:text-foreground">
            Sign out
          </button>
          <Button type="button" size="lg" className="rounded-lg px-8" disabled={!wellFormed || available === false} onClick={claim}>
            Claim handle
          </Button>
        </div>
      }
    >
      <p className="text-body leading-relaxed text-muted">
        This is your identity across THE CITY OF VAEL — every district. Your shareable profile lives at{" "}
        <span className="font-medium text-accent">/@{clean || "handle"}</span>.
      </p>
      <div className="relative mt-5">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted">@</span>
        <Input
          id="claim-handle"
          className="pl-8 pr-11"
          autoComplete="username"
          value={handleValue}
          onChange={(event) => {
            setHandleValue(event.target.value.replace(/^@/, ""));
            setHandleError("");
          }}
        />
        {wellFormed && available === true ? (
          <IconCheck className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-success" />
        ) : null}
      </div>
      {handleError ? <p className="mt-2 text-body-sm text-destructive">{handleError}</p> : null}
      {!handleError && wellFormed && available === true ? <p className="mt-2 text-body-sm text-success">Available.</p> : null}
      {!handleError && wellFormed && available === false ? <p className="mt-2 text-body-sm text-destructive">That handle is taken.</p> : null}
    </Dialog>
  );
}
