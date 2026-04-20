// lib/ninetailed/fetchNinetailedContent.ts
// ─── Fetches nt_experience + nt_audience entries from Contentful REST API ────
// Can be called from client (useEffect) or server (RSC / route handler).

import type { NtAudience, NtExperience, NtContextValue } from "./types";

// ─── Normalize raw distribution array [0.5, 0.5] → NT SDK segment objects ───
function buildDistribution(
  raw: number[]
): { index: number; start: number; end: number }[] {
  let cursor = 0;
  return raw.map((pct, i) => {
    const start = Math.round(cursor * 100) / 100;
    cursor += pct;
    const end = Math.round(cursor * 100) / 100;
    return { index: i, start, end };
  });
}

export async function fetchNinetailedContent(): Promise<NtContextValue> {
  const spaceId = process.env.NEXT_PUBLIC_CONTENTFUL_SPACE_ID;
  const accessToken = process.env.NEXT_PUBLIC_CONTENTFUL_ACCESS_TOKEN;
  const env = process.env.NEXT_PUBLIC_CONTENTFUL_ENV ?? "master";

  // Guard: env vars must be present
  if (!spaceId || !accessToken) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[NT] ⚠️ Missing Contentful env vars — returning empty");
    }
    return { experiences: [], audiences: [] };
  }

  const base = `https://cdn.contentful.com/spaces/${spaceId}/environments/${env}`;
  const token = `access_token=${accessToken}&include=2&limit=200`;

  try {
    const [expRes, audRes] = await Promise.all([
      fetch(`${base}/entries?content_type=nt_experience&${token}`, {
        next: { revalidate: 60 }, // ISR-safe: revalidate every 60s in RSC context
      }),
      fetch(`${base}/entries?content_type=nt_audience&${token}`, {
        next: { revalidate: 60 },
      }),
    ]);

    if (!expRes.ok || !audRes.ok) {
      throw new Error(`Contentful fetch failed: exp=${expRes.status} aud=${audRes.status}`);
    }

    const [expJson, audJson] = await Promise.all([
      expRes.json(),
      audRes.json(),
    ]);

    // ── Map audiences ────────────────────────────────────────────────────────
    const audiences: NtAudience[] = (audJson.items ?? []).map((item: any) => ({
      id: String(item.fields?.nt_audience_id ?? item.sys?.id ?? ""),
      name: String(item.fields?.nt_name ?? "Unnamed Audience"),
      description: String(item.fields?.nt_description ?? ""),
    }));

    // Build a sysId → audience map for fast lookup during experience mapping
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

    // ── Map experiences ──────────────────────────────────────────────────────
    const experiences: NtExperience[] = (expJson.items ?? [])
      .map((item: any): NtExperience | null => {
        const f = item.fields ?? {};
        const config = f.nt_config ?? {};

        // Normalize distribution: accept [0.5, 0.5] or pre-built segment array
        const rawDist: number[] = Array.isArray(config.distribution)
          ? config.distribution
          : [0.5, 0.5];
        const distribution = buildDistribution(rawDist);

        const trafficAllocation =
          typeof config.traffic === "number" ? config.traffic : 1;

        // Always enforce type: "nt_experience" — Contentful may omit it
        const components = (config.components ?? [])
          .filter((c: any) => String(c?.baseline?.id ?? "") !== "")
          .map((c: any) => ({
            type: "nt_experience", // REQUIRED by NT SDK — always set explicitly
            baseline: { id: String(c.baseline.id) },
            variants: (c.variants ?? [])
              .filter((v: any) => String(v?.id ?? "") !== "")
              .map((v: any) => ({ id: String(v.id) })),
          }));

        // Skip malformed entries with no valid components
        if (components.length === 0) return null;

        // Resolve audience via sysId lookup
        const audienceSysId = f.nt_audience?.sys?.id;
        const resolvedAudience = audienceSysId
          ? audienceBySysId.get(audienceSysId) ?? { id: String(audienceSysId), name: "All Visitors" }
          : undefined;

        // Normalize type — ensure nt_ prefix
        const rawType = String(f.nt_type ?? "nt_experiment");
        const type = rawType.startsWith("nt_") ? rawType : `nt_${rawType}`;

        return {
          id: String(item.sys?.id ?? ""),
          name: String(f.nt_name ?? "Unnamed Experience"),
          type,
          trafficAllocation,
          distribution,
          components,
          audience: resolvedAudience,
          variants: (f.nt_variants ?? []).map((v: any, i: number) => ({
            id: String(v?.sys?.id ?? v?.id ?? `variant-${i}`),
            name: String(v?.fields?.nt_name ?? v?.fields?.name ?? `Variant ${i + 1}`),
          })),
        };
      })
      .filter((exp: NtExperience | null): exp is NtExperience => exp !== null);

    if (process.env.NODE_ENV !== "production") {
      console.log(
        `[NT] ✅ Loaded ${experiences.length} experience(s), ${audiences.length} audience(s)`
      );
    }

    return { experiences, audiences };
  } catch (err) {
    console.error("[NT] ❌ Contentful fetch failed:", err);
    return { experiences: [], audiences: [] };
  }
}
