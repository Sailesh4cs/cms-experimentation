// import { cookies } from "next/headers";
// import { EventItem } from "./types";

// const EXPERIMENT = {
//   key: "event_ab_test",
//   mapping: {
//     A: "EVENT_A_ID",
//     B: "EVENT_B_ID",
//   },
// };

// // ✅ ONLY READ (NO SET)
// export async function getVariant(): Promise<"A" | "B"> {
//   const cookieStore = await cookies();

//   const variant = cookieStore.get(EXPERIMENT.key)?.value;

//   // fallback to random (non-persistent)
//   return (variant as "A" | "B") || (Math.random() > 0.5 ? "A" : "B");
// }

// export function getExperimentEventByVariant(
//   events: EventItem[],
//   variant: "A" | "B"
// ): EventItem | null {
//   const targetId = EXPERIMENT.mapping[variant];
//   return events.find((e) => e.sys.id === targetId) || null;
// }

// export function injectExperimentEvent(
//   events: EventItem[],
//   experimentEvent: EventItem | null
// ): EventItem[] {
//   if (!events.length || !experimentEvent) return events;

//   const filtered = events.filter(
//     (e) =>
//       e.sys.id !== EXPERIMENT.mapping.A &&
//       e.sys.id !== EXPERIMENT.mapping.B
//   );

//   const index = Math.floor(Math.random() * filtered.length);

//   const updated = [...filtered];
//   updated.splice(index, 0, experimentEvent);

//   return updated;
// }