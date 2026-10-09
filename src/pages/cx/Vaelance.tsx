import type { ReactNode } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { CityPage } from "@/components/city/CityShell";
import { PageHeader } from "@/components/ui/headers";
import { getCxDocuments, getCxProfile, getActiveCxListing } from "@/lib/constructionStore";
import { displayNameFor, getVaelance, responseGroupFor, vaelanceSourceLabels } from "@/lib/cxProjectStore";
import { hoursLeft } from "@/lib/vaelStore";

export function VaelanceBody({ handle, publicOnly = false }: { handle: string; publicOnly?: boolean }) {
  const profile = getCxProfile(handle);
  const vaelance = getVaelance(handle);
  const listing = getActiveCxListing(handle);
  const docs = getCxDocuments(handle).filter((item) => (publicOnly ? item.publicFlag : true));
  const labels = vaelanceSourceLabels(handle);
  const group = vaelance ? responseGroupFor(vaelance.projectRole) : "whole";

  return (
    <div className="mt-8 space-y-8">
      <Section title="Company information" source={labels.company}>
        <p>{displayNameFor(handle)}</p>
        <p className="text-body-sm text-muted">{profile?.headline || profile?.about}</p>
        <p className="text-body-sm text-muted">{profile?.location || profile?.serviceArea}</p>
      </Section>
      <Section title="Licenses and certifications" source={labels.licenses}>
        <ul className="list-disc pl-5">
          {(profile?.certifications?.length ? profile.certifications : profile?.credentials ?? []).map((item) => (
            <li key={item}>{item}</li>
          ))}
          {docs.map((item) => (
            <li key={item.id}>
              {item.title} {item.publicFlag ? "" : "(not public)"}
            </li>
          ))}
          {(profile?.credentials?.length ?? 0) === 0 && docs.length === 0 ? <li>None listed.</li> : null}
        </ul>
      </Section>
      <Section title="Activity Standing" source={labels.activity}>
        <p>{profile?.availableNow || listing ? "Available on VAEL this cycle." : "No live availability posted."}</p>
        {listing ? <p className="text-body-sm text-muted">{hoursLeft(listing.expiresAt)} hours left on the current VAEL.</p> : null}
      </Section>
      <Section title="Work history" source={labels.history}>
        <ul className="list-disc pl-5">
          {(profile?.projects ?? []).map((item) => (
            <li key={item.id}>
              {item.title} — {item.status}
            </li>
          ))}
          {(profile?.projects?.length ?? 0) === 0 ? <li>None listed.</li> : null}
        </ul>
        <p className="mt-2 text-body-sm text-muted">{profile?.experience}</p>
      </Section>
      <Section title="Project categories and role" source={labels.categories}>
        <p>{(vaelance?.projectCategories ?? []).join(", ") || "Not set."}</p>
        <p className="text-body-sm text-muted">
          {vaelance?.projectRole === "specialty"
            ? "Specialty work for part of it"
            : group === "whole"
              ? "Can manage your whole project"
              : ""}
        </p>
      </Section>
      <Section title="Service areas" source={labels.company}>
        <p>{profile?.serviceArea || profile?.location || "Not listed."}</p>
      </Section>
    </div>
  );
}

function Section({ title, source, children }: { title: string; source: string; children: ReactNode }) {
  return (
    <section>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-h4 font-medium">{title}</h2>
        <p className="text-caption uppercase tracking-[0.06em] text-muted">{source}</p>
      </div>
      <div className="mt-2 text-body text-foreground">{children}</div>
    </section>
  );
}

export function VaelancePage() {
  const { handle = "" } = useParams();
  return (
    <CityPage width="narrow">
      <PageHeader title="VAELance" description={displayNameFor(handle)} />
      <VaelanceBody handle={handle} />
    </CityPage>
  );
}

export function VaelanceComparePage() {
  const [params] = useSearchParams();
  const a = params.get("a") ?? "";
  const b = params.get("b") ?? "";
  return (
    <CityPage>
      <PageHeader title="Compare" description="Two VAELances, side by side." />
      <div className="mt-8 grid gap-8 md:grid-cols-2">
        <div>
          <h2 className="text-h4 font-medium">{displayNameFor(a)}</h2>
          <VaelanceBody handle={a} />
        </div>
        <div>
          <h2 className="text-h4 font-medium">{displayNameFor(b)}</h2>
          <VaelanceBody handle={b} />
        </div>
      </div>
      <Link to=".." className="mt-8 inline-block text-body-sm text-muted">
        Back
      </Link>
    </CityPage>
  );
}
