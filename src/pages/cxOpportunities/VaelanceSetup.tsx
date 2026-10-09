import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CityPage } from "@/components/city/CityShell";
import { PageHeader } from "@/components/ui/headers";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/controls";
import { Dialog } from "@/components/ui/overlays";
import { useCitySession } from "@/lib/citySession";
import { getVaelance, RX_PROJECT_CATEGORIES, saveVaelance, type CxProjectRole } from "@/lib/cxProjectStore";
import { ensureCxProfile, saveCxProfile } from "@/lib/constructionStore";
import { CONTRACTOR_OPPS_PATH } from "@/lib/cxRoutes";
import { CX_ACCESS_NOTICE, CX_ACCESS_PRICE_LABEL } from "@/lib/cxAccess";
import { Alert } from "@/components/ui/feedback";
import { cn } from "@/lib/cn";

const ROLES: { id: CxProjectRole; title: string; body: string }[] = [
  { id: "whole", title: "Whole Project", body: "I can manage the complete project." },
  { id: "specialty", title: "Specialty", body: "I handle a specific part of the project." },
  { id: "either", title: "Either", body: "I can do either, depending on the project." },
];

export function VaelanceSetupPage() {
  const { session } = useCitySession();
  const navigate = useNavigate();
  const existing = getVaelance(session.handle);
  const profile = ensureCxProfile(session.handle);
  const [categories, setCategories] = useState<string[]>(existing?.projectCategories ?? []);
  const [role, setRole] = useState<CxProjectRole | "">(existing?.projectRole ?? "");
  const [city, setCity] = useState(profile.serviceArea || profile.location);
  const [readyOpen, setReadyOpen] = useState(false);

  /** Closing the confirmation — by the button, the X, Escape, or the backdrop — moves straight to Avail Opportunities. */
  function goToOpportunities() {
    setReadyOpen(false);
    navigate(CONTRACTOR_OPPS_PATH);
  }

  function toggle(category: string) {
    setCategories((prev) => (prev.includes(category) ? prev.filter((item) => item !== category) : [...prev, category]));
  }

  return (
    <CityPage width="narrow">
      <PageHeader title="What type of work do you do?" />
      <Alert tone="info" title={`Residential Opportunity Access — ${CX_ACCESS_PRICE_LABEL}`} className="mt-6">
        {CX_ACCESS_NOTICE}. You have full access to Avail in this kit — nothing is charged.
      </Alert>
      <ul className="mt-8 grid gap-2 sm:grid-cols-2">
        {RX_PROJECT_CATEGORIES.map((category) => {
          const selected = categories.includes(category);
          return (
            <li key={category}>
              <button
                type="button"
                onClick={() => toggle(category)}
                aria-pressed={selected}
                className={cn(
                  "w-full rounded-lg border px-4 py-3 text-left text-body",
                  selected ? "border-foreground bg-[#DE7C40]/10" : "border-border",
                )}
              >
                {category}
              </button>
            </li>
          );
        })}
      </ul>
      <h2 className="mt-10 text-h4 font-medium">Where do you work?</h2>
      <Field label="City / Town" htmlFor="vaelance-city" className="mt-4 max-w-md">
        <Input
          id="vaelance-city"
          value={city}
          autoComplete="address-level2"
          onChange={(event) => setCity(event.target.value)}
        />
      </Field>
      <h2 className="mt-10 text-h4 font-medium">How do you work?</h2>
      <ul className="mt-4 space-y-3">
        {ROLES.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => setRole(item.id)}
              aria-pressed={role === item.id}
              className={cn(
                "w-full rounded-lg border px-4 py-4 text-left",
                role === item.id ? "border-foreground" : "border-border",
              )}
            >
              <p className="text-body font-medium">{item.title}</p>
              <p className="mt-1 text-body-sm text-muted">{item.body}</p>
            </button>
          </li>
        ))}
      </ul>
      <Button
        type="button"
        className="mt-8"
        disabled={categories.length === 0 || !role || !city.trim()}
        onClick={() => {
          if (!role) return;
          const next = ensureCxProfile(session.handle);
          saveCxProfile({
            ...next,
            serviceArea: city.trim(),
            location: next.location || city.trim(),
          });
          saveVaelance({
            handle: session.handle,
            projectCategories: categories as typeof RX_PROJECT_CATEGORIES[number][],
            projectRole: role,
          });
          setReadyOpen(true);
        }}
      >
        See opportunities
      </Button>
      <Dialog
        open={readyOpen}
        onClose={goToOpportunities}
        title="You're set up"
        footer={
          <Button type="button" onClick={goToOpportunities}>
            Avail Opportunities
          </Button>
        }
      >
        <p>You&apos;re ready to Avail Residential Opportunities.</p>
        <p className="mt-2 text-body-sm text-muted">Continue there to see open opportunities.</p>
      </Dialog>
    </CityPage>
  );
}
