export const PROGRAMS = ["BSCS", "BSIS"] as const;
export type Program = (typeof PROGRAMS)[number];

export const PROGRAM_NAMES: Record<Program, string> = {
  BSCS: "BS Computer Science",
  BSIS: "BS Information Systems",
};

export const YEAR_LEVELS = [1, 2, 3, 4] as const;

export const YEAR_LABELS: Record<number, string> = {
  1: "1st year",
  2: "2nd year",
  3: "3rd year",
  4: "4th year",
};

// Full class names so Tailwind can see them.
export const YEAR_BAND: Record<number, string> = {
  1: "border-year-1",
  2: "border-year-2",
  3: "border-year-3",
  4: "border-year-4",
};
export const YEAR_SWATCH: Record<number, string> = {
  1: "bg-year-1",
  2: "bg-year-2",
  3: "bg-year-3",
  4: "bg-year-4",
};

/**
 * Loose on purpose: letters, digits and hyphens, 5-20 chars.
 * Tighten this to match the real TCU Student ID format.
 */
export const STUDENT_ID_PATTERN = /^[A-Z0-9-]{5,20}$/;

export const normalizeStudentId = (raw: string) => raw.trim().toUpperCase();
export const isValidStudentId = (id: string) => STUDENT_ID_PATTERN.test(id);

/** Supabase Auth needs an email; we derive one from the Student ID. */
export const studentIdToEmail = (studentId: string) =>
  `${studentId.toLowerCase()}@${
    process.env.NEXT_PUBLIC_STUDENT_EMAIL_DOMAIN ?? "cictboard.app"
  }`;
