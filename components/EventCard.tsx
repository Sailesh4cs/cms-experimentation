"use client";

import Link from "next/link";
import { getImageUrl } from "@/lib/getImageUrl";
import { useNinetailed, useExperience, ExperienceConfiguration } from "@ninetailed/experience.js-react";

// ─── Experiment card — only rendered when event has NT experience ──────────
function ExperimentCard({ eventItem }: { eventItem: any }) {
  const { track } = useNinetailed();

  const exp = eventItem?.ntExperiencesCollection?.items?.[0];

  const rawVariants = exp?.ntVariantsCollection?.items ?? [];
  const safeVariants = rawVariants
    .filter((v: any) => v != null && v?.sys?.id != null)
    .map((v: any) => ({ ...v, id: v.sys.id }));

  console.log("[NT:EXP_CARD] exp sys.id:", exp?.sys?.id);
  console.log("[NT:EXP_CARD] safeVariants:", safeVariants.map((v: any) => `${v.id} - ${v.name}`));

  // ✅ Correct ExperienceConfiguration shape
const experiences = [
  {
    id: exp.sys.id,
    name: exp?.ntName ?? "Experiment",
    type: exp?.ntType ?? "experiment",
    trafficAllocation: 1,
    distribution: [
      { index: 0, start: 0, end: 0.5 },
      { index: 1, start: 0.5, end: 1 },
    ],
    components: [
      {
        type: "nt_experience",
        baseline: { id: eventItem.sys.id },
        variants: safeVariants.map((v: any) => ({ id: v.id })),
      },
    ],
    audience: exp?.ntAudience?.sys?.id
      ? { id: exp.ntAudience.sys.id as string }
      : undefined,
    variants: safeVariants,
  },
] as unknown as ExperienceConfiguration<any>[];

  // console.log("[NT:EXP_CARD] experiences:", JSON.stringify(experiences, null, 2));

  const { variant, variantIndex, loading, isPersonalized } = useExperience({
    baseline: { ...eventItem, id: eventItem.sys.id },
    experiences,
  });

  console.log(
    `[NT:EXPERIENCE] "${eventItem?.name}" | variantIndex: ${variantIndex} | isPersonalized: ${isPersonalized} | loading: ${loading}`
  );

  if (loading) {
    return (
      <div style={{ height: "280px", background: "#f3f4f6", borderRadius: "16px" }} />
    );
  }

  // Read middleware variant cookie
const getMiddlewareVariant = (): "A" | "B" | null => {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)event_ab_test=([AB])/);
  return match ? (match[1] as "A" | "B") : null;
};

// After useExperience hook...
const middlewareVariant = getMiddlewareVariant();

console.log(`[NT:MIDDLEWARE_VARIANT] "${eventItem?.name}" | cookie: ${middlewareVariant}`);

// NT client works → use it. Otherwise fall back to middleware cookie.
const finalEvent: any =
  isPersonalized && variant
    ? variant                                    // ✅ NT decided
    : middlewareVariant === "A" && safeVariants[0]
      ? safeVariants[0]                          // ✅ middleware says A → show Event A
      : eventItem;                               // ✅ default → show Event B (baseline)


  const handleClick = () => {
    track("ctr", { eventId: finalEvent?.sys?.id, eventName: finalEvent?.name });
    track("eventbooking.count", { eventId: finalEvent?.sys?.id });
  };

  return <EventCardUI eventItem={finalEvent} onClick={handleClick} />;
}


// ─── Plain card — no experiment ────────────────────────────────────────────
function PlainCard({ eventItem }: { eventItem: any }) {
  return <EventCardUI eventItem={eventItem} />;
}

// ─── Shared UI ─────────────────────────────────────────────────────────────
function EventCardUI({ eventItem, onClick }: { eventItem: any; onClick?: () => void }) {
  const imageUrl = getImageUrl(eventItem?.mediaField);

  return (
    <Link
      href={`/events/${eventItem?.slug ?? "#"}`}
      className="block h-full"
      onClick={onClick}
    >
      <div style={{
        background: "#fff", borderRadius: "16px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.10)", overflow: "hidden",
        display: "flex", flexDirection: "column", height: "100%", cursor: "pointer",
      }}>
        <div style={{ width: "100%", height: "180px", overflow: "hidden", flexShrink: 0 }}>
          {imageUrl ? (
            <img src={imageUrl} alt={eventItem?.name ?? "Event"}
              style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div style={{
              width: "100%", height: "100%", background: "#e5e7eb",
              display: "flex", alignItems: "center",
              justifyContent: "center", color: "#9ca3af", fontSize: "14px",
            }}>No Image</div>
          )}
        </div>
        <div style={{ padding: "16px", display: "flex", flexDirection: "column", flexGrow: 1 }}>
          <p style={{ fontSize: "12px", color: "#6b7280", margin: "0 0 6px 0" }}>
            {eventItem?.startDate ? new Date(eventItem.startDate).toDateString() : ""}
          </p>
          <h2 style={{
            fontSize: "14px", fontWeight: 600, color: "#1f2937",
            marginTop: "6px", marginBottom: "auto",
            display: "-webkit-box", WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical", overflow: "hidden", minHeight: "40px",
          }}>
            {eventItem?.name ?? "Untitled Event"}
          </h2>
          <div style={{ marginTop: "12px" }}>
            <span style={{
              fontSize: "12px", background: "#dcfce7",
              color: "#15803d", padding: "4px 10px", borderRadius: "999px",
            }}>Event</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Main export ───────────────────────────────────────────────────────────
export default function EventCard({ eventItem }: any) {
  const hasExperiment =
    (eventItem?.ntExperiencesCollection?.items?.length ?? 0) > 0 &&
    eventItem?.ntExperiencesCollection?.items?.[0]?.sys?.id != null;

  console.log(`[NT:CARD] "${eventItem?.name}" | hasExperiment: ${hasExperiment}`);

  if (hasExperiment) return <ExperimentCard eventItem={eventItem} />;
  return <PlainCard eventItem={eventItem} />;
}
