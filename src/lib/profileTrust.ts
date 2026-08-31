/**
 * Profile fill counts for Trust UX.
 * This is not a trust score and is not used by matching.
 */

export function listedCount(values: Array<string | string[] | number | boolean | undefined | null>) {
  const total = values.length;
  const count = values.filter((value) => {
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value > 0;
    if (Array.isArray(value)) return value.length > 0;
    return Boolean(value && String(value).trim());
  }).length;
  return { count, total, complete: total > 0 && count === total };
}

export const VERIFICATION_KIND = "unverified" as const;

/** Match Detail may mention public documents only — never private file existence. */
export function hasPublicDocuments(docs: Array<{ publicFlag: boolean }>) {
  return docs.some((doc) => doc.publicFlag);
}
