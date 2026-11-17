import { useEffect, useState } from "react";
import { subscribeCxProjects } from "@/lib/cxProjectStore";
import { subscribeVael } from "@/lib/vaelStore";

/**
 * Re-renders when opportunities, interest, questions or messages change, including changes made in
 * another tab of the same browser, so activity shows up without a refresh.
 */
export function useCxProjects() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const bump = () => setTick((value) => value + 1);
    const offProjects = subscribeCxProjects(bump);
    const offVael = subscribeVael(bump);
    window.addEventListener("storage", bump);
    return () => {
      offProjects();
      offVael();
      window.removeEventListener("storage", bump);
    };
  }, []);
}
