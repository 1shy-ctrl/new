import type { FileType } from "./types";

export const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB, matches the bucket limit
export const MAX_TEXT_PREVIEW_BYTES = 1_000_000;

const MARKDOWN = ["md", "markdown"];
const CODE = [
  "js", "jsx", "ts", "tsx", "py", "java", "c", "cpp", "h", "cs", "php",
  "sql", "html", "css", "json", "sh", "rb", "go", "rs", "kt", "swift", "r", "txt",
];

export const ACCEPT_ATTR = [".pdf", ...MARKDOWN, ...CODE].map((e) => (e.startsWith(".") ? e : `.${e}`)).join(",");

export function extensionOf(name: string): string {
  const i = name.lastIndexOf(".");
  return i === -1 ? "" : name.slice(i + 1).toLowerCase();
}

export function detectFileType(name: string): FileType | null {
  const ext = extensionOf(name);
  if (ext === "pdf") return "pdf";
  if (MARKDOWN.includes(ext)) return "markdown";
  if (CODE.includes(ext)) return "code";
  return null;
}

export function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120);
}

/** Strip the "<uuid>-" prefix we add at upload time. */
export function displayFileName(storagePath: string): string {
  const base = storagePath.split("/").pop() ?? storagePath;
  return base.replace(/^[0-9a-f-]{36}-/, "");
}
