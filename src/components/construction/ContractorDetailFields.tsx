import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/controls";
import { IconBriefcase, IconDocument, IconLink, IconMapPin, IconWallet, IconUsers } from "@/components/ui/icons";
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

type BlockIcon = typeof IconBriefcase;

/** One block of the profile. In `cards` mode (the join steps) it is its own titled card; otherwise a plain kicker section. */
export function Block({
  title,
  note,
  cards,
  icon: Icon,
  children,
}: {
  title: string;
  note?: string;
  cards?: boolean;
  icon?: BlockIcon;
  children: ReactNode;
}) {
  if (!cards) {
    return (
      <section className="space-y-5">
        <p className="vael-kicker">{title}</p>
        {children}
      </section>
    );
  }
  return (
    <section className="rounded-2xl border border-border bg-surface">
      <header className="flex items-start gap-4 border-b border-border-subtle px-6 py-5 sm:px-7">
        {Icon ? (
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <Icon className="h-5 w-5" />
          </span>
        ) : null}
        <div className="min-w-0">
          <h2 className="text-h4 font-medium text-foreground">{title}</h2>
          {note ? <p className="mt-0.5 text-body-sm text-muted">{note}</p> : null}
        </div>
      </header>
      <div className="space-y-5 px-6 py-6 sm:px-7">{children}</div>
    </section>
  );
}

/** Two short fields side by side on wide screens. */
function Pair({ children }: { children: ReactNode }) {
  return <div className="grid gap-5 sm:grid-cols-2">{children}</div>;
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
      <Block
        title={cards ? "Your trade" : "The Contractor Exchange details"}
        note="What you do, and what you are best at."
        cards={cards}
        icon={IconBriefcase}
      >
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
        <Field label="Specialization" htmlFor="spec" hint="The one thing you are known for.">
          <Input id="spec" value={form.specialization} onChange={(e) => set("specialization", e.target.value)} />
        </Field>
        <Field label="Skills" htmlFor="caps" hint="Separate them with commas.">
          <Input id="caps" value={form.capabilities.join(", ")} onChange={(e) => set("capabilities", split(e.target.value))} />
        </Field>
      </Block>

      <Block title="Your business" note="Who you work as, and what you bring to a job." cards={cards} icon={IconUsers}>
        <Field label="Are you a company or an individual?">
          <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Company or individual">
            {(
              [
                { id: "individual", title: "An individual contractor", body: "You work for yourself." },
                { id: "company", title: "A company", body: "You run a business or a crew." },
              ] as const
            ).map((item) => {
              const on = form.profileType === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => set("profileType", item.id)}
                  className={cn(
                    "flex flex-col items-start rounded-xl border px-4 py-3 text-left motion-safe:transition-colors hover:border-accent/60",
                    on ? "border-accent/60 bg-accent/10" : "border-border",
                  )}
                >
                  <span className={cn("text-body-sm font-semibold", on ? "text-accent" : "text-foreground")}>{item.title}</span>
                  <span className="mt-0.5 text-caption text-muted">{item.body}</span>
                </button>
              );
            })}
          </div>
        </Field>
        <Field label="Crew size" htmlFor="crew" hint="How many people you can put on a job.">
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
      </Block>

      <Block title="Capability statement" note="A short paragraph on what you do best, in your own words." cards={cards} icon={IconDocument}>
        <Field label="About your work" htmlFor="capstate">
          <Textarea
            id="capstate"
            maxLength={2000}
            value={form.capabilityStatement ?? ""}
            onChange={(e) => set("capabilityStatement", e.target.value)}
          />
          <p className="mt-1.5 text-right text-caption tabular-nums text-quiet">{(form.capabilityStatement ?? "").length}/2000</p>
        </Field>
      </Block>

      <Block title="Location and experience" note="Where you work and how long you have been at it." cards={cards} icon={IconMapPin}>
        <Field label="Location" htmlFor="loc">
          <Input id="loc" value={form.location} onChange={(e) => set("location", e.target.value)} />
        </Field>
        <Pair>
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
        </Pair>
      </Block>

      <Block title="Typical budget range" note="A rough guide for homeowners. You can change it anytime." cards={cards} icon={IconWallet}>
        <Pair>
          <Field label="Type" htmlFor="btype">
            <Select id="btype" value={form.budgetType ?? ""} onChange={(e) => set("budgetType", e.target.value)}>
              <option value="">Select</option>
              {CX_BUDGET_TYPES.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </Select>
          </Field>
          <Field label="Details" htmlFor="bdetails" hint="For example, “$75 to $95 an hour”.">
            <Input id="bdetails" value={form.budgetDetails ?? ""} onChange={(e) => set("budgetDetails", e.target.value)} />
          </Field>
        </Pair>
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
    <Block title="Portfolio links" note="Links to work you have done. Add as many as you like." cards={cards} icon={IconLink}>
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
