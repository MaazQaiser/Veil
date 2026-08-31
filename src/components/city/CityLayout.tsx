import { Outlet, useLocation } from "react-router-dom";
import { CityFooter, CityShell, isSitePath } from "./CityShell";
import { useCitySession } from "@/lib/citySession";
import { cn } from "@/lib/cn";

export function CityLayout() {
  const { session } = useCitySession();
  const location = useLocation();
  const inProduct = session.signedIn && !isSitePath(location.pathname);

  return (
    <div
      data-surface={inProduct ? undefined : "site"}
      className={cn(
        "flex min-h-screen min-w-0 flex-col bg-background text-foreground",
        inProduct && "pb-[4.75rem] lg:pb-0",
      )}
    >
      <CityShell />
      <main id="main-content" className="min-w-0 flex-1">
        <Outlet />
      </main>
      <CityFooter />
    </div>
  );
}
