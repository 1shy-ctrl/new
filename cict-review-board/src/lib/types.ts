import type { Program } from "./constants";

export type FileType = "pdf" | "markdown" | "code";
export type VoteType = "up" | "down";

export interface Profile {
  id: string;
  student_id: string;
  program: Program;
  year_level: number;
  created_at: string;
}

export interface Resource {
  id: string;
  title: string;
  description: string | null;
  course_code: string;
  program: Program;
  year_level: number;
  /** Storage object path inside the private "resources" bucket. */
  file_url: string;
  file_type: FileType;
  uploader_id: string;
  upvotes: number;
  downvotes: number;
  score: number;
  created_at: string;
  uploader?: { program: Program; year_level: number } | null;
}

export type AuthState = { error?: string } | undefined;
