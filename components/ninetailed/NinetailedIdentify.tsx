// components/ninetailed/NinetailedIdentify.tsx
// ─── Identifies the user and fires a page view on mount ──────────────────────
// Rendered inside NinetailedClientProvider — no need to add it manually.
// IMPORTANT: track("visit.count") is intentionally NOT called here.
// It is tracked in ExperimentCard AFTER the variant resolves, so the event
// is correctly attributed to the experiment bucket in NT Insights.

"use client";

import { useEffect } from "react";
import { useNinetailed } from "@ninetailed/experience.js-react";

export default function NinetailedIdentify() {
  const { identify, page } = useNinetailed();

  useEffect(() => {
    // Persist a stable anonymous user ID across sessions
    let userId = localStorage.getItem("nt-user-id");
    if (!userId) {
      userId = "user-" + Math.random().toString(36).substring(2, 10);
      localStorage.setItem("nt-user-id", userId);
    }

    identify(userId)
      .then(() => page())
      .catch((err) => {
        if (process.env.NODE_ENV !== "production") {
          console.error("[NT] identify/page failed:", err);
        }
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
