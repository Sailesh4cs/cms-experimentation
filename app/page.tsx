import { getMeetingPlaceData } from "@/lib/getMeetingPlaceData";
import { getVariant } from "@/lib/experiment";
import EventListWithExperiment from "@/components/EventListWithExperiment";

export default async function Page() {
  const slug = "events-booking";
  const locale = "en";

  try {
    const [events, variant] = await Promise.all([
      getMeetingPlaceData(slug, locale),
      getVariant(),
    ]);

    // variant "A" → show baseline (index 0 = Event B)
    // variant "B" → show NT variant (index 1 = Event A)
    const variantIndex = variant === "B" ? 1 : 0;

    console.log(`🎯 Cookie Variant: ${variant} → variantIndex: ${variantIndex}`);

    const resolvedEvents = events.map((event) => {
      const ntVariants =
        event?.ntExperiencesCollection?.items?.[0]
          ?.ntVariantsCollection?.items ?? [];

      console.log(
        `📦 Event: "${event.name}" | NT variants: ${ntVariants.length}`,
        ntVariants.map((v: any) => v.name)
      );

      // No experiment on this event — show as-is
      if (!ntVariants.length) return event;

      // variantIndex 0 → baseline (the event itself)
      // variantIndex 1 → first NT variant (Event A)
      if (variantIndex === 0) {
        console.log(`✅ Showing BASELINE: ${event.name}`);
        return event;
      }

      const selectedVariant = ntVariants[variantIndex - 1]; // index 1 → ntVariants[0]
      if (selectedVariant) {
        console.log(`✅ Showing NT VARIANT: ${selectedVariant.name}`);
        return selectedVariant;
      }

      return event;
    });

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
