import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Select } from "@/components/ui/controls";
import { TagField, splitTags } from "@/components/ui/tags";
import { DocumentCard } from "@/components/vael";
import { completeOnboardingStep } from "@/lib/onboarding";
import { DOC_TYPE_LABELS } from "@/lib/profileFields";
import { certificationOptions, DOC_TYPES, type ProfileDocument } from "@/lib/vaelStore";
import { useNavigate } from "react-router-dom";
import { JoinHead } from "./JoinLayout";
import { useJoinProfile } from "./useJoinProfile";

type DocType = ProfileDocument["type"];

export function JoinCredentialsPage() {
  const { session, vael, form, set, persist } = useJoinProfile();
  const navigate = useNavigate();
  const [docType, setDocType] = useState<DocType>("license");
  const docs = vael.documents(session.handle);

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    persist();
    completeOnboardingStep(session.handle, "Credentials");
    navigate("/join/preview");
  }

  return (
    <div>
      <JoinHead
        title="Add your credentials"
        lede="Optional proof. Nothing here is required to continue, and nothing is verified by VAEL."
      />
      <form className="mt-10 space-y-8" onSubmit={onSubmit} noValidate>
        <TagField
          id="certs"
          label="Certifications"
          hint="Optional. Listed on this device — not verified by VAEL."
          values={splitTags(form.credentials)}
          options={certificationOptions()}
          placeholder="Search or add a certification"
          onChange={(next) => set("credentials", next.join(", "))}
        />
        <Field
          label="Documents"
          htmlFor="doc-type"
          hint="License, insurance, or a capability statement. Held on this device."
        >
          <div className="flex flex-col gap-3">
            <Select id="doc-type" value={docType} onChange={(event) => setDocType(event.target.value as DocType)}>
              {DOC_TYPES.map((type) => (
                <option key={type} value={type}>
                  {DOC_TYPE_LABELS[type]}
                </option>
              ))}
            </Select>
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
          </div>
        </Field>
        {docs.length > 0 ? (
          <ul className="space-y-3">
            {docs.map((doc) => (
              <li key={doc.id}>
                <DocumentCard title={doc.title} type={doc.type} status={doc.publicFlag ? "public" : "uploaded"} />
              </li>
            ))}
          </ul>
        ) : null}
        <Button type="submit" size="lg" className="rounded-full px-7">
          Continue
        </Button>
      </form>
    </div>
  );
}
