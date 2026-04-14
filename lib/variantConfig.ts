export const EXPERIMENT_EVENT_IDS: string[] = [
  "eventId_exp_1",
  "eventId_exp_2",
];

export const EXPERIMENT = {
  key: "event_ab_test",
  variants: ["A", "B"],

  mapping: {
    A: "5Q6vM6jIQ0o1QHUGXNQ5Lz", // baseline
    B: "52fNoTePqRv8tS1jZ0I00L", // variant
  },
};