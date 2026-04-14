"use client";

import { useEffect } from "react";
import { useNinetailed } from "@ninetailed/experience.js-react";
import { usePathname } from "next/navigation";

export default function NinetailedIdentify() {
  const { identify, page, track, onIsInitialized, profileState } =
    useNinetailed();
  const pathname = usePathname();

  // console.log("[NT:PROFILE_STATE]", profileState);

  useEffect(() => {
    console.log("[NT] 🚀 NinetailedIdentify mounted | pathname:", pathname);

    onIsInitialized(() => {
      console.log("[NT] ✅ onIsInitialized fired!");

      // Step 1 — userId
      let userId = localStorage.getItem("nt-user-id");
      if (!userId) {
        userId = "user-" + Math.random().toString(36).substring(2, 10);
        localStorage.setItem("nt-user-id", userId);
        console.log("[NT] 🆕 New userId:", userId);
      } else {
        console.log("[NT] 🔁 Existing userId:", userId);
      }

      // Step 2 — identify → page → visit.count
      identify(userId)
        .then(() => {
          console.log("[NT] ✅ identify success");
          return page();
        })
        .then(() => {
          console.log("[NT] ✅ page tracked");

          // ✅ This feeds the "Visit Count" metric in NT Insights
          return track("visit.count");
        })
        .then((res) => {
          console.log("[NT] ✅ visit.count tracked | response:", res);
          console.log("[NT] 📊 profileState after track:", profileState);
        })

        .then(() => {
          console.log("[NT] ✅ visit.count tracked → should appear in Insights");
        })
        .catch((err) => {
          console.error("[NT] ❌ Chain failed:", err);
        });
    });
  }, [pathname]);

  return null;
}
