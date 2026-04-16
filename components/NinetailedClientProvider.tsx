"use client";

import { useEffect, useState } from "react";
import { NinetailedProvider } from "@ninetailed/experience.js-react";
import { NinetailedInsightsPlugin } from "@ninetailed/experience.js-plugin-insights";
import { NinetailedPreviewPlugin } from "@ninetailed/experience.js-plugin-preview";
import NinetailedIdentify from "@/components/NinetailedIdentify";

type NtAudience = {
  id: string;
  name: string;
  description?: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type NtExperience = any;

// ─── Contentful fetcher ───────────────────────────────────────────────────────
async function fetchNinetailedContent(): Promise<{
  experiences: NtExperience[];
  audiences: NtAudience[];
}> {
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
      // FIX 2: correct content type is "nt_audience" (singular), not "nt_audiences"
      fetch(`${base}/entries?content_type=nt_audience&${token}`),
    ]);

    const expJson = await expRes.json();
    const audJson = await audRes.json();

    console.log("[NT] Experience entries:", expJson.items?.length ?? 0);
    console.log("[NT] Audience entries:", audJson.items?.length ?? 0);

    // ── Map audiences ─────────────────────────────────────────────────────────
    const audiences: NtAudience[] = (audJson.items ?? []).map((item: any) => ({
      id: String(item.fields?.nt_audience_id ?? item.sys?.id ?? ""),
      name: String(item.fields?.nt_name ?? "Unnamed Audience"),
      description: String(item.fields?.nt_description ?? ""),
    }));

    // Lookup map: sys.id → audience object (for resolving audience refs)
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

    // ── Map experiences ───────────────────────────────────────────────────────
    const experiences: NtExperience[] = (expJson.items ?? [])
      .map((item: any): NtExperience | null => {
        const f = item.fields ?? {};
        const config = f.nt_config ?? {};

        // FIX 1: distribution from Contentful NT App is [0.5, 0.5] (array of numbers).
        // The preview plugin expects [{index, start, end}] objects.
        // Convert the percentage array into the correct object format.
        const rawDist: number[] = Array.isArray(config.distribution)
          ? config.distribution
          : [0.5, 0.5];

        const distribution = rawDist.map((pct: number, i: number) => {
          // Convert cumulative percentages to start/end ranges
          const start = rawDist.slice(0, i).reduce((a: number, b: number) => a + b, 0);
          const end = start + pct;
          return { index: i, start: Math.round(start * 100) / 100, end: Math.round(end * 100) / 100 };
        });

        const trafficAllocation =
          typeof config.traffic === "number" ? config.traffic : 1;

        // FIX 3: filter out empty/ghost components where baseline.id is empty string
        const rawComponents: any[] = config.components ?? [];
        const components = rawComponents
          .filter((c: any) => {
            const baselineId = c?.baseline?.id ?? "";
            return baselineId !== ""; // skip ghost components with empty baseline id
          })
          .map((c: any) => ({
            type: "nt_experience", // required by preview plugin
            baseline: { id: String(c.baseline?.id ?? "") },
            variants: (c.variants ?? [])
              .filter((v: any) => String(v?.id ?? "") !== "") // skip empty variant ids
              .map((v: any) => ({ id: String(v.id) })),
          }));

        if (components.length === 0) {
          console.warn(`[NT] Skipping experience ${item.sys?.id} — no valid components`);
          return null;
        }

        // Resolve audience: look up by sys.id to get full { id, name } object
        const audienceSysId = f.nt_audience?.sys?.id;
        const resolvedAudience = audienceSysId
          ? audienceBySysId.get(audienceSysId) ?? {
              id: String(audienceSysId),
              name: "All Visitors",
            }
          : undefined;

        // Top-level variants for preview plugin sidebar labels
        const variantRefs: any[] = f.nt_variants ?? [];
        const variants = variantRefs.map((v: any, i: number) => ({
          id: String(v?.sys?.id ?? v?.id ?? `variant-${i}`),
          name: String(
            v?.fields?.name ?? v?.fields?.nt_name ?? v?.name ?? `Variant ${i + 1}`
          ),
        }));

        // type must have nt_ prefix
        const rawType = String(f.nt_type ?? "nt_experiment");
        const type = rawType.startsWith("nt_") ? rawType : `nt_${rawType}`;

        const experience: NtExperience = {
          id: String(item.sys?.id ?? ""),
          name: String(f.nt_name ?? "Unnamed Experience"),
          type,
          trafficAllocation,
          distribution, // ← now correctly [{index, start, end}]
          components,   // ← now filtered, no empty ghost entries
          audience: resolvedAudience,
          variants,
        };

        console.log("[NT] ✅ Mapped experience:", JSON.stringify(experience, null, 2));
        return experience;
      })
      .filter((exp: NtExperience | null): exp is NtExperience => exp !== null);

    console.log(`[NT] ✅ Final: ${experiences.length} experience(s), ${audiences.length} audience(s)`);
    return { experiences, audiences };

  } catch (err) {
    console.error("[NT] ❌ Contentful fetch failed:", err);
    return { experiences: [], audiences: [] };
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export default function NinetailedClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const isPreview = process.env.NODE_ENV !== "production";

  const [previewData, setPreviewData] = useState<{
    experiences: NtExperience[];
    audiences: NtAudience[];
  } | undefined>(undefined);

  useEffect(() => {
    if (!isPreview) return;
    fetchNinetailedContent().then(setPreviewData);
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const plugins: any[] = [new NinetailedInsightsPlugin()];

  if (isPreview && previewData !== undefined) {
    plugins.push(
      new NinetailedPreviewPlugin({
        experiences: previewData.experiences as any,
        audiences: previewData.audiences,
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

  // key forces full remount once preview data is ready
  const providerKey = isPreview
    ? previewData === undefined ? "nt-init" : "nt-preview"
    : "nt-prod";

  return (
    <NinetailedProvider
      key={providerKey}
      clientId={
        process.env.NEXT_PUBLIC_NINETAILED_CLIENT_ID ??
        "598aeaf8-5f3f-4cf3-95b4-39e9f4076044"
      }
      environment={process.env.NEXT_PUBLIC_NINETAILED_ENVIRONMENT ?? "main"}
      plugins={plugins}
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
  );
}
