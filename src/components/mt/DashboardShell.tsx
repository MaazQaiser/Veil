import { createContext, useContext, type ReactNode } from "react";
import { Outlet } from "react-router-dom";
import { CityPage } from "@/components/city/CityShell";
import { cn } from "@/lib/cn";
import { isOpportunitiesOnly } from "@/lib/onboarding";
import { useVael } from "@/lib/vaelCore";
import { visibilityKindFromListing } from "@/lib/visibilityPlans";
import type { VaelSide } from "@/lib/vaelStore";

export function dashboardSideFromListing(latestListing: { side: VaelSide; expiresAt: string } | null | undefined): VaelSide {
  const kind = visibilityKindFromListing(latestListing);
  const vaeledOut =
    kind === "out" || ((kind === "in" || kind === "expiring") && latestListing?.side === "out");
  return vaeledOut ? "out" : "in";
}

const InShellContext = createContext(false);

/** Route-level wrapper: gives a whole group of pages the dashboard sidebar. Pages that already use the shell are not wrapped twice. */
export function DashboardLayout() {
  return (
    <DashboardShell>
      <Outlet />
    </DashboardShell>
  );
}

/** Same signed-in chrome as Home / Matches so In and Out dashboards stay one product. */
export function DashboardShell({
  children,
  contentClassName,
  sidebar = true,
}: {
  children: ReactNode;
  contentClassName?: string;
  /** False for pages that rely on the top bar alone, like Opportunities. */
  sidebar?: boolean;
}) {
  const inShell = useContext(InShellContext);
  const { handle, signedIn } = useVael();

  if (inShell) return <>{children}</>;

  if (!signedIn) {
    return (
      <CityPage>
        <div className="space-y-6">{children}</div>
      </CityPage>
    );
  }

  if (!sidebar || isOpportunitiesOnly(handle)) {
    return (
      <CityPage width="wide" className="py-8 md:py-10">
        <InShellContext.Provider value>
          <div className="space-y-6">{children}</div>
        </InShellContext.Provider>
      </CityPage>
    );
  }

  return (
    <CityPage width="full">
      <InShellContext.Provider value>
      <div className="mx-auto flex w-full max-w-[84rem] items-start">
        <div
          className={cn(
            "min-h-[calc(100dvh-var(--space-nav,4.5rem))] min-w-0 flex-1 space-y-6 px-4 pb-8 pt-4 sm:px-8 sm:pb-10 sm:pt-6 lg:px-10",
            contentClassName,
          )}
        >
          {children}
        </div>
      </div>
      </InShellContext.Provider>
    </CityPage>
  );
}
