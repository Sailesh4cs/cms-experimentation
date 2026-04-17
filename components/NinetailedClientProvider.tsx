"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { NinetailedProvider } from "@ninetailed/experience.js-react";
import { NinetailedInsightsPlugin } from "@ninetailed/experience.js-plugin-insights";
import { NinetailedPreviewPlugin } from "@ninetailed/experience.js-plugin-preview";
import NinetailedIdentify from "@/components/NinetailedIdentify";

type NtAudience = { id: string; name: string; description?: string };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type NtExperience = any;

type NtContextValue = { experiences: NtExperience[]; audiences: NtAudience[] };

const NinetailedContext = createContext<NtContextValue>({
  experiences: [],
  audiences: [],
});

export function useNinetailedExperiences() {
  return useContext(NinetailedContext);
}

async function fetchNinetailedContent(): Promise<NtContextValue> {
  const spaceId = process.env.NEXT_PUBLIC_CONTENTFUL_SPACE_ID;
  const accessToken = process.env.NEXT_PUBLIC_CONTENTFUL_ACCESS_TOKEN;
  const env = process.env.NEXT_PUBLIC_CONTENTFUL_ENV ?? "master";

  if (!spaceId || !accessToken) {
    console.warn("[NT] ⚠️ Missing Contentful env vars");
    return { experiences: [], audiences: [] };
  }

  const base = `https://cdn.contentful.com/spaces/${spaceId}/environments/${env}`;
  const token = `access_token=${accessToken}&include=2&limit=200`;

  try {
    const [expRes, audRes] = await Promise.all([
      fetch(`${base}/entries?content_type=nt_experience&${token}`),
      fetch(`${base}/entries?content_type=nt_audience&${token}`),
    ]);

    const expJson = await expRes.json();
    const audJson = await audRes.json();

    console.log("[NT] ✅ Experience entries:", expJson.items?.length ?? 0);
    console.log("[NT] ✅ Audience entries:", audJson.items?.length ?? 0);

    const audiences: NtAudience[] = (audJson.items ?? []).map((item: any) => ({
      id: String(item.fields?.nt_audience_id ?? item.sys?.id ?? ""),
      name: String(item.fields?.nt_name ?? "Unnamed Audience"),
      description: String(item.fields?.nt_description ?? ""),
    }));

    const audienceBySysId = new Map<string, NtAudience>(
      (audJson.items ?? []).map((item: any) => [
        item.sys?.id,
        {
          id: String(item.fields?.nt_audience_id ?? item.sys?.id ?? ""),
          name: String(item.fields?.nt_name ?? "All Visitors"),
          description: String(item.fields?.nt_description ?? ""),
        },
      ])
    );

    const experiences: NtExperience[] = (expJson.items ?? [])
      .map((item: any): NtExperience | null => {
        const f = item.fields ?? {};
        const config = f.nt_config ?? {};

        const rawDist: number[] = Array.isArray(config.distribution)
          ? config.distribution
          : [0.5, 0.5];

        const distribution = rawDist.map((pct: number, i: number) => {
          const start = rawDist
            .slice(0, i)
            .reduce((a: number, b: number) => a + b, 0);
          const end = start + pct;
          return {
            index: i,
            start: Math.round(start * 100) / 100,
            end: Math.round(end * 100) / 100,
          };
        });

        const trafficAllocation =
          typeof config.traffic === "number" ? config.traffic : 1;

        const rawComponents: any[] = config.components ?? [];

        // 🔶 FIX 2 (MEDIUM) — Enforce type: "nt_experience" on every component
        // ROOT CAUSE: Contentful's nt_config may not include the `type` field
        // on each component object. The NT SDK uses type === "nt_experience" as
        // a gate before processing the component. If missing, the experience is
        // silently skipped → variants are never served → insights show no data.
        // FIX: Always set type: "nt_experience" when mapping components.
        const components = rawComponents
          .filter((c: any) => String(c?.baseline?.id ?? "") !== "")
          .map((c: any) => ({
            type: "nt_experience", // ← ALWAYS enforce; do not rely on Contentful to set this
            baseline: { id: String(c.baseline.id) },
            variants: (c.variants ?? [])
              .filter((v: any) => String(v?.id ?? "") !== "")
              .map((v: any) => ({ id: String(v.id) })),
          }));

        if (components.length === 0) {
          console.warn(`[NT] Skipping ${item.sys?.id} — no valid components`);
          return null;
        }

        const audienceSysId = f.nt_audience?.sys?.id;
        const resolvedAudience = audienceSysId
          ? audienceBySysId.get(audienceSysId) ?? {
              id: String(audienceSysId),
              name: "All Visitors",
            }
          : undefined;

        const variantRefs: any[] = f.nt_variants ?? [];
        const variants = variantRefs.map((v: any, i: number) => ({
          id: String(v?.sys?.id ?? v?.id ?? `variant-${i}`),
          name: String(
            v?.fields?.name ??
              v?.fields?.nt_name ??
              v?.name ??
              `Variant ${i + 1}`
          ),
        }));

        const rawType = String(f.nt_type ?? "nt_experiment");
        const type = rawType.startsWith("nt_") ? rawType : `nt_${rawType}`;

        const experience: NtExperience = {
          id: String(item.sys?.id ?? ""),
          name: String(f.nt_name ?? "Unnamed Experience"),
          type,
          trafficAllocation,
          distribution,
          components,
          audience: resolvedAudience,
          variants,
        };

        console.log(
          "[NT] ✅ Mapped experience:",
          JSON.stringify(experience, null, 2)
        );
        return experience;
      })
      .filter((exp: NtExperience | null): exp is NtExperience => exp !== null);

    console.log(
      `[NT] ✅ Final: ${experiences.length} experience(s), ${audiences.length} audience(s)`
    );
    return { experiences, audiences };
  } catch (err) {
    console.error("[NT] ❌ Contentful fetch failed:", err);
    return { experiences: [], audiences: [] };
  }
}

export default function NinetailedClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const isPreview = process.env.NODE_ENV !== "production";

  const [ntData, setNtData] = useState<NtContextValue>({
    experiences: [],
    audiences: [],
  });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetchNinetailedContent().then((data) => {
      setNtData(data);
      setReady(true);
    });
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const plugins: any[] = [new NinetailedInsightsPlugin()];

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

  const providerKey = !ready
    ? "nt-loading"
    : isPreview
    ? "nt-preview"
    : "nt-prod";

  // Block render until preview plugin is ready
  // Prevents <Experience> mounting before preview plugin is wired
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
          process.env.NEXT_PUBLIC_NINETAILED_CLIENT_ID ??
          "598aeaf8-5f3f-4cf3-95b4-39e9f4076044"
        }
        environment={process.env.NEXT_PUBLIC_NINETAILED_ENVIRONMENT ?? "main"}
        plugins={plugins}
        // CRITICAL: GraphQL = unindexed CMS → must evaluate experiences locally
        useSDKEvaluation={true}
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
        <NinetailedIdentify />
        {children}
      </NinetailedProvider>
    </NinetailedContext.Provider>
  );
}
