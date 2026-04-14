import { getMeetingPlaceData } from "@/lib/getMeetingPlaceData";
import EventListWithExperiment from "@/components/EventListWithExperiment";

export default async function Page() {
  const slug = "events-booking";
  const locale = "en";

  try {
    const events = await getMeetingPlaceData(slug, locale);
    console.log(`✅ Page loaded | Events: ${events.length}`);
    // Pass raw events — let NT SDK handle variant assignment client-side
    return <EventListWithExperiment events={events} />;
  } catch (error) {
    console.error("❌ PAGE ERROR:", error);
    return <div style={{ padding: "24px", color: "red" }}>Failed to load events.</div>;
  }
}
