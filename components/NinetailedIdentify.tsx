"use client";

import { useEffect } from "react";
import { useNinetailed } from "@ninetailed/experience.js-react";
import { usePathname } from "next/navigation";

export default function NinetailedIdentify() {
  const { identify, page, track, onIsInitialized, profileState } =
    useNinetailed();
  const pathname = usePathname();

  // Log profileState on every render to see NT's internal state
  // console.log("[NT:PROFILE_STATE]", profileState);

  useEffect(() => {
    console.log("[NT] 🚀 NinetailedIdentify mounted | pathname:", pathname);
    console.log("[NT] 🔍 profileState at mount:", profileState);

    // Step 1 — check if onIsInitialized fires at all
    console.log("[NT] ⏳ Waiting for onIsInitialized...");

    onIsInitialized(() => {
      console.log("[NT] ✅ onIsInitialized fired!");

      // Step 2 — userId
      let userId = localStorage.getItem("nt-user-id");
      if (!userId) {
        userId = "user-" + Math.random().toString(36).substring(2, 10);
        localStorage.setItem("nt-user-id", userId);
        console.log("[NT] 🆕 New userId created:", userId);
      } else {
        console.log("[NT] 🔁 Existing userId:", userId);
      }

      // Step 3 — identify
      console.log("[NT] 📤 Calling identify()...");
      identify(userId)
        .then((res) => {
          console.log("[NT] ✅ identify() resolved:", res);

          // Step 4 — page()
          console.log("[NT] 📤 Calling page()...");
          return page();
        })
        .then((res) => {
          console.log("[NT] ✅ page() resolved:", res);

          // Step 5 — track visit.count
          console.log("[NT] 📤 Calling track('visit.count')...");
          return track("visit.count");
        })
        .then((res) => {
          console.log("[NT] ✅ track('visit.count') resolved:", res);
        })
        .catch((err) => {
          console.error("[NT] ❌ Chain failed at some step:", err);
        });
    });

    // Fallback: if onIsInitialized never fires after 5s
    const timeout = setTimeout(() => {
      console.error(
        "[NT] ⚠️ onIsInitialized did NOT fire after 5 seconds! NT may not be initialized."
      );
      console.log("[NT] 🔍 profileState after 5s timeout:", profileState);

      // Try calling without waiting for init
      console.log("[NT] 🔄 Attempting track() without init guard...");
      track("visit.count")
        .then((res) => {
          console.log("[NT] ✅ track() without init guard resolved:", res);
        })
        .catch((err) => {
          console.error("[NT] ❌ track() without init guard failed:", err);
        });
    }, 5000);

    return () => clearTimeout(timeout);
  }, [pathname]);

  return null;
}
