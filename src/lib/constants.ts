export const VISIT_REASONS = [
  "reading",
  "researching",
  "use of computer",
  "meeting",
  "other",
] as const;

export const COLLEGES = [
  "College of Accountancy",
  "College of Business Administration",
  "College of Arts and Sciences",
  "College of Education",
  "College of Engineering and Technology",
  "College of Computer Studies / Informatics",
  "College of Communication",
  "College of Criminology",
  "College of Music",
  "College of Law",
  "College of Medicine",
  "College of Nursing",
  "College of Medical Technology",
  "College of Midwifery",
  "College of Physical Therapy",
  "College of Respiratory Therapy",
  "College of Architecture",
] as const;

export const DASHBOARD_VISITOR_ROLES = [
  "all",
  "student",
  "teacher",
  "staff",
  "employee",
] as const;

export type VisitReason = (typeof VISIT_REASONS)[number];
export type DashboardVisitorRole = (typeof DASHBOARD_VISITOR_ROLES)[number];
