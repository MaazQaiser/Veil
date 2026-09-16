import { Link } from "react-router-dom";
import { Card, CardBody, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import { Alert } from "@/components/ui/feedback";
import {
  DEMO_PRICING_LABEL,
  type VisibilityPlan,
  type VisibilityPlanStatus,
} from "@/lib/visibilityPlans";

const statusLabel: Record<VisibilityPlanStatus, string> = {
  current: "Current",
  available: "Available",
  demo: "Demo",
  unavailable: "Not available for purchase",
};

const statusTone: Record<VisibilityPlanStatus, "live" | "outline" | "soon" | "muted"> = {
  current: "live",
  available: "outline",
  demo: "soon",
  unavailable: "muted",
};

export function DemoPurchaseNotice({ className }: { className?: string }) {
  return (
    <Alert tone="warning" title={DEMO_PRICING_LABEL} className={className}>
      This is a structural demo. Nothing is billed. There is no Stripe connection and no payment form.
    </Alert>
  );
}

export function PlanCard({
  plan,
  featured,
}: {
  plan: VisibilityPlan;
  featured?: boolean;
}) {
  return (
    <Card className={featured ? "border-border-strong" : undefined}>
      <CardHeader>
        <Badge tone={statusTone[plan.status]}>{statusLabel[plan.status]}</Badge>
        <CardTitle>{plan.name}</CardTitle>
        <p className="text-caption text-muted">{plan.duration}</p>
      </CardHeader>
      <CardBody>
        <p className="vael-kicker">Included</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          {plan.included.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="vael-kicker mt-4">Not included</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          {plan.notIncluded.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </CardBody>
      <CardFooter>
        {plan.id === "daily" ? (
          <Link to="/media-technology/vael?create=1" className={buttonClassName({ size: "sm" })}>
            Create VAEL
          </Link>
        ) : (
          <Link to="/extended-vael/checkout?plan=extended" className={buttonClassName({ size: "sm", variant: "outline" })}>
            Review demo
          </Link>
        )}
      </CardFooter>
    </Card>
  );
}

export function PlanComparison({ plans }: { plans: VisibilityPlan[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {plans.map((plan) => (
        <PlanCard key={plan.id} plan={plan} featured={plan.id === "daily"} />
      ))}
    </div>
  );
}
