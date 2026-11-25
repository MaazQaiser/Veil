import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/controls";
import { PAGE_AUDIENCES, PAGE_TEXT_MAX, PAGE_TITLE_MAX, getPageSettings, savePageSettings, type PageAudience, type PageSettings } from "@/lib/adminStore";
import { SideSheet } from "./SideSheet";

type Props = {
  open: boolean;
  onClose: () => void;
  page: keyof PageSettings;
  /** Where the disclaimer shows, said the way members meet it: "at the top of every guide". */
  disclaimerWhere: string;
  /** Where the welcome text shows. Leave out to show only the counter. */
  welcomeWhere?: string;
  /** The question above the audience choice: "Who can read the guides". Leave out for a page with no such choice. */
  audienceLabel?: string;
  /** What follows the disclaimer's counter. A default example is used when left out. */
  disclaimerHint?: string;
  /** Show a Page title field. */
  titleField?: boolean;
};

/** The side panel where an admin changes a page's text and who can read it, without a new release. Cancel and Save sit at the bottom right. */
export function PageSettingsSheet({ open, onClose, page, disclaimerWhere, welcomeWhere, audienceLabel, disclaimerHint, titleField }: Props) {
  const [title, setTitle] = useState("");
  const [welcome, setWelcome] = useState("");
  const [disclaimer, setDisclaimer] = useState("");
  const [audience, setAudience] = useState<PageAudience>("everyone");
  const [error, setError] = useState("");

  // Every time the panel opens it starts from what is saved, so Cancel really throws changes away.
  useEffect(() => {
    if (!open) return;
    const saved = getPageSettings()[page];
    setTitle(saved.title);
    setWelcome(saved.welcome);
    setDisclaimer(saved.disclaimer);
    setAudience(saved.audience);
    setError("");
  }, [open, page]);

  const saved = open ? getPageSettings()[page] : null;
  const dirty =
    Boolean(saved) &&
    (welcome !== saved?.welcome || disclaimer !== saved?.disclaimer || audience !== saved?.audience || (titleField ? title !== saved?.title : false));

  function change<T>(set: (value: T) => void) {
    return (value: T) => {
      set(value);
      setError("");
    };
  }

  function save() {
    try {
      savePageSettings(page, { title, welcome, disclaimer, audience });
      onClose();
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "Could not save the page settings.");
    }
  }

  return (
    <SideSheet
      open={open}
      onClose={onClose}
      dirty={dirty}
      title="Page settings"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={save}>
            Save settings
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <Field
          label={`Disclaimer (shown ${disclaimerWhere})`}
          htmlFor={`${page}-disclaimer`}
          hint={
            <>
              <span className="tabular-nums">
                {disclaimer.length} / {PAGE_TEXT_MAX}
              </span>
              . {disclaimerHint ?? "For example: “This is general information, not legal advice.” Use the attorney’s approved wording."}
            </>
          }
        >
          <Textarea
            id={`${page}-disclaimer`}
            value={disclaimer}
            maxLength={PAGE_TEXT_MAX}
            onChange={(event) => change(setDisclaimer)(event.target.value)}
            className="min-h-[9rem]"
            placeholder="Disclaimer"
          />
        </Field>

        {titleField ? (
          <Field
            label="Page title"
            htmlFor={`${page}-title`}
            hint={
              <span className="tabular-nums">
                {title.length} / {PAGE_TITLE_MAX}
              </span>
            }
          >
            <Input id={`${page}-title`} value={title} maxLength={PAGE_TITLE_MAX} onChange={(event) => change(setTitle)(event.target.value)} />
          </Field>
        ) : null}

        <Field
          label="Welcome text (optional)"
          htmlFor={`${page}-welcome`}
          hint={
            <>
              <span className="tabular-nums">
                {welcome.length} / {PAGE_TEXT_MAX}
              </span>
              {welcomeWhere ? `. Shown ${welcomeWhere}.` : null}
            </>
          }
        >
          <Textarea
            id={`${page}-welcome`}
            value={welcome}
            maxLength={PAGE_TEXT_MAX}
            onChange={(event) => change(setWelcome)(event.target.value)}
            className="min-h-[9rem]"
            placeholder="Welcome text"
          />
        </Field>

        {audienceLabel ? (
          <Field label={audienceLabel} htmlFor={`${page}-audience`}>
            <Select id={`${page}-audience`} value={audience} onChange={(event) => change(setAudience)(event.target.value as PageAudience)}>
              {PAGE_AUDIENCES.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </Select>
          </Field>
        ) : null}

        {error ? <p className="text-body-sm text-destructive">{error}</p> : null}
      </div>
    </SideSheet>
  );
}
