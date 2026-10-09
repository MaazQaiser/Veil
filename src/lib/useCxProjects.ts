import { useEffect, useState } from "react";
import { subscribeCxProjects } from "@/lib/cxProjectStore";

export function useCxProjects() {
  const [, setTick] = useState(0);
  useEffect(() => subscribeCxProjects(() => setTick((value) => value + 1)), []);
}
