import { Link } from "react-router-dom";
import { IconChevronLeft } from "@/components/ui/icons";
import { PRODUCT_HOME } from "@/lib/providerJourney";

/**
 * Back out of the Avail flow, to the signed-in Home — never to the Create
 * side. Avail and Create are two different accounts on this device; a
 * Vael In page must not link into Vael Out's flow, or vice versa.
 */
export function ResidentialAreas() {
  return (
    <Link
      to={PRODUCT_HOME}
      className="inline-flex items-center gap-1.5 text-body-sm font-medium text-muted hover:text-foreground"
    >
      <IconChevronLeft className="h-3.5 w-3.5" />
      Back to Home
    </Link>
  );
}
