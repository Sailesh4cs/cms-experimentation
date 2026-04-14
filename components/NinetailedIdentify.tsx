"use client";

import { useEffect } from "react";
import { useNinetailed } from "@ninetailed/experience.js-react";
import { usePathname } from "next/navigation";

export default function NinetailedIdentify() {
  const { identify, page, onIsInitialized, profileState } =
    useNinetailed();

  const pathname = usePathname();

  useEffect(() => {
    console.log("[NT] 🚀 NinetailedIdentify mounted | pathname:", pathname);
    console.log("[NT] 🔍 profileState:", profileState);

    onIsInitialized(() => {
      console.log("[NT] ✅ onIsInitialized fired!");

      // ✅ Generate / reuse userId
      let userId = localStorage.getItem("nt-user-id");

      if (!userId) {
        userId = "user-" + Math.random().toString(36).substring(2, 10);
        localStorage.setItem("nt-user-id", userId);
        console.log("[NT] 🆕 New userId:", userId);
      } else {
        console.log("[NT] 🔁 Existing userId:", userId);
      }

      // ✅ Identify user
      identify(userId)
        .then(() => {
          console.log("[NT] ✅ identify success");

          // ✅ Track page view (IMPORTANT)
          return page();
        })
        .then(() => {
          console.log("[NT] ✅ page tracked");
        })
        .catch((err) => {
          console.error("[NT] ❌ Error:", err);
        });
    });

    // ❌ REMOVE fallback tracking (VERY IMPORTANT)
    // No visit tracking here — handled inside ExperimentCard

  }, [pathname]);

  return null;
}