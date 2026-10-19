import { createContext, useContext, type ReactNode } from "react";
import { Outlet } from "react-router-dom";
import { CityPage } from "@/components/city/CityShell";
import { DashboardSidebar } from "@/components/mt/DashboardSidebar";
import { cn } from "@/lib/cn";
import { getOnboardingDraft } from "@/lib/onboarding";
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
}: {
  children: ReactNode;
  contentClassName?: string;
}) {
  const inShell = useContext(InShellContext);
  const vael = useVael();
  const { latestListing, myConnections, handle, signedIn, profile, documents } = vael;

  if (inShell) return <>{children}</>;

  if (!signedIn) {
    return <CityPage>{children}</CityPage>;
  }

  const mine = profile(handle);
  const docs = documents(handle);
  const incoming = myConnections.filter(
    (connection) =>
      connection.status === "pending" && connection.counterpartHandle === handle && !connection.counterpartAccepted,
  );
  const intent = getOnboardingDraft(handle)?.intent ?? "";
  const side: VaelSide = intent === "out" || dashboardSideFromListing(latestListing) === "out" ? "out" : "in";

  return (
    <CityPage width="full">
      <InShellContext.Provider value>
      <div className="flex w-full items-start">
        <DashboardSidebar handle={handle} profile={mine} documents={docs} incomingCount={incoming.length} side={side} />
        <div
          className={cn(
            "min-h-[calc(100dvh-var(--space-nav,4.5rem))] min-w-0 flex-1 space-y-6 bg-white px-4 pb-8 pt-4 sm:px-8 sm:pb-10 sm:pt-6 lg:px-10 dark:bg-white/[0.02] dark:backdrop-blur-3xl",
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
