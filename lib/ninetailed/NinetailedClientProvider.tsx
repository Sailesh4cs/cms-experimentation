// components/ninetailed/NinetailedClientProvider.tsx
// ─── Ninetailed SDK Provider ──────────────────────────────────────────────────
// Drop this into your web project's layout.tsx to enable A/B experiments.
// Works with Next.js App Router (RSC-safe — "use client" boundary here only).

"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { NinetailedProvider } from "@ninetailed/experience.js-react";
import { NinetailedInsightsPlugin } from "@ninetailed/experience.js-plugin-insights";
import { NinetailedPreviewPlugin } from "@ninetailed/experience.js-plugin-preview";
import { fetchNinetailedContent } from "@/lib/ninetailed/fetchNinetailedContent";
import NinetailedIdentify from "@/components/ninetailed/NinetailedIdentify";
import type { NtContextValue, NtExperience, NtAudience } from "@/lib/ninetailed/types";

// ─── Context — exposes experiences/audiences to any child component ───────────
const NinetailedContext = createContext<NtContextValue>({
  experiences: [],
  audiences: [],
});

/** Hook: access registered NT experiences/audiences anywhere in the tree */
export function useNinetailedExperiences(): NtContextValue {
  return useContext(NinetailedContext);
}

// ─── Provider Props ───────────────────────────────────────────────────────────
interface NinetailedClientProviderProps {
  children: ReactNode;
  /**
   * Override clientId at the provider level (useful for multi-tenant web projects).
   * Falls back to NEXT_PUBLIC_NINETAILED_CLIENT_ID env var.
   */
  clientId?: string;
  /**
   * Override environment (e.g. "main", "staging").
   * Falls back to NEXT_PUBLIC_NINETAILED_ENVIRONMENT env var.
   */
  environment?: string;
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export default function NinetailedClientProvider({
  children,
  clientId,
  environment,
}: NinetailedClientProviderProps) {
  const isPreview = process.env.NODE_ENV !== "production";

  const [ntData, setNtData] = useState<NtContextValue>({
    experiences: [],
    audiences: [],
  });
  const [ready, setReady] = useState(false);

  // Fetch NT content once on mount
  useEffect(() => {
    fetchNinetailedContent().then((data) => {
      setNtData(data);
      setReady(true);
    });
  }, []);

  // Always include Insights plugin
  const plugins: any[] = [new NinetailedInsightsPlugin()];

  // Add Preview plugin only in non-production, after data is ready
  if (isPreview && ready && ntData.experiences.length > 0) {
    plugins.push(
      new NinetailedPreviewPlugin({
        experiences: ntData.experiences as any,
        audiences: ntData.audiences,
        onOpenExperienceEditor: (experience: any) => {
          const spaceId = process.env.NEXT_PUBLIC_CONTENTFUL_SPACE_ID;
          const envId = process.env.NEXT_PUBLIC_CONTENTFUL_ENV ?? "master";
          if (spaceId && experience?.id) {
            window.open(
              `https://app.contentful.com/spaces/${spaceId}/environments/${envId}/entries/${experience.id}`,
              "_blank"
            );
          }
        },
        onOpenAudienceEditor: (audience: any) => {
          const spaceId = process.env.NEXT_PUBLIC_CONTENTFUL_SPACE_ID;
          const envId = process.env.NEXT_PUBLIC_CONTENTFUL_ENV ?? "master";
          if (spaceId && audience?.id) {
            window.open(
              `https://app.contentful.com/spaces/${spaceId}/environments/${envId}/entries/${audience.id}`,
              "_blank"
            );
          }
        },
        ui: { opener: { hide: false } },
      })
    );
  }

  // Stable provider key — remounts NT provider only when mode changes
  const providerKey = !ready ? "nt-loading" : isPreview ? "nt-preview" : "nt-prod";

  // Block render in preview until data is ready — prevents Experience mounting
  // before the preview plugin is wired (causes missed variant assignments)
  if (!ready && isPreview) {
    return (
      <NinetailedContext.Provider value={ntData}>
        <div style={{ minHeight: "100vh" }} />
      </NinetailedContext.Provider>
    );
  }

  return (
    <NinetailedContext.Provider value={ntData}>
      <NinetailedProvider
        key={providerKey}
        clientId={
          clientId ??
          process.env.NEXT_PUBLIC_NINETAILED_CLIENT_ID ??
          ""
        }
        environment={
          environment ??
          process.env.NEXT_PUBLIC_NINETAILED_ENVIRONMENT ??
          "main"
        }
        plugins={plugins}
        // useSDKEvaluation: required when using GraphQL/unindexed CMS
        // Evaluates experiences locally instead of relying on NT edge API
        useSDKEvaluation={true}
        onError={(error) => {
          if (process.env.NODE_ENV !== "production") {
            console.error("[NT:ERROR]", String(error));
          }
        }}
        onInitProfileId={(profileId) => {
          if (process.env.NODE_ENV !== "production") {
            console.log("[NT:INIT] Profile ID:", profileId);
          }
          return profileId;
        }}
      >
        <NinetailedIdentify />
        {children}
      </NinetailedProvider>
    </NinetailedContext.Provider>
  );
}
