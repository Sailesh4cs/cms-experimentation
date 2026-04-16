"use client";

import Link from "next/link";
import { useEffect } from "react";
import { getImageUrl } from "@/lib/getImageUrl";
import {
  useNinetailed,
  useExperience,
  ExperienceConfiguration,
} from "@ninetailed/experience.js-react";

function ExperimentCard({ eventItem }: { eventItem: any }) {
  const { track } = useNinetailed();

  const exp = eventItem?.ntExperiencesCollection?.items?.[0];

  // No experiment attached → render baseline card directly
  if (!exp?.sys?.id) {
    return <EventCardUI eventItem={eventItem} />;
  }

  const rawVariants = exp?.ntVariantsCollection?.items ?? [];
  const safeVariants = rawVariants
    .filter((v: any) => v != null && v?.sys?.id != null)
    .map((v: any) => ({ ...v, id: v.sys.id }));

  if (safeVariants.length === 0) {
    return <EventCardUI eventItem={eventItem} />;
  }

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

  const { variant, variantIndex, loading, isPersonalized } = useExperience({
    baseline: { ...eventItem, id: eventItem.sys.id },
    experiences,
  });

  // Use NT-assigned variant; fall back to baseline
  const finalEvent: any =
    isPersonalized && variant ? variant : eventItem;

  // Track visit.count once NT has resolved the variant
  useEffect(() => {
    if (!loading && finalEvent) {
      track("visit.count", {
        eventId: finalEvent?.sys?.id,
        variantIndex,
      });
    }
  }, [loading]);

  const handleClick = () => {
    track("ctr", { eventId: finalEvent?.sys?.id, variantIndex });
    track("eventbooking.count", { eventId: finalEvent?.sys?.id, variantIndex });
  };

  if (loading) {
    return (
      <div
        style={{ height: "280px", background: "#f3f4f6", borderRadius: "16px" }}
      />
    );
  }

  return <EventCardUI eventItem={finalEvent} onClick={handleClick} />;
}

// ─── Pure UI ────────────────────────────────────────────
function EventCardUI({
  eventItem,
  onClick,
}: {
  eventItem: any;
  onClick?: () => void;
}) {
  const imageUrl = getImageUrl(eventItem?.mediaField);

  return (
    <Link
      href={`/events/${eventItem?.slug ?? "#"}`}
      className="block h-full"
      onClick={onClick}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "16px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          cursor: "pointer",
        }}
      >
        <div style={{ width: "100%", height: "180px", overflow: "hidden", flexShrink: 0 }}>
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={eventItem?.name ?? "Event"}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <div
              style={{
                width: "100%", height: "100%", background: "#e5e7eb",
                display: "flex", alignItems: "center",
                justifyContent: "center", color: "#9ca3af", fontSize: "14px",
              }}
            >
              No Image
            </div>
          )}
        </div>
        <div style={{ padding: "16px", display: "flex", flexDirection: "column", flexGrow: 1 }}>
          <p style={{ fontSize: "12px", color: "#6b7280", marginBottom: "6px", margin: 0 }}>
            {eventItem?.startDate
              ? new Date(eventItem.startDate).toDateString()
              : ""}
          </p>
          <h2
            style={{
              fontSize: "14px", fontWeight: 600, color: "#1f2937",
              marginTop: "6px", marginBottom: "auto",
              display: "-webkit-box", WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical", overflow: "hidden", minHeight: "40px",
            }}
          >
            {eventItem?.name ?? "Untitled Event"}
          </h2>
          <div style={{ marginTop: "12px" }}>
            <span
              style={{
                fontSize: "12px", background: "#dcfce7",
                color: "#15803d", padding: "4px 10px", borderRadius: "999px",
              }}
            >
              Event
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default ExperimentCard;