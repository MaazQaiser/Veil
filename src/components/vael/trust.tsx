import { Link } from "react-router-dom";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/feedback";
import { DocumentCard } from "./cards";
import { VerificationState } from "./status";
import { listedCount } from "@/lib/profileTrust";

export function TrustSummary({
  note,
}: {
  note?: string;
}) {
  return (
    <div className="space-y-2">
      <p className="vael-kicker">Trust</p>
      <VerificationState kind="unverified" />
      <p className="text-caption text-muted">
        {note ??
          "Unverified is the only honest state. Listing a credential or document does not verify identity."}
      </p>
    </div>
  );
}

export function ProfileCompleteness({
  values,
  label = "Details listed on this device",
}: {
  values: Array<string | string[] | number | boolean | undefined | null>;
  label?: string;
}) {
  const { count, total, complete } = listedCount(values);
  return (
    <p className="text-caption text-muted" role="status">
      {label}: {count} of {total}
      {complete ? " · Complete" : " · Incomplete"}
      <span className="sr-only">. This is a fill count, not a trust score.</span>
    </p>
  );
}

export function CredentialCard({
  labels,
}: {
  labels: string[];
}) {
  return (
    <Card>
      <p className="vael-kicker">Credentials</p>
      <CardBody className="mt-2">
        {labels.length ? labels.join(" · ") : "None listed."}
      </CardBody>
      <p className="mt-2 text-caption text-muted">
        Labels on this device. This kit does not validate licenses or certificates.
      </p>
    </Card>
  );
}

export function ProfileDocumentsSection({
  docs,
  mine,
  revealed,
  emptyDescription = "License, insurance, and capability statements live here. Stored as a local preview — not cloud storage.",
}: {
  docs: { id: string; title: string; type: string; publicFlag: boolean }[];
  mine: boolean;
  revealed: boolean;
  emptyDescription?: string;
}) {
  const visible = docs.filter((doc) => mine || doc.publicFlag || revealed);
  if (docs.length === 0) {
    return (
      <EmptyState
        title="No documents"
        description={
          mine
            ? `${emptyDescription} Add files from Edit profile — they stay on this device.`
            : emptyDescription
        }
      />
    );
  }
  if (visible.length === 0) {
    return (
      <EmptyState
        title="Documents are restricted"
        description="Private documents stay closed until a Handshake is connected. Public flags and your own files remain available."
      />
    );
  }
  return (
    <ul className="space-y-3">
      {visible.map((doc) => (
        <li key={doc.id}>
          <DocumentCard
            title={doc.title}
            type={doc.type}
            status={doc.publicFlag ? "public" : "uploaded"}
            access={mine || revealed || doc.publicFlag ? "available" : "restricted"}
          />
        </li>
      ))}
    </ul>
  );
}

export function ProfileTrustPanel({
  values,
  districtNote,
}: {
  values: Array<string | string[] | number | boolean | undefined | null>;
  districtNote: string;
}) {
  return (
    <div className="space-y-4">
      <TrustSummary note={districtNote} />
      <ProfileCompleteness values={values} />
      <p className="text-body-sm text-muted">Reputation is not modeled. There is no trust score.</p>
    </div>
  );
}

export function MatchTrustNote({
  credentialsListed,
  documentsListed,
  listingFilled,
  profileHref,
}: {
  credentialsListed: boolean;
  documentsListed?: boolean;
  listingFilled?: boolean;
  profileHref?: string;
}) {
  return (
    <Card>
      <p className="vael-kicker">Trust</p>
      <div className="mt-2">
        <VerificationState kind="unverified" />
      </div>
      <ul className="mt-3 space-y-1 text-caption text-muted">
        <li>Credentials: {credentialsListed ? "listed on the VAEL" : "none listed"}</li>
        {typeof documentsListed === "boolean" ? (
          <li>Documents: {documentsListed ? "listed publicly" : "none listed publicly"}</li>
        ) : null}
        {typeof listingFilled === "boolean" ? (
          <li>Listing details: {listingFilled ? "complete" : "some details missing"}</li>
        ) : null}
      </ul>
      <p className="mt-2 text-caption text-muted">
        Not a verified identity. Private rates, portfolio, and documents stay closed until Handshake.
      </p>
      {profileHref ? (
        <p className="mt-2 text-caption">
          <Link to={profileHref} className="underline">
            View public profile
          </Link>
        </p>
      ) : null}
    </Card>
  );
}
