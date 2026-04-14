import { EventItem } from "./types";

export function resolveNinetailedVariant(
  event: any,
  variantIndex: number
): EventItem {
  const experience =
    event?.nt_experiencesCollection?.items?.[0];

  if (!experience) return event;

  const variants = experience?.ntVariantsCollection?.items;

  if (!variants || !variants.length) return event;

  // pick variant based on index (0 or 1)
  return variants[variantIndex] || event;
}