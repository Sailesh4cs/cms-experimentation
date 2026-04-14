"use client";

import EventCard from "./EventCard";

type Props = {
  events: any[];
  variant?: "A" | "B";
};

export default function EventListWithExperiment({ events, variant }: Props) {
  if (!events || events.length === 0) {
    return <p style={{ padding: "24px", color: "#6b7280" }}>No events found.</p>;
  }

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 24px" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h2 style={{ fontSize: "24px", fontWeight: 600, color: "#1f2937", margin: 0 }}>
          Upcoming Events
          {variant && (
            <span style={{ fontSize: "12px", marginLeft: "10px", color: "#9ca3af", fontWeight: 400 }}>
              (Variant {variant})
            </span>
          )}
        </h2>
      </div>

      {/* 3-column grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "24px",
        }}
      >
        {events.map((eventItem: any, index: number) => (
          <div key={`${eventItem?.sys?.id ?? index}-${index}`} style={{ minWidth: 0 }}>
            <EventCard eventItem={eventItem} />
          </div>
        ))}
      </div>
    </div>
  );
}
