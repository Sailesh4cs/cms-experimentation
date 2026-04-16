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

    // FIX: Removed track("visit.count") from here.
    // Reason: This fires BEFORE the experiment variant is resolved, so the
    // event is NOT attributed to any experiment bucket → shows blank in insights.
    // visit.count is now tracked ONLY in EventCard.tsx after variant resolves
    // (when loading === false), ensuring correct experiment attribution.
    identify(userId)
      .then(() => page())
      .then(() => console.log("[NT] ✅ identify + page tracked"))
      .catch((err) => console.error("[NT] ❌ tracking failed:", err));
  }, []);

  return null;
}
