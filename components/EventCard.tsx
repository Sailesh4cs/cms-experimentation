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

  // ✅ SAFE extraction
  const exp = eventItem?.ntExperiencesCollection?.items?.[0];

  // ✅ If no experiment → fallback UI
  if (!exp || !exp?.sys?.id) {
    console.warn("[NT] ❌ No experiment found → fallback to normal card");
    return <EventCardUI eventItem={eventItem} />;
  }

  const rawVariants = exp?.ntVariantsCollection?.items ?? [];
  const safeVariants = rawVariants
    .filter((v: any) => v != null && v?.sys?.id != null)
    .map((v: any) => ({ ...v, id: v.sys.id }));

  // ✅ Extra safety: if no variants
  if (safeVariants.length === 0) {
    console.warn("[NT] ❌ No variants found → fallback");
    return <EventCardUI eventItem={eventItem} />;
  }

  // ─── Experience Config ─────────────────────────────────
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

  const { variant, variantIndex, loading, isPersonalized } =
    useExperience({
      baseline: { ...eventItem, id: eventItem.sys.id },
      experiences,
    });

  // ─── Middleware fallback ───────────────────────────────
  const getMiddlewareVariant = (): "A" | "B" | null => {
    if (typeof document === "undefined") return null;
    const match = document.cookie.match(/(?:^|;\s*)event_ab_test=([AB])/);
    return match ? (match[1] as "A" | "B") : null;
  };

  const middlewareVariant = getMiddlewareVariant();

  const finalEvent: any =
    isPersonalized && variant
      ? variant
      : middlewareVariant === "A" && safeVariants[0]
      ? safeVariants[0]
      : eventItem;

  // ─── ✅ Track visit correctly ──────────────────────────
  useEffect(() => {
    if (!loading && finalEvent) {
      track("visit.count", {
        eventId: finalEvent?.sys?.id,
        variantIndex,
      });
    }
  }, [loading, finalEvent]);

  const handleClick = () => {
    track("ctr", {
      eventId: finalEvent?.sys?.id,
      variantIndex,
    });

    track("eventbooking.count", {
      eventId: finalEvent?.sys?.id,
      variantIndex,
    });
  };

  if (loading) {
    return (
      <div
        style={{
          height: "280px",
          background: "#f3f4f6",
          borderRadius: "16px",
        }}
      />
    );
  }

  return <EventCardUI eventItem={finalEvent} onClick={handleClick} />;
}

// ─── UI Component ───────────────────────────────────────
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
      <div style={{ padding: "16px" }}>
        <h3>{eventItem?.name}</h3>
        {imageUrl && <img src={imageUrl} alt={eventItem?.name} />}
      </div>
    </Link>
  );
}

export default ExperimentCard;