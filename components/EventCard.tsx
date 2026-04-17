"use client";

import Link from "next/link";
import { useEffect, useMemo, useCallback } from "react";
import { getImageUrl } from "@/lib/getImageUrl";
import {
  useNinetailed,
  useExperience,
  ExperienceConfiguration,
} from "@ninetailed/experience.js-react";
import { ExperienceMapper } from "@ninetailed/experience.js-utils";
import { useNinetailedExperiences } from "@/components/NinetailedClientProvider";

// ─── Loading skeleton ─────────────────────────────────────────────────────────
function EventCardSkeleton() {
  return (
    <div
      style={{ height: "280px", background: "#f3f4f6", borderRadius: "16px" }}
    />
  );
}

// ─── ExperimentCard ───────────────────────────────────────────────────────────
function ExperimentCard({
  eventItem,
  allEvents = [],
}: {
  eventItem: any;
  allEvents?: any[];
}) {
  const { track } = useNinetailed();
  const { experiences: registeredExperiences } = useNinetailedExperiences();

  const exp = eventItem?.ntExperiencesCollection?.items?.[0];

  console.log("[NT:Card] ▶️", eventItem?.name, {
    sysId: eventItem?.sys?.id,
    expId: exp?.sys?.id ?? "❌ NO EXPERIMENT",
    ntConfig: exp?.ntConfig ?? "❌ MISSING",
    inlineVariants:
      exp?.ntVariantsCollection?.items?.map((v: any) => ({
        id: v?.sys?.id,
        name: v?.name,
      })) ?? [],
    registeredExpIds: registeredExperiences.map((e: any) => e?.id),
  });

  // ── No experiment ─────────────────────────────────────────────────────────
  if (!exp?.sys?.id) {
    // Hide variant-only events — they render only via useExperience swap
    const isVariant = registeredExperiences.some((regExp: any) =>
      (regExp?.components ?? []).some((comp: any) =>
        (comp?.variants ?? []).some((v: any) => v?.id === eventItem?.sys?.id)
      )
    );

    if (isVariant) {
      console.log("[NT:Card] 🙈 HIDING", eventItem?.name, "— variant card");
      return null;
    }

    return (
      <EventCardUI
        eventItem={eventItem}
        onClick={() => {
          console.log("[NT:Click] 🖱️ Standalone card clicked:", eventItem?.name);
          track("ctr", { eventId: eventItem?.sys?.id, variantIndex: 0 });
          track("eventbooking.count", {
            eventId: eventItem?.sys?.id,
            variantIndex: 0,
          });
        }}
      />
    );
  }

  // 🔥 FIX 1 (URGENT) — useMemo on rawExperience
  // ROOT CAUSE: rawExperience was rebuilt as a NEW object on every render.
  // useExperience() received a new reference each time → triggered its own
  // internal state update → caused an infinite re-render loop.
  // FIX: Memoize rawExperience on stable primitive values (exp.sys.id, variant ids).
  const variantIds = useMemo(
    () =>
      (exp?.ntVariantsCollection?.items ?? [])
        .filter((v: any) => v?.sys?.id != null)
        .map((v: any) => v.sys.id as string),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [exp?.sys?.id]
  );

  const rawExperience = useMemo(
    () => ({
      id: exp.sys.id,
      name: exp?.ntName ?? "Experiment",
      type: exp?.ntType ?? "nt_experiment",
      config: exp?.ntConfig ?? {},
      // audience: INTENTIONALLY OMITTED — do NOT add back
      // Omitting audience removes the audience gate so all visitors are eligible.
      variants: (exp?.ntVariantsCollection?.items ?? [])
        .filter((v: any) => v?.sys?.id != null)
        .map((v: any) => ({
          id: v.sys.id, // REQUIRED at top level by ExperienceMapper
          ...v,         // spread all event fields: name, slug, image, date etc.
        })),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [exp?.sys?.id, variantIds.join(",")]
  );

  // OFFICIAL: filter with isExperienceEntry → transform with mapExperience
  const mappedExperiences = useMemo(
    () =>
      [rawExperience]
        .filter((e) => ExperienceMapper.isExperienceEntry(e))
        .map((e) => ExperienceMapper.mapExperience(e)),
    [rawExperience]
  );

  console.log("[NT:Card] 🗺️ mapped:", {
    isExperienceEntry: ExperienceMapper.isExperienceEntry(rawExperience),
    mappedCount: mappedExperiences.length,
    mappedIds: mappedExperiences.map((e: any) => e?.id),
    variantIds: rawExperience.variants.map((v: any) => v?.id),
  });

  if (mappedExperiences.length === 0) {
    console.warn(
      "[NT:Card] ⚠️ ExperienceMapper rejected — ntConfig likely empty.",
      "rawConfig:",
      rawExperience.config
    );
    return <EventCardUI eventItem={eventItem} />;
  }

  return (
    <ExperimentCardInner
      eventItem={eventItem}
      mappedExperiences={mappedExperiences}
      track={track}
    />
  );
}

// ─── Inner — useExperience hook lives here (hooks must not be conditional) ────
function ExperimentCardInner({
  eventItem,
  mappedExperiences,
  track,
}: {
  eventItem: any;
  mappedExperiences: ExperienceConfiguration<any>[];
  track: any;
}) {
  // 🔥 FIX 1 (cont.) — Memoize the baseline object passed to useExperience.
  // ROOT CAUSE: Without memoization, { id, ...eventItem } creates a new object
  // reference on every render → useExperience sees a "new" baseline each time
  // → triggers internal state update → infinite loop.
  const baseline = useMemo(
    () => ({
      id: eventItem.sys.id,
      ...eventItem,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [eventItem?.sys?.id]
  );

  const { variant, variantIndex, loading, isPersonalized } = useExperience({
    baseline,
    experiences: mappedExperiences,
  });

  // ── TRACE LOG: fires on every SDK state change ────────────────────────────
  console.log("[NT:Inner] 🔄 useExperience state:", eventItem?.name, {
    loading,
    isPersonalized,
    variantIndex,
    variantName: (variant as any)?.name ?? null,
    variantId: (variant as any)?.id ?? (variant as any)?.sys?.id ?? null,
    timestamp: new Date().toISOString(),
  });

  // Resolve which event to render:
  // variantIndex 0 = baseline (eventItem)
  // variantIndex 1+ = variant (full event object spread from ntVariantsCollection)
  const finalEvent: any =
    !loading && isPersonalized && variantIndex > 0 && variant != null
      ? variant
      : eventItem;

  console.log(
    "[NT:Inner] 🎯",
    variantIndex > 0
      ? `🔀 VARIANT ${variantIndex} → ${finalEvent?.name}`
      : `✅ BASELINE → ${finalEvent?.name}`
  );

  // 🔥 FIX 1 (cont.) — Stable handleClick via useCallback
  // Prevents a new function reference on every render from being passed to
  // EventCardUI, which would otherwise cause unnecessary re-renders.
  const handleClick = useCallback(() => {
    console.log(
      "[NT:Click] 🖱️ Card clicked:",
      finalEvent?.name,
      "| variantIndex:",
      variantIndex,
      "| eventId:",
      finalEvent?.sys?.id
    );
    track("ctr", { eventId: finalEvent?.sys?.id, variantIndex });
    track("eventbooking.count", {
      eventId: finalEvent?.sys?.id,
      variantIndex,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finalEvent?.sys?.id, variantIndex]);

  // Track impression once variant is resolved (not on every render)
  useEffect(() => {
    if (!loading) {
      console.log(
        "[NT:Inner] 📊 Impression tracked — visit.count:",
        finalEvent?.name,
        "| variantIndex:",
        variantIndex
      );
      track("visit.count", {
        eventId: finalEvent?.sys?.id,
        variantIndex,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, variantIndex]);

  if (loading) {
    console.log("[NT:Inner] ⏳ Loading skeleton for:", eventItem?.name);
    return <EventCardSkeleton />;
  }

  return <EventCardUI eventItem={finalEvent} onClick={handleClick} />;
}

// ─── Pure UI ──────────────────────────────────────────────────────────────────
// Always receives a fully resolved eventItem.
// Used by both standalone (no experiment) and ExperimentCardInner (with experiment).
function EventCardUI({
  eventItem,
  onClick,
}: {
  eventItem: any;
  onClick?: () => void;
}) {
  const imageUrl = getImageUrl(eventItem?.mediaField);

  console.log("[NT:UI] 🖼️ Rendering:", eventItem?.name, {
    slug: eventItem?.slug,
    hasImage: !!imageUrl,
  });

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
        {/* ── Image ── */}
        <div
          style={{
            width: "100%",
            height: "180px",
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={eventItem?.name ?? "Event"}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                background: "#e5e7eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#9ca3af",
                fontSize: "14px",
              }}
            >
              No Image
            </div>
          )}
        </div>

        {/* ── Content ── */}
        <div
          style={{
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            flexGrow: 1,
          }}
        >
          <p
            style={{
              fontSize: "12px",
              color: "#6b7280",
              marginBottom: "6px",
              margin: 0,
            }}
          >
            {eventItem?.startDate
              ? new Date(eventItem.startDate).toDateString()
              : ""}
          </p>
          <h2
            style={{
              fontSize: "14px",
              fontWeight: 600,
              color: "#1f2937",
              marginTop: "6px",
              marginBottom: "auto",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              minHeight: "40px",
            }}
          >
            {eventItem?.name ?? "Untitled Event"}
          </h2>
          <div style={{ marginTop: "12px" }}>
            <span
              style={{
                fontSize: "12px",
                background: "#dcfce7",
                color: "#15803d",
                padding: "4px 10px",
                borderRadius: "999px",
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
