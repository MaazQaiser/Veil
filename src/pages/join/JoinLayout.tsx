import type { ReactNode } from "react";
import { Link, Navigate, Outlet, useLocation, useOutletContext } from "react-router-dom";
import { cn } from "@/lib/cn";
import { useCitySession } from "@/lib/citySession";
import {
  ONBOARDING_PATH,
  ONBOARDING_STEPS,
  getOnboardingDraft,
  isNeedIntent,
  onboardingComplete,
  onboardingRoute,
  onboardingStep,
  onboardingStepIndex,
  pathToOnboardingStep,
  signedInLanding,
  vaelOutPrevious,
  vaelOutResume,
  vaelOutVisit,
} from "@/lib/onboarding";

export function JoinLayout() {
  const { session } = useCitySession();
  const location = useLocation();
  const outVisit = vaelOutVisit(location.pathname);
  const onOutPath = outVisit !== null;
  const outStep = outVisit && outVisit !== "index" && outVisit !== "invalid" ? outVisit : null;
  const visiting = pathToOnboardingStep(location.pathname) ?? "Sign Up";
  const draft = session.handle ? getOnboardingDraft(session.handle) : undefined;
  const outInProgress = draft?.intent === "out" && Boolean(draft.outStep && draft.outStep !== "submitted");
  const outOpen = outInProgress || (draft?.intent === "out" && !onboardingComplete(session.handle));
  const publishingProject = new URLSearchParams(location.search).get("from") === "project";

  if (session.signedIn && onboardingComplete(session.handle) && !outInProgress && !publishingProject) {
    return <Navigate to={signedInLanding(session.handle)} replace />;
  }

  if (session.signedIn && outOpen && !outStep) {
    return <Navigate to={vaelOutResume(draft)} replace />;
  }

  if (!session.signedIn && onOutPath) {
    return <Navigate to="/join?entry=out" replace />;
  }

  if (!session.signedIn && visiting !== "Sign Up") {
    return <Navigate to="/join" replace />;
  }

  if (session.signedIn && visiting === "Sign Up" && !onOutPath && !publishingProject) {
    return <Navigate to={onboardingRoute(session.handle)} replace />;
  }

  if (session.signedIn && outStep && draft?.intent !== "out") {
    return <Navigate to={onboardingRoute(session.handle)} replace />;
  }

  if (session.signedIn && !onOutPath && visiting !== "Sign Up") {
    if (isNeedIntent(draft)) {
      if (visiting !== "Need" && visiting !== "Intent") {
        return <Navigate to={onboardingRoute(session.handle)} replace />;
      }
    } else if (!outOpen) {
      const allowed = onboardingStep(session.handle);
      if (allowed !== "Need" && visiting !== "Need" && onboardingStepIndex(visiting) > onboardingStepIndex(allowed)) {
        return <Navigate to={onboardingRoute(session.handle)} replace />;
      }
    }
  }

  if (visiting === "Sign Up" && !onOutPath) {
    return (
      <AuthSplitScreen>
        <Outlet />
      </AuthSplitScreen>
    );
  }

  const previousPath = outStep
    ? vaelOutPrevious(outStep)
    : visiting === "Need"
      ? ONBOARDING_PATH.Intent
      : visiting === "Intent"
        ? null
        : (() => {
            const stepIndex = onboardingStepIndex(visiting);
            const candidatePrevious = stepIndex > 0 ? ONBOARDING_STEPS[stepIndex - 1] : null;
            if (!candidatePrevious || candidatePrevious === "Sign Up") return null;
            return ONBOARDING_PATH[candidatePrevious];
          })();

  return (
    <div
      data-surface="site-dark"
      className="join-flow wizard-flow relative isolate flex flex-col bg-background text-foreground"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 right-[-12%] h-[42rem] w-[42rem] rounded-full bg-[#DE7C40]/20 blur-[130px]" />
        <div className="absolute bottom-[-15%] right-[6%] h-[30rem] w-[30rem] rounded-full bg-[#DE7C40]/10 blur-[120px]" />
      </div>
      <div className="site-container relative pb-28 pt-10 md:pb-32 md:pt-14">
        <div className={cn("mx-auto w-full", visiting === "Intent" || visiting === "Need" ? "max-w-4xl" : "max-w-2xl")}>
          <Outlet context={previousPath} />
        </div>
      </div>
    </div>
  );
}

/**
 * Full-bleed split screen shared by Sign Up and Sign In: VAEL brand panel on
 * the left, a floating form card (passed as children) on the right.
 */
export function AuthSplitScreen({ children }: { children: ReactNode }) {
  return (
    <div
      data-surface="site-dark"
      className="join-flow auth-flow relative isolate flex flex-1 flex-col bg-background text-foreground"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 right-[-12%] h-[42rem] w-[42rem] rounded-full bg-[#DE7C40]/20 blur-[130px]" />
        <div className="absolute bottom-[-15%] right-[6%] h-[30rem] w-[30rem] rounded-full bg-[#DE7C40]/10 blur-[120px]" />
      </div>
      <div className="site-container relative flex flex-1 items-center py-10 md:py-16">
        <div className="grid w-full items-center gap-12 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
          <SignUpIntro />
          <div className="w-full rounded-lg border border-border bg-surface p-8 sm:p-10 md:p-12 lg:ml-auto lg:max-w-xl">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

const SIGN_UP_STATS = [
  { value: "5", label: "Districts" },
  { value: "847", label: "Available today" },
  { value: "18/hr", label: "Handshakes made" },
] as const;

function SignUpIntro() {
  return (
    <div className="max-w-xl">
      <span className="inline-flex items-center gap-2 rounded-lg border border-[#DE7C40]/60 bg-[#141414] px-4 py-1.5 text-[0.75rem] font-medium uppercase tracking-[0.14em] text-[#DE7C40]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#DE7C40]" aria-hidden />
        Welcome to VAEL
      </span>
      <h1 className="hero-display mt-6 font-normal text-foreground">
        Find work with the <span className="text-[#DE7C40]">right fit.</span>
      </h1>
      <p className="hero-lede mt-4 max-w-md leading-normal text-muted">
        Your definition of fit is the only one that matters. VAEL matches people and businesses on
        real-time availability, not keywords.
      </p>

      <dl className="mt-10 flex flex-wrap gap-x-10 gap-y-6 border-t border-border pt-8">
        {SIGN_UP_STATS.map((stat) => (
          <div key={stat.label}>
            <dd className="font-display text-[2rem] font-medium leading-none tracking-tight text-foreground">
              {stat.value}
            </dd>
            <dt className="mt-2 text-[0.75rem] uppercase tracking-[0.03em] text-muted">{stat.label}</dt>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function VaelMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <circle cx="12" cy="12" r="11" stroke="#FACC15" strokeWidth="1.25" opacity="0.6" />
      <path
        d="M7 8.5L11.6 16 12.4 16 17 8.5"
        stroke="#FACC15"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CardChips({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <li
          key={item}
          className="rounded-lg border border-[#DE7C40]/40 bg-[#DE7C40]/15 px-3 py-1 text-body-sm text-[#F2BA8B]"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

export function JoinFieldCard({
  icon,
  title,
  badge,
  hint,
  children,
}: {
  icon: ReactNode;
  title: string;
  badge?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-6 sm:p-7">
      <div className="flex items-start gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-tertiary text-muted">
          {icon}
        </span>
        <div className="min-w-0 flex-1 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-body font-medium text-foreground">{title}</h3>
            {badge ? (
              <span className="inline-flex items-center rounded-lg bg-[#DE7C40]/20 px-2.5 py-0.5 text-[0.6875rem] font-bold uppercase tracking-wide text-[#F2BA8B]">
                {badge}
              </span>
            ) : null}
          </div>
          {hint ? <p className="mt-1 text-body-sm text-muted">{hint}</p> : null}
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </div>
  );
}

/**
 * Sticky bottom action bar for the onboarding wizard: Back on the left
 * (resolved from JoinLayout's Outlet context), the step's own primary
 * action — passed in as children so each page keeps its own form/onClick
 * logic — on the right.
 */
export function JoinFooterBar({ children }: { children: ReactNode }) {
  const backTo = useOutletContext<string | null>();
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur">
      <div className="site-container flex items-center justify-between gap-4 py-4">
        {backTo ? (
          <Link
            to={backTo}
            className="inline-flex shrink-0 items-center gap-2 text-body font-medium text-muted motion-safe:transition-colors motion-safe:duration-200 hover:text-foreground"
          >
            <span aria-hidden>←</span> Back
          </Link>
        ) : (
          <span aria-hidden />
        )}
        <div className="flex shrink-0 items-center gap-3">{children}</div>
      </div>
    </div>
  );
}

export function JoinHead({
  title,
  lede,
  eyebrow = false,
  center = false,
}: {
  title: string;
  lede?: string;
  eyebrow?: boolean;
  center?: boolean;
}) {
  return (
    <header className={cn("max-w-lg", center && "mx-auto max-w-xl text-center")}>
      {eyebrow ? <p className="site-eyebrow">VAEL</p> : null}
      <h1
        className={cn(
          "font-sans text-[clamp(1.5rem,2.6vw,2.25rem)] font-medium tracking-tight text-foreground",
          eyebrow && "mt-5",
        )}
      >
        {title}
      </h1>
      {lede ? <p className="mt-1 text-body-sm text-muted">{lede}</p> : null}
    </header>
  );
}
