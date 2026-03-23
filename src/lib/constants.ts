export const VISIT_REASONS = [
  "reading",
  "researching",
  "use of computer",
  "meeting",
  "other",
] as const;

export type VisitReason = (typeof VISIT_REASONS)[number];
