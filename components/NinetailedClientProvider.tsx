"use client";

import { useEffect } from "react";
import { NinetailedProvider } from "@ninetailed/experience.js-react";
import { NinetailedInsightsPlugin } from "@ninetailed/experience.js-plugin-insights";
import NinetailedIdentify from "@/components/NinetailedIdentify";

export default function NinetailedClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NinetailedProvider
      clientId={
        process.env.NEXT_PUBLIC_NINETAILED_CLIENT_ID ??
        "598aeaf8-5f3f-4cf3-95b4-39e9f4076044"
      }
      environment={
        process.env.NEXT_PUBLIC_NINETAILED_ENVIRONMENT ?? "development"
      }
      plugins={[new NinetailedInsightsPlugin()] as any}
      onLog={(level: unknown, ...args: unknown[]) => {
        console.log(`[NT:${level}]`, ...args);
      }}
      onError={(error) => {
        console.error("[NT:ERROR] ❌", String(error));
      }}
      onInitProfileId={(profileId) => {
        console.log("[NT:INIT] ✅ Profile ID:", profileId);
        return profileId;
      }}
    >
      <NTCookieCleaner />
      <NinetailedIdentify />
      {children}
    </NinetailedProvider>
  );
}

// Clears stale NT cookies client-side without blocking the provider
function NTCookieCleaner() {
  useEffect(() => {
    const stale = ["__nt_anonymous_id__", "__nt_profile__", "__nt_experiences__"];
    let cleared = false;

    stale.forEach((name) => {
      if (document.cookie.includes(name)) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        console.log("[NT] 🧹 Cleared stale cookie:", name);
        cleared = true;
      }
    });

    // Reload once after clearing so NT starts fresh
    if (cleared) {
      console.log("[NT] 🔄 Reloading to start fresh profile...");
      window.location.reload();
    }
  }, []);

  return null;
}
