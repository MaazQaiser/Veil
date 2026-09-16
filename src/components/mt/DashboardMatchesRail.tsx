import { useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { MatchDashboardCard } from "@/components/mt/MatchDashboardCard";
import { PRODUCT_HOME } from "@/lib/providerJourney";
import type { RankedMatch } from "@/lib/vaelStore";

function isToday(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

/** "Your matches" — the dashboard's primary rail, badged with today's new count. Real data only. */
export function DashboardMatchesRail({ matches, visible }: { matches: RankedMatch[]; visible: boolean }) {
  const railRef = useRef<HTMLDivElement>(null);
  const newToday = useMemo(() => matches.filter((match) => isToday(match.listing.createdAt)).length, [matches]);
  const top = useMemo(() => [...matches].sort((a, b) => b.percent - a.percent).slice(0, 10), [matches]);

  return (
    <section>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-h4 font-medium text-foreground">
            Your Matches
            {newToday > 0 ? (
              <span className="inline-flex h-6 items-center rounded-full bg-[#FFC555]/15 px-2.5 text-caption font-medium text-[#C99A28] dark:bg-accent/15 dark:text-accent">
                {newToday} new today
              </span>
            ) : null}
          </p>
          <p className="mt-1 text-body-sm text-muted">People VAEL has identified as a strong fit for you.</p>
        </div>
        <Link
          to={`${PRODUCT_HOME}/matches`}
          className="text-body-sm font-medium text-[#C99A28] underline underline-offset-4 hover:text-foreground dark:text-accent"
        >
          View all matches →
        </Link>
      </div>

      <div className="relative mt-5">
        {!visible ? (
          <p className="rounded-xl border border-dashed border-[#C99A28]/25 bg-[#FFC555]/[0.05] px-5 py-8 text-center text-body-sm text-muted dark:border-accent/25 dark:bg-accent/[0.05]">
            Vael In or Vael Out to become visible to relevant matches.
          </p>
        ) : top.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[#C99A28]/25 bg-[#FFC555]/[0.05] px-5 py-8 text-center text-body-sm text-muted dark:border-accent/25 dark:bg-accent/[0.05]">
            No matches yet. Check back once more availability opens in your district.
          </p>
        ) : (
          <div
            ref={railRef}
            className="flex snap-x gap-4 overflow-x-auto scroll-smooth px-1 pb-8 pt-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {top.map((match) => (
              <MatchDashboardCard key={match.listing.id} match={match} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
