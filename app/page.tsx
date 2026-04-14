import { getMeetingPlaceData } from "@/lib/getMeetingPlaceData";
import { getVariant } from "@/lib/experiment";
import { EXPERIMENT } from "@/lib/variantConfig";
import EventListWithExperiment from "@/components/EventListWithExperiment";

export default async function Page() {
  const slug = "events-booking";
  const locale = "en";

  try {
    const [events, variant] = await Promise.all([
      getMeetingPlaceData(slug, locale),
      getVariant(),
    ]);

    // Find which event belongs to this variant using the hardcoded IDs
    const variantEventId = EXPERIMENT.mapping[variant];

    // Resolve each event: if it has an ntExperience with a variant matching
    // the assigned variant ID, swap it in — otherwise show baseline
    const resolvedEvents = events.map((event) => {
      const experience = event?.ntExperiencesCollection?.items?.[0];
      if (!experience) return event;

      const variants = experience?.ntVariantsCollection?.items ?? [];

      // variantIndex: 0 = baseline (Event B), 1 = variant (Event A)
      const isBaseline = event.sys.id === EXPERIMENT.mapping.A;
      const variantItem = variants.find(
        (v) => v.sys.id === variantEventId
      );

      // If this event IS the experiment event, swap based on variant
      if (isBaseline && variant === "B") {
        // Show variant (Event A) instead
        return variantItem ?? event;
      }

      return event;
    });

    console.log(`✅ Page loaded | Variant: ${variant} | Events: ${resolvedEvents.length}`);

    return <EventListWithExperiment events={resolvedEvents} variant={variant} />;
  } catch (error) {
    console.error("❌ PAGE ERROR:", error);
    return (
      <div style={{ padding: "24px", color: "red" }}>
        Failed to load events.
      </div>
    );
  }
}
