import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/controls";
import { cn } from "@/lib/cn";
import {
  CX_BUDGET_TYPES,
  CX_CREW_SIZES,
  CX_EXPERIENCE_LEVELS,
  CX_TRADES,
  CX_WORK_SETTINGS,
  type ConstructionProfile,
} from "@/lib/constructionStore";

type Update = (change: (profile: ConstructionProfile) => ConstructionProfile) => void;

function split(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function tradesOf(profile: ConstructionProfile) {
  return profile.trades ?? (profile.trade ? [profile.trade] : []);
}

/** One block of the profile. In `cards` mode (the join steps) it is its own titled card; otherwise a plain kicker section. */
function Block({ title, note, cards, children }: { title: string; note?: string; cards?: boolean; children: ReactNode }) {
  if (!cards) {
    return (
      <section className="space-y-5">
        <p className="vael-kicker">{title}</p>
        {children}
      </section>
    );
  }
  return (
    <section className="space-y-5 rounded-lg border border-border bg-surface p-6 sm:p-7">
      <header>
        <h2 className="text-h4 font-medium text-foreground">{title}</h2>
        {note ? <p className="mt-1 text-body-sm text-muted">{note}</p> : null}
      </header>
      {children}
    </section>
  );
}

/**
 * What a member tells Contractor Exchange about their work: trades, crew, equipment, where and how
 * they work, and a typical budget. Shared by the join steps and the profile editor.
 */
export function ContractorDetailFields({
  form,
  update,
  tradeRequired = true,
  cards = false,
}: {
  form: ConstructionProfile;
  update: Update;
  tradeRequired?: boolean;
  /** Show each group as its own titled card. */
  cards?: boolean;
}) {
  const set = <K extends keyof ConstructionProfile>(key: K, value: ConstructionProfile[K]) =>
    update((current) => ({ ...current, [key]: value }));
  const picked = tradesOf(form);

  return (
    <>
      <Block title={cards ? "Your trade" : "The Contractor Exchange details"} note="What you do and how you work." cards={cards}>
        <Field label="Trades you work in" required={tradeRequired} hint="Pick every trade you take work in.">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Trades you work in">
            {CX_TRADES.map((item) => {
              const on = picked.includes(item);
              return (
                <button
                  key={item}
                  type="button"
                  aria-pressed={on}
                  onClick={() =>
                    update((current) => {
                      const now = tradesOf(current);
                      const next = now.includes(item) ? now.filter((entry) => entry !== item) : [...now, item];
                      return { ...current, trades: next, trade: next[0] ?? "" };
                    })
                  }
                  className={cn(
                    "rounded-full border px-4 py-2 text-body-sm font-medium motion-safe:transition-colors",
                    on ? "border-accent/60 bg-accent/10 text-accent" : "border-border text-muted hover:text-foreground",
                  )}
                >
                  {item}
                </button>
              );
            })}
          </div>
        </Field>
        <Field label="Crew size" htmlFor="crew">
          <Select id="crew" value={form.crewSize ?? ""} onChange={(e) => set("crewSize", e.target.value)}>
            <option value="">Select</option>
            {CX_CREW_SIZES.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </Select>
        </Field>
        <Field label="Equipment you bring" htmlFor="equip" hint="Tools, vehicles or machines you bring to a job.">
          <Textarea id="equip" value={form.equipment ?? ""} onChange={(e) => set("equipment", e.target.value)} />
        </Field>
        <Field label="Capability statement" htmlFor="capstate" hint="A short paragraph on what you do best.">
          <Textarea
            id="capstate"
            value={form.capabilityStatement ?? ""}
            onChange={(e) => set("capabilityStatement", e.target.value)}
          />
        </Field>
        <Field label="Are you a company or an individual?" htmlFor="pt">
          <Select
            id="pt"
            value={form.profileType}
            onChange={(e) => set("profileType", e.target.value as ConstructionProfile["profileType"])}
          >
            <option value="individual">Individual</option>
            <option value="company">Company</option>
          </Select>
        </Field>
        <Field label="Specialization" htmlFor="spec">
          <Input id="spec" value={form.specialization} onChange={(e) => set("specialization", e.target.value)} />
        </Field>
        <Field label="Skills" htmlFor="caps" hint="Comma-separated.">
          <Input id="caps" value={form.capabilities.join(", ")} onChange={(e) => set("capabilities", split(e.target.value))} />
        </Field>
      </Block>

      <Block title="Location and experience" note="Where you work and how long you have been at it." cards={cards}>
        <Field label="Location" htmlFor="loc">
          <Input id="loc" value={form.location} onChange={(e) => set("location", e.target.value)} />
        </Field>
        <Field label="Where the work happens" htmlFor="setting">
          <Select id="setting" value={form.workSetting ?? ""} onChange={(e) => set("workSetting", e.target.value)}>
            <option value="">Select</option>
            {CX_WORK_SETTINGS.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </Select>
        </Field>
        <Field label="Experience level" htmlFor="level">
          <Select id="level" value={form.experienceLevel ?? ""} onChange={(e) => set("experienceLevel", e.target.value)}>
            <option value="">Select</option>
            {CX_EXPERIENCE_LEVELS.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </Select>
        </Field>
      </Block>

      <Block title="Typical budget range" note="A rough guide for homeowners. You can change it anytime." cards={cards}>
        <Field label="Type" htmlFor="btype">
          <Select id="btype" value={form.budgetType ?? ""} onChange={(e) => set("budgetType", e.target.value)}>
            <option value="">Select</option>
            {CX_BUDGET_TYPES.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </Select>
        </Field>
        <Field label="Details" htmlFor="bdetails" hint="For example, “$75 to $95 an hour” or “projects from $10,000”.">
          <Input id="bdetails" value={form.budgetDetails ?? ""} onChange={(e) => set("budgetDetails", e.target.value)} />
        </Field>
      </Block>
    </>
  );
}

/** Links to work you have done. Add as many as you like. */
export function PortfolioLinkFields({ form, update, cards = false }: { form: ConstructionProfile; update: Update; cards?: boolean }) {
  const [draft, setDraft] = useState("");

  function add() {
    const url = draft.trim();
    if (!url) return;
    update((current) => ({
      ...current,
      portfolio: [...current.portfolio, { label: url.replace(/^https?:\/\//, ""), url }],
    }));
    setDraft("");
  }

  return (
    <Block title="Portfolio links" note="Links to work you have done. Add as many as you like." cards={cards}>
      {form.portfolio.length > 0 ? (
        <ul className="space-y-2">
          {form.portfolio.map((link, index) => (
            <li key={`${link.url}-${index}`} className="flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-2.5">
              <span className="min-w-0 truncate text-body-sm text-foreground">{link.label || link.url}</span>
              <button
                type="button"
                className="shrink-0 text-body-sm text-muted hover:text-foreground"
                onClick={() =>
                  update((current) => ({ ...current, portfolio: current.portfolio.filter((_, at) => at !== index) }))
                }
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="flex gap-2">
        <Input
          id="pu"
          aria-label="Portfolio link"
          placeholder="https://your-work.example.com"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <Button type="button" variant="outline" disabled={!draft.trim()} onClick={add}>
          Add
        </Button>
      </div>
    </Block>
  );
}
