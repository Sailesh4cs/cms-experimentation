"use client";

import EventCard from "./EventCard";

type Props = {
  events: any[];
};

export default function EventListWithExperiment({ events }: Props) {
  if (!events || events.length === 0) {
    return <p style={{ padding: "24px", color: "#6b7280" }}>No events found.</p>;
  }

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 24px" }}>
      <h2 style={{ fontSize: "24px", fontWeight: 600, color: "#1f2937", marginBottom: "24px" }}>
        Upcoming Events
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px" }}>
        {events.map((eventItem: any, index: number) => (
          <div key={`${eventItem?.sys?.id ?? index}`} style={{ minWidth: 0 }}>
            <EventCard eventItem={eventItem} />
          </div>
        ))}
      </div>
    </div>
  );
}
