"use client";

import Link from "next/link";
import { getImageUrl } from "@/lib/getImageUrl";

export default function EventCard({ eventItem }: any) {
  const imageUrl = getImageUrl(eventItem?.mediaField);

  return (
    <Link href={`/events/${eventItem?.slug ?? "#"}`} className="block h-full">
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
            <div style={{ width: "100%", height: "100%", background: "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", fontSize: "14px" }}>
              No Image
            </div>
          )}
        </div>

        <div style={{ padding: "16px", display: "flex", flexDirection: "column", flexGrow: 1 }}>
          <p style={{ fontSize: "12px", color: "#6b7280", margin: "0 0 6px 0" }}>
            {eventItem?.startDate ? new Date(eventItem.startDate).toDateString() : ""}
          </p>
          <h2 style={{ fontSize: "14px", fontWeight: 600, color: "#1f2937", marginTop: "6px", marginBottom: "auto", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", minHeight: "40px" }}>
            {eventItem?.name ?? "Untitled Event"}
          </h2>
          <div style={{ marginTop: "12px" }}>
            <span style={{ fontSize: "12px", background: "#dcfce7", color: "#15803d", padding: "4px 10px", borderRadius: "999px" }}>
              Event
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
