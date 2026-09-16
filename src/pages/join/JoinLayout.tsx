import type { ReactNode } from "react";
import { Link, Navigate, Outlet, useLocation, useOutletContext } from "react-router-dom";
import { cn } from "@/lib/cn";
import { useCitySession } from "@/lib/citySession";
import {
  ONBOARDING_PATH,
  ONBOARDING_STEPS,
  onboardingComplete,
  onboardingRoute,
  onboardingStep,
  onboardingStepIndex,
  pathToOnboardingStep,
} from "@/lib/onboarding";
import { PRODUCT_HOME } from "@/lib/providerJourney";

export function JoinLayout() {
  const { session } = useCitySession();
  const location = useLocation();
  const visiting = pathToOnboardingStep(location.pathname) ?? "Sign Up";

  if (session.signedIn && onboardingComplete(session.handle)) {
    return <Navigate to={PRODUCT_HOME} replace />;
  }

  if (!session.signedIn && visiting !== "Sign Up") {
    return <Navigate to="/join" replace />;
  }

  if (session.signedIn && visiting === "Sign Up") {
    return <Navigate to={onboardingRoute(session.handle)} replace />;
  }

  if (session.signedIn && visiting !== "Sign Up") {
    const allowed = onboardingStep(session.handle);
    if (onboardingStepIndex(visiting) > onboardingStepIndex(allowed)) {
      return <Navigate to={onboardingRoute(session.handle)} replace />;
    }
  }

  if (visiting === "Sign Up") {
    return (
      <AuthSplitScreen>
        <Outlet />
      </AuthSplitScreen>
    );
  }

  // "Sign Up" can't be revisited once signed in (JoinLayout redirects it
  // straight back forward above), so it's never a valid Previous target.
  const stepIndex = onboardingStepIndex(visiting);
  const candidatePrevious = stepIndex > 0 ? ONBOARDING_STEPS[stepIndex - 1] : null;
  const previousStep = candidatePrevious && candidatePrevious !== "Sign Up" ? candidatePrevious : null;

  return (
    <div
      data-surface="site"
      className="join-flow relative isolate flex flex-1 flex-col overflow-hidden bg-background text-foreground"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 right-[-12%] h-[42rem] w-[42rem] rounded-full bg-[#FFC555]/30 blur-[130px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-[-15%] right-[6%] h-[30rem] w-[30rem] rounded-full bg-[#CA8A04]/20 blur-[120px]"
      />
      <div className="site-container relative flex min-h-[calc(100vh-var(--space-nav,4.5rem))] items-start justify-center pb-14 pt-10 md:pb-24 md:pt-14">
        <div className="flex w-full min-h-[38rem] max-w-2xl flex-col rounded-[1.75rem] border border-border bg-surface p-8 shadow-[0_30px_80px_rgba(11,12,12,0.14)] sm:p-10 md:min-h-[46rem] md:p-12">
          <div className="flex flex-1 flex-col">
            <Outlet context={previousStep ? ONBOARDING_PATH[previousStep] : null} />
          </div>
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
      data-surface="site"
      className="join-flow relative isolate flex flex-1 flex-col overflow-hidden bg-background text-foreground"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 right-[-12%] h-[42rem] w-[42rem] rounded-full bg-[#FFC555]/30 blur-[130px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-[-15%] right-[6%] h-[30rem] w-[30rem] rounded-full bg-[#CA8A04]/20 blur-[120px]"
      />
      <div className="site-container relative flex flex-1 items-center py-10 md:py-16">
        <div className="grid w-full items-center gap-12 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
          <SignUpIntro />
          <div className="w-full rounded-[1.75rem] border border-border bg-surface p-8 shadow-[0_30px_80px_rgba(11,12,12,0.14)] sm:p-10 md:p-12 lg:ml-auto lg:max-w-xl">
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
      <span className="inline-flex items-center gap-2 rounded-full border border-[#0B0C0C]/10 bg-[#0B0C0C] px-4 py-1.5 text-[0.75rem] font-medium uppercase tracking-[0.14em] text-[#FFC555]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#FFC555]" aria-hidden />
        Welcome to VAEL
      </span>
      <h1 className="hero-display mt-6 font-normal text-foreground">
        Find work with the <span className="text-[#FFC555]">right fit.</span>
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
          className="rounded-full border border-[#CA8A04]/25 bg-[#FFC555]/15 px-3 py-1 text-body-sm text-[#8A6D00]"
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
    <div className="rounded-2xl border border-border bg-surface p-6 sm:p-7">
      <div className="flex items-start gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-tertiary text-muted">
          {icon}
        </span>
        <div className="min-w-0 flex-1 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-body font-medium text-foreground">{title}</h3>
            {badge ? (
              <span className="inline-flex items-center rounded-full bg-[#FFC555]/20 px-2.5 py-0.5 text-[0.6875rem] font-bold uppercase tracking-wide text-[#8A6D00]">
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
          "font-sans text-[clamp(1.875rem,3.4vw,2.75rem)] font-medium leading-[1.15] tracking-[-0.025em] text-foreground",
          eyebrow && "mt-5",
        )}
      >
        {title}
      </h1>
      {lede ? (
        <p className="mt-3 font-sans text-[1.0625rem] leading-[1.55] text-muted">{lede}</p>
      ) : null}
    </header>
  );
}
