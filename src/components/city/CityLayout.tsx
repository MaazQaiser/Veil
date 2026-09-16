import { Outlet, useLocation } from "react-router-dom";
import { CityFooter, CityShell, isSitePath } from "./CityShell";
import { useCitySession } from "@/lib/citySession";
import { useTheme } from "@/lib/theme";
import { isDarkModeFlowPath } from "@/lib/providerJourney";
import { cn } from "@/lib/cn";

export function CityLayout() {
  const { session } = useCitySession();
  const { theme, accent } = useTheme();
  const location = useLocation();
  const inProduct = session.signedIn && !isSitePath(location.pathname);
  const inJoinFlow = location.pathname.startsWith("/join") || location.pathname === "/sign-in";
  const hideFooter = inJoinFlow || location.pathname === "/messages";
  const showDark = theme === "dark" && isDarkModeFlowPath(location.pathname);

  return (
    <div
      data-surface={inProduct ? undefined : "site"}
      data-theme={showDark ? "dark" : undefined}
      data-accent={showDark ? accent : undefined}
      className={cn(
        "flex min-h-screen min-w-0 flex-col text-foreground dark:text-[#F5F3EE]",
        inProduct ? "bg-white pb-[4.75rem] lg:pb-0 dark:bg-[#100E0B]" : "bg-background",
      )}
    >
      {showDark ? (
        <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute -left-40 -top-40 h-[480px] w-[480px] rounded-full bg-accent/[0.09] blur-[130px]" />
          <div className="absolute -right-32 top-0 h-[560px] w-[560px] rounded-full bg-[#7C9CF5]/[0.1] blur-[140px]" />
          <div className="absolute bottom-[-15%] left-1/3 h-[520px] w-[520px] rounded-full bg-[#4ADE80]/[0.09] blur-[150px]" />
          <div className="absolute right-1/4 top-1/2 h-[380px] w-[380px] rounded-full bg-accent-hover/[0.04] blur-[120px]" />
          <div
            className="absolute inset-0 opacity-[0.035] mix-blend-overlay"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
            }}
          />
        </div>
      ) : null}
      <CityShell />
      <main id="main-content" className="flex min-w-0 flex-1 flex-col">
        <Outlet />
      </main>
      {hideFooter ? null : <CityFooter />}
    </div>
  );
}
