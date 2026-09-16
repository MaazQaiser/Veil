import { Link, useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/ui/headers";
import { buttonClassName } from "@/components/ui/button";
import { CityPage } from "@/components/city/CityShell";
import { DemoPurchaseNotice, PlanComparison } from "@/components/vael/plans";
import { VISIBILITY_PLANS, planById } from "@/lib/visibilityPlans";

export function ExtendedVaelPage() {
  return (
    <CityPage>
      <PageHeader
        kicker="Account"
        title="Extended VAEL"
        description="Structural plan comparison only. Free Daily VAEL is what listings use. Extended does not change the 24-hour clock."
        crumbs={[
          { label: "Account", href: "/account" },
          { label: "Extended VAEL" },
        ]}
      />
      <DemoPurchaseNotice className="mt-6" />
      <div className="mt-8">
        <PlanComparison plans={VISIBILITY_PLANS} />
      </div>
      <p className="mt-8 max-w-xl text-body-sm text-muted">
        Visibility is managed in each live Room. This page does not sell a plan and does not connect a payment provider.
      </p>
      <p className="mt-4">
        <Link to="/account/visibility" className={buttonClassName({ variant: "ghost", size: "sm" })}>
          Account visibility
        </Link>
      </p>
    </CityPage>
  );
}

export function ExtendedVaelCheckoutPage() {
  const [params] = useSearchParams();
  const plan = planById(params.get("plan")) ?? planById("extended")!;
  return (
    <CityPage width="narrow">
      <PageHeader
        kicker="Account"
        title="Review"
        description="This is not a purchase. No payment information is collected."
        crumbs={[
          { label: "Extended VAEL", href: "/extended-vael" },
          { label: "Review" },
        ]}
      />
      <DemoPurchaseNotice className="mt-6" />
      <dl className="mt-8 space-y-4 text-body-sm">
        <div>
          <dt className="vael-kicker">Selected plan</dt>
          <dd className="mt-1">{plan.name}</dd>
        </div>
        <div>
          <dt className="vael-kicker">Visibility</dt>
          <dd className="mt-1">{plan.duration}. Listings on this device still use Free Daily VAEL (24 hours).</dd>
        </div>
        <div>
          <dt className="vael-kicker">What would happen next</dt>
          <dd className="mt-1">
            If Owner later approves billing, this review would collect payment. Right now the next step is an honest
            demo confirmation — not a charge.
          </dd>
        </div>
      </dl>
      <div className="mt-8 flex flex-wrap gap-2">
        <Link to="/extended-vael/success" className={buttonClassName({ variant: "outline" })}>
          Continue demo (no charge)
        </Link>
        <Link to="/extended-vael" className={buttonClassName({ variant: "ghost" })}>
          Back to plans
        </Link>
      </div>
    </CityPage>
  );
}

export function ExtendedVaelSuccessPage() {
  return (
    <CityPage width="narrow">
      <PageHeader
        kicker="Account"
        title="Demo complete"
        description="No purchase was made. No billing record exists on this device or anywhere else."
        crumbs={[
          { label: "Extended VAEL", href: "/extended-vael" },
          { label: "Demo" },
        ]}
      />
      <DemoPurchaseNotice className="mt-6" />
      <p className="mt-6 text-body-sm">
        Your VAEL visibility is unchanged. Create a VAEL in Media & Technology to vael for 24 hours on Free Daily VAEL.
      </p>
      <div className="mt-8 flex flex-wrap gap-2">
        <Link to="/media-technology/vael?create=1" className={buttonClassName()}>
          Create VAEL
        </Link>
        <Link to="/account/visibility" className={buttonClassName({ variant: "outline" })}>
          Visibility
        </Link>
      </div>
    </CityPage>
  );
}
