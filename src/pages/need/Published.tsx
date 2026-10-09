import { useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardFooter, CardHeader, CardMeta, CardTitle } from "@/components/ui/card";
import { useCitySession } from "@/lib/citySession";
import { getCxProfile } from "@/lib/constructionStore";
import {
  bestMatchGroups,
  displayNameFor,
  extendCxProject,
  getCxProject,
  respondentsFor,
  signalHomeownerInterest,
  toggleSavedContractor,
  type CxRespondent,
} from "@/lib/cxProjectStore";
import { PROJECTS_PATH } from "@/lib/cxRoutes";
import { formatDate, relativeTime } from "@/lib/time";
import { useCxProjects } from "@/lib/useCxProjects";
import { VaelanceBody } from "@/pages/cx/Vaelance";
import { NeedHead } from "./NeedLayout";

const NOT_SURE = "Not sure yet";

export function NeedPublishedPage() {
  useCxProjects();
  const { projectId = "" } = useParams();
  const { session } = useCitySession();
  const project = getCxProject(projectId);
  const [openHandle, setOpenHandle] = useState("");
  const [interestError, setInterestError] = useState("");

  if (!project || project.status === "draft") return <Navigate to={PROJECTS_PATH} replace />;
  if (session.signedIn && project.handle && project.handle !== session.handle) {
    return <Navigate to={PROJECTS_PATH} replace />;
  }

  const live = project.status === "live";
  const closed = project.status === "closed" || project.status === "expired";
  const daysLeft =
    live && project.liveUntil
      ? Math.max(0, Math.ceil((Date.parse(project.liveUntil) - Date.now()) / 86400000))
      : 0;
  const budget = project.budgetBand === NOT_SURE ? "Not sure" : project.budgetBand;
  const summary = project.description.trim() || "None";
  const hasMedia = project.photos.length > 0 || Boolean(project.video);
  const respondents = respondentsFor(project);
  const matches = bestMatchGroups(project);
  const header = [
    { label: "Status", value: live ? "Published" : "Closed" },
    { label: "Date posted", value: project.publishedAt ? formatDate(project.publishedAt) : "" },
    { label: "Project category", value: project.category },
    { label: "Project summary", value: summary },
  ];
  const details = [
    { label: "What they need", value: summary },
    { label: "Photos / video", value: hasMedia ? "" : "None" },
    { label: "Project location", value: `${project.city} / ${project.postalCode}` },
    { label: "Timing", value: project.timing },
    { label: "Budget", value: budget || "Not sure" },
  ];

  return (
    <div className="flex flex-1 flex-col">
      <NeedHead
        title="Your Opportunity"
        lede={
          live
            ? "My Opportunity is live."
            : "This project is closed and read-only. New contractor responses are stopped. Handshakes stay available."
        }
      />
      <ul className="mt-8 divide-y divide-border border-y border-border">
        {header.map((row) => (
          <li key={row.label} className="py-4">
            <p className="text-label font-medium text-muted">{row.label}</p>
            <p className="mt-1 whitespace-pre-wrap text-body text-foreground">{row.value}</p>
          </li>
        ))}
      </ul>

      <section className="mt-10">
        <h2 className="text-h3 font-medium text-foreground">Project details</h2>
        <ul className="mt-4 divide-y divide-border border-y border-border">
          {details.map((row) => (
            <li key={row.label} className="py-4">
              <p className="text-label font-medium text-muted">{row.label}</p>
              {row.label === "Photos / video" && hasMedia ? (
                <Media photos={project.photos} video={project.video} />
              ) : (
                <p className="mt-1 whitespace-pre-wrap text-body text-foreground">{row.value}</p>
              )}
            </li>
          ))}
        </ul>
      </section>

      {live && project.day5Reminded ? (
        <div className="mt-6 rounded-lg border border-border p-4">
          <p className="text-body font-medium">This project will close in 2 days.</p>
          <Button type="button" className="mt-3" onClick={() => extendCxProject(project.id)}>
            Extend Project
          </Button>
        </div>
      ) : null}
      {closed ? (
        <div className="mt-6">
          <Button type="button" variant="outline" onClick={() => extendCxProject(project.id)}>
            Reopen Project
          </Button>
        </div>
      ) : null}
      <p className="mt-3 text-body-sm text-muted">{live ? `Live · ${daysLeft} days left` : "Closed"}</p>

      <section className="mt-10">
        <h2 className="text-h3 font-medium text-foreground">Best Matches</h2>
        {respondents.length === 0 ? (
          <p className="mt-2 text-body text-muted">No responses yet.</p>
        ) : (
          <>
            <ResponseGroup
              title="Can manage your whole project"
              people={matches.whole}
              projectId={project.id}
              homeowner={session.handle}
              readOnly={closed}
              openHandle={openHandle}
              onOpen={setOpenHandle}
              onInterestError={setInterestError}
            />
            <ResponseGroup
              title="Specialty work for part of it"
              people={matches.specialty}
              projectId={project.id}
              homeowner={session.handle}
              readOnly={closed}
              openHandle={openHandle}
              onOpen={setOpenHandle}
              onInterestError={setInterestError}
            />
            <h2 className="mt-10 text-h3 font-medium text-foreground">All Respondents</h2>
            <ResponseGroup
              title="Everyone who responded"
              people={respondents}
              projectId={project.id}
              homeowner={session.handle}
              readOnly={closed}
              openHandle={openHandle}
              onOpen={setOpenHandle}
              onInterestError={setInterestError}
            />
          </>
        )}
        {interestError ? <p className="mt-4 text-body-sm text-destructive">{interestError}</p> : null}
        {openHandle ? (
          <div className="mt-8 rounded-xl border border-border bg-surface p-5 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-h4 font-medium text-foreground">{displayNameFor(openHandle)}</h2>
              <Button type="button" size="sm" variant="ghost" onClick={() => setOpenHandle("")}>
                Back to responses
              </Button>
            </div>
            <VaelanceBody handle={openHandle} publicOnly />
          </div>
        ) : null}
      </section>
    </div>
  );
}

function Media({ photos, video }: { photos: string[]; video: string }) {
  return (
    <div className="mt-2">
      {photos.length > 0 ? (
        <ul className="grid grid-cols-4 gap-2">
          {photos.map((src, index) => (
            <li key={index}>
              <img src={src} alt="" className="h-16 w-full rounded-md object-cover" />
            </li>
          ))}
        </ul>
      ) : null}
      {video ? <video src={video} controls className="mt-2 max-h-40 w-full rounded-md bg-black" /> : null}
    </div>
  );
}

function ResponseGroup({
  title,
  people,
  projectId,
  homeowner,
  readOnly,
  openHandle,
  onOpen,
  onInterestError,
}: {
  title: string;
  people: CxRespondent[];
  projectId: string;
  homeowner: string;
  readOnly: boolean;
  openHandle: string;
  onOpen: (handle: string) => void;
  onInterestError: (value: string) => void;
}) {
  return (
    <div className="mt-6">
      <h3 className="text-body font-medium text-foreground">{title}</h3>
      {people.length === 0 ? (
        <p className="mt-2 text-body-sm text-muted">No one in this group yet.</p>
      ) : (
        <ul className="mt-3 grid gap-4 sm:grid-cols-2">
          {people.map((person) => (
            <li key={`${title}-${person.handle}`}>
              <RespondentCard
                person={person}
                projectId={projectId}
                homeowner={homeowner}
                readOnly={readOnly}
                open={openHandle === person.handle}
                onOpen={() => onOpen(person.handle)}
                onInterestError={onInterestError}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function RespondentCard({
  person,
  projectId,
  homeowner,
  readOnly,
  open,
  onOpen,
  onInterestError,
}: {
  person: CxRespondent;
  projectId: string;
  homeowner: string;
  readOnly: boolean;
  open: boolean;
  onOpen: () => void;
  onInterestError: (value: string) => void;
}) {
  const profile = getCxProfile(person.handle);
  const name = displayNameFor(person.handle);
  const role = profile?.headline || profile?.trade || (person.group === "whole" ? "Whole project" : "Specialty");
  const mutual = person.interest.contractorInterested && person.interest.homeownerInterested;
  return (
    <Card className={open ? "border-foreground" : undefined}>
      <CardHeader className="mb-3">
        <div className="flex items-center gap-3">
          <Avatar name={name} src={profile?.avatar} size="lg" />
          <div className="min-w-0">
            <CardTitle className="truncate">{name}</CardTitle>
            <CardMeta>{role}</CardMeta>
          </div>
        </div>
      </CardHeader>
      <p className="text-body-sm text-muted">
        {person.group === "whole" ? "Whole project" : "Specialty"} · {relativeTime(person.interest.createdAt)}
      </p>
      {profile?.serviceArea || profile?.location ? (
        <p className="mt-2 text-body-sm text-foreground">{profile.serviceArea || profile.location}</p>
      ) : null}
      <CardFooter>
        <Button type="button" size="sm" variant="outline" onClick={onOpen}>
          View VAELance
        </Button>
        {readOnly ? null : (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => toggleSavedContractor(projectId, person.handle, homeowner)}
          >
            {person.interest.savedByHomeowner ? "Saved" : "Save"}
          </Button>
        )}
        {readOnly ? null : mutual ? (
          <p className="text-body-sm font-medium text-foreground">Mutual interest</p>
        ) : (
          <Button
            type="button"
            size="sm"
            onClick={() => {
              try {
                signalHomeownerInterest(projectId, person.handle, homeowner);
                onInterestError("");
              } catch (err) {
                onInterestError(err instanceof Error ? err.message : "Could not signal interest.");
              }
            }}
          >
            Signal Interest
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
