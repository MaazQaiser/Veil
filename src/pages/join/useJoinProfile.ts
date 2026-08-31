import { useState } from "react";
import { useCitySession } from "@/lib/citySession";
import { normalizePortfolio } from "@/lib/profileFields";
import { useVael } from "@/lib/vaelCore";
import type { ProfileRecord } from "@/lib/vaelStore";

export function useJoinProfile() {
  const { session } = useCitySession();
  const vael = useVael();
  const existing = vael.ensureMine();
  const [form, setForm] = useState<ProfileRecord>(
    existing ?? {
      handle: session.handle,
      displayName: "",
      profileType: "individual",
      headline: "",
      bio: "",
      disciplines: [],
      skills: [],
      tools: [],
      experience: "",
      credentials: "",
      location: "",
      rates: "",
      portfolio: [],
    },
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  function set<K extends keyof ProfileRecord>(key: K, value: ProfileRecord[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  }

  function persist(next = form) {
    const headline = next.headline.trim() || next.disciplines[0] || next.displayName;
    vael.writeProfile({
      ...next,
      handle: session.handle,
      displayName: next.displayName.trim(),
      headline,
      location: next.location.trim(),
      portfolio: normalizePortfolio(next.portfolio),
    });
  }

  return { session, vael, form, set, persist, errors, setErrors };
}
