import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Textarea } from "@/components/ui/controls";
import { getPageSettings, savePageSettings, type PageSettings } from "@/lib/adminStore";
import { Panel } from "./parts";

/** Lets an admin change a page's welcome text and disclaimer without a new release. */
export function PageSettingsForm({ page, label }: { page: keyof PageSettings; label: string }) {
  const saved = getPageSettings()[page];
  const [welcome, setWelcome] = useState(saved.welcome);
  const [disclaimer, setDisclaimer] = useState(saved.disclaimer);
  const [done, setDone] = useState(false);

  return (
    <Panel title={`${label} page text`} bodyClassName="space-y-5">
      <p className="text-body-sm text-muted">Change what members read on this page. It updates straight away, with no new release needed.</p>
      <Field label="Welcome text" htmlFor={`${page}-welcome`} hint="The first line members see at the top of the page.">
        <Textarea
          id={`${page}-welcome`}
          value={welcome}
          onChange={(event) => {
            setWelcome(event.target.value);
            setDone(false);
          }}
          className="min-h-[5.5rem]"
        />
      </Field>
      <Field label="Disclaimer" htmlFor={`${page}-disclaimer`} hint="The warning shown at the bottom of the page.">
        <Textarea
          id={`${page}-disclaimer`}
          value={disclaimer}
          onChange={(event) => {
            setDisclaimer(event.target.value);
            setDone(false);
          }}
          className="min-h-[5.5rem]"
        />
      </Field>
      <div className="flex items-center justify-end gap-4">
        {done ? <span className="text-body-sm text-success">Saved</span> : null}
        <Button
          type="button"
          onClick={() => {
            savePageSettings(page, { welcome, disclaimer });
            setDone(true);
          }}
        >
          Save changes
        </Button>
      </div>
    </Panel>
  );
}
