import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Button, buttonClassName } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/headers";
import { EmptyState } from "@/components/ui/feedback";
import { CityPage } from "@/components/city/CityShell";
import { MarketingHome } from "@/pages/city/Marketing";

export function HomePage() {
  return <MarketingHome />;
}

export function SearchPage() {
  const [submitted, setSubmitted] = useState(false);
  return (
    <CityPage>
      <PageHeader
        kicker="City"
        title="Search"
        description="Find people, listings, and districts. Search does not call a live index in this shell, and Community posts are not searched here."
        crumbs={[
          { label: "City", href: "/" },
          { label: "Search" },
        ]}
      />
      <form
        className="mt-6"
        onSubmit={(event) => {
          event.preventDefault();
          setSubmitted(true);
        }}
      >
        <label htmlFor="city-search" className="vael-kicker">
          Query
        </label>
        <input
          id="city-search"
          name="q"
          type="search"
          className="mt-1.5 h-10 w-full rounded-md border border-border bg-surface px-3 text-body-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <p className="mt-2 text-caption text-muted">Submit stays on this page. No invented results.</p>
        <Button type="submit" className="mt-4" variant="outline">
          Search this City
        </Button>
      </form>
      {submitted ? (
        <div className="mt-8">
          <EmptyState
            title="No search index in this shell"
            description="Results will appear when a live search index exists. Nothing is invented here."
            action={
              <Link to="/districts" className={buttonClassName({ variant: "outline" })}>
                View districts
              </Link>
            }
          />
        </div>
      ) : null}
    </CityPage>
  );
}

export function GoVisiblePage() {
  return <Navigate to="/media-technology/vael?create=1" replace />;
}
