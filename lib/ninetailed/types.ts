// lib/ninetailed/types.ts
// ─── Shared Ninetailed types used across the framework ───────────────────────

export type NtAudience = {
  id: string;
  name: string;
  description?: string;
};

// Loose type — NT SDK accepts any shape as long as top-level fields are present
export type NtExperience = {
  id: string;
  name: string;
  type: string;
  trafficAllocation: number;
  distribution: { index: number; start: number; end: number }[];
  components: {
    type: string;
    baseline: { id: string };
    variants: { id: string }[];
  }[];
  audience?: { id: string; name?: string };
  variants?: { id: string; name?: string }[];
};

export type NtContextValue = {
  experiences: NtExperience[];
  audiences: NtAudience[];
};
