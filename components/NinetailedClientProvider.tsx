"use client";

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
        const msg = String(error);
        console.error("[NT:ERROR] ❌", msg);
      }}
      onInitProfileId={(profileId) => {
        console.log("[NT:INIT] ✅ Profile ID:", profileId);
        console.log("[NT:INIT] 🌍 clientId:", process.env.NEXT_PUBLIC_NINETAILED_CLIENT_ID);
        console.log("[NT:INIT] 🌍 environment:", process.env.NEXT_PUBLIC_NINETAILED_ENVIRONMENT);
        return profileId;
      }}
    >
      <NinetailedIdentify />
      {children}
    </NinetailedProvider>
  );
}
