import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { findAccountByHandle } from "@/lib/accounts";
import { useCitySession } from "@/lib/citySession";
import {
  attachDraftToHandle,
  CX_BUDGET_BANDS,
  CX_LIVE_DAYS,
  CX_TIMINGS,
  notifyVaelInOfOpportunity,
  patchCxProject,
  RX_PROJECT_CATEGORIES,
  saveProjectContact,
  startCxDraft,
  type CxBudgetBand,
  type CxTiming,
  type RxProjectCategory,
} from "@/lib/cxProjectStore";
import {
  NEED_BUDGET_PATH,
  NEED_HOME_PATH,
  NEED_LOCATION_PATH,
  NEED_REVIEW_PATH,
  NEED_TIMING_PATH,
  NEED_VERIFY_PATH,
  publishedProjectHref,
} from "@/lib/cxRoutes";
import { readNeedWork } from "@/lib/needWork";
import { patchOnboarding } from "@/lib/onboarding";
import { useCxProjects } from "@/lib/useCxProjects";
import { NeedFooter, NeedHead } from "./NeedLayout";

const VERIFY_KEY = "vael_need_verify_v1";
const NOT_SURE = "Not sure yet";

function verifiedContact() {
  if (typeof sessionStorage === "undefined") return { email: "", phone: "", ready: false };
  try {
    const parsed = JSON.parse(sessionStorage.getItem(VERIFY_KEY) || "{}") as {
      email?: string;
      phone?: string;
      emailVerified?: boolean;
      phoneVerified?: boolean;
    };
    return {
      email: parsed.email || "",
      phone: parsed.phone || "",
      ready: Boolean(parsed.emailVerified && parsed.phoneVerified),
    };
  } catch {
    return { email: "", phone: "", ready: false };
  }
}

function isCategory(value: string): value is RxProjectCategory {
  return (RX_PROJECT_CATEGORIES as readonly string[]).includes(value);
}

export function publishResidentialOpportunity(handle: string) {
  const work = readNeedWork();
  const contact = verifiedContact();
  const category = work.categories.find(isCategory);
  if (!category || !handle) throw new Error("Sign in to publish this opportunity.");
  const account = findAccountByHandle(handle);
  const draft = startCxDraft(category);
  saveProjectContact(draft.id, contact.email || account?.email || "", contact.phone || account?.phone || "");
  const attached = attachDraftToHandle(draft.id, handle, account?.displayName.split(" ")[0] || "");
  const publishedAt = new Date().toISOString();
  const liveUntil = new Date(Date.parse(publishedAt) + CX_LIVE_DAYS * 86400000).toISOString();
  const live = patchCxProject(attached.id, {
    description: work.description.trim(),
    photos: work.photos,
    video: work.video,
    city: work.city.trim(),
    postalCode: work.postalCode.trim(),
    timing: work.timing as CxTiming,
    budgetBand: work.budget as CxBudgetBand,
    emailConfirmed: true,
    phoneConfirmed: true,
    status: "live",
    publishedAt,
    liveUntil,
    history: [
      ...attached.history,
      { at: publishedAt, kind: "published", note: "Project published for 7 days." },
    ],
  });
  patchOnboarding(handle, { intent: "out", needPlace: "home" });
  notifyVaelInOfOpportunity(live);
  return draft.id;
}

export function NeedPublishPage() {
  useCxProjects();
  const navigate = useNavigate();
  const { session } = useCitySession();
  const work = readNeedWork();
  const contact = verifiedContact();
  const [error, setError] = useState("");

  if (!contact.ready) return <Navigate to={NEED_VERIFY_PATH} replace />;
  if (work.categories.length === 0) return <Navigate to={NEED_HOME_PATH} replace />;
  if (!work.city.trim()) return <Navigate to={NEED_LOCATION_PATH} replace />;
  if (!(CX_TIMINGS as readonly string[]).includes(work.timing)) return <Navigate to={NEED_TIMING_PATH} replace />;
  if (!(CX_BUDGET_BANDS as readonly string[]).includes(work.budget)) return <Navigate to={NEED_BUDGET_PATH} replace />;

  const categories = work.categories.filter(isCategory);
  const budget = work.budget === NOT_SURE ? "Not sure" : work.budget;
  const hasMedia = work.photos.length > 0 || Boolean(work.video);
  const rows = [
    { label: "Project category", value: categories.join(", ") },
    { label: "Project description", value: work.description.trim() || "None" },
    { label: "Photos / video", value: hasMedia ? "" : "None" },
    { label: "Project location", value: `${work.city.trim()} / ${work.postalCode.trim()}` },
    { label: "Timing", value: work.timing },
    { label: "Budget", value: budget },
  ];

  function publish() {
    try {
      const projectId = publishResidentialOpportunity(session.handle);
      navigate(publishedProjectHref(projectId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not publish this opportunity.");
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <NeedHead
        title="Publish your opportunity"
        lede="Publishing makes this residential project available as an Opportunity for relevant contractors to discover."
      />
      <ul className="mt-8 divide-y divide-border border-y border-border">
        {rows.map((row) => (
          <li key={row.label} className="py-4">
            <p className="text-label font-medium text-muted">{row.label}</p>
            {row.label === "Photos / video" && hasMedia ? (
              <div className="mt-2">
                {work.photos.length > 0 ? (
                  <ul className="grid grid-cols-4 gap-2">
                    {work.photos.map((src, index) => (
                      <li key={index}>
                        <img src={src} alt="" className="h-16 w-full rounded-md object-cover" />
                      </li>
                    ))}
                  </ul>
                ) : null}
                {work.video ? <video src={work.video} controls className="mt-2 max-h-40 w-full rounded-md bg-black" /> : null}
              </div>
            ) : (
              <p className="mt-1 whitespace-pre-wrap text-body text-foreground">{row.value}</p>
            )}
          </li>
        ))}
      </ul>
      {error ? <p className="mt-4 text-body-sm text-destructive">{error}</p> : null}
      <NeedFooter backTo={NEED_REVIEW_PATH} backLabel="Back to Edit">
        <Button type="button" size="lg" className="rounded-lg px-10" onClick={publish}>
          Publish Opportunity
        </Button>
      </NeedFooter>
    </div>
  );
}
