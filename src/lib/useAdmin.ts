import { useEffect, useState } from "react";
import { subscribeAdmin } from "@/lib/adminStore";
import { subscribeCxProjects } from "@/lib/cxProjectStore";
import { subscribeVael } from "@/lib/vaelStore";

/** Re-renders the admin console whenever reports, accounts, content or activity change, in any tab. */
export function useAdmin() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const bump = () => setTick((value) => value + 1);
    const offs = [subscribeAdmin(bump), subscribeCxProjects(bump), subscribeVael(bump)];
    window.addEventListener("storage", bump);
    return () => {
      offs.forEach((off) => off());
      window.removeEventListener("storage", bump);
    };
  }, []);
}
