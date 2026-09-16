import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Select } from "@/components/ui/controls";
import { TagField, splitTags } from "@/components/ui/tags";
import { IconDocument, IconLock } from "@/components/ui/icons";
import { DocumentCard } from "@/components/vael";
import { completeOnboardingStep } from "@/lib/onboarding";
import { DOC_TYPE_LABELS } from "@/lib/profileFields";
import { capabilityOptions, certificationOptions, DOC_TYPES, type ProfileDocument } from "@/lib/vaelStore";
import { useNavigate } from "react-router-dom";
import { JoinFieldCard, JoinFooterBar, JoinHead } from "./JoinLayout";
import { useJoinProfile } from "./useJoinProfile";

type DocType = ProfileDocument["type"];

export function JoinCredentialsPage() {
  const { session, vael, intent, form, set, persist } = useJoinProfile();
  const navigate = useNavigate();
  const [docType, setDocType] = useState<DocType>("license");
  const docs = vael.documents(session.handle);
  const hiring = intent === "out";

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    persist();
    completeOnboardingStep(session.handle, "Credentials");
    navigate("/join/preview");
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <JoinHead
        title={hiring ? "What are you looking for?" : "Add your credentials"}
        lede={
          hiring
            ? "Optional detail. Nothing here is required to continue."
            : "Optional proof. Nothing here is required to continue, and nothing is verified by VAEL."
        }
        center
      />
      <form className="mt-10 space-y-5" onSubmit={onSubmit} noValidate>
        {hiring ? (
          <JoinFieldCard icon={<IconLock />} title="Requirements" hint="Skills or certifications the person you hire should have. Optional.">
            <TagField
              id="requirements"
              label="Add requirements"
              values={splitTags(form.credentials)}
              options={capabilityOptions("skills")}
              placeholder="Search or add a requirement"
              onChange={(next) => set("credentials", next.join(", "))}
            />
          </JoinFieldCard>
        ) : (
          <JoinFieldCard icon={<IconLock />} title="Certifications" hint="Optional. Listed on this device — not verified by VAEL.">
            <TagField
              id="certs"
              label="Add certifications"
              values={splitTags(form.credentials)}
              options={certificationOptions()}
              placeholder="Search or add a certification"
              onChange={(next) => set("credentials", next.join(", "))}
            />
          </JoinFieldCard>
        )}

        <JoinFieldCard
          icon={<IconDocument />}
          title="Documents"
          hint={
            hiring
              ? "Job brief, scope of work, or a spec — held on this device."
              : "License, insurance, or a capability statement. Held on this device."
          }
        >
          <div className="flex flex-col gap-3">
            <Field label="Document type" htmlFor="doc-type">
              <Select id="doc-type" value={docType} onChange={(event) => setDocType(event.target.value as DocType)}>
                {DOC_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {DOC_TYPE_LABELS[type]}
                  </option>
                ))}
              </Select>
            </Field>
            <input
              aria-label="Add document"
              type="file"
              className="block text-body-sm"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => {
                  vael.uploadDocument({
                    handle: session.handle,
                    type: docType,
                    title: file.name,
                    publicFlag: false,
                    dataUrl: String(reader.result),
                  });
                };
                reader.readAsDataURL(file);
              }}
            />
            {docs.length > 0 ? (
              <ul className="mt-2 space-y-3">
                {docs.map((doc) => (
                  <li key={doc.id}>
                    <DocumentCard title={doc.title} type={doc.type} status={doc.publicFlag ? "public" : "uploaded"} />
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </JoinFieldCard>

        <JoinFooterBar>
          <Button type="submit" size="lg" className="rounded-full px-10">
            Continue
          </Button>
        </JoinFooterBar>
      </form>
    </div>
  );
}
