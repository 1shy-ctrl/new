import type { FileType } from "@/lib/types";

export function ProgramBadge({ program }: { program: string }) {
  const tone = program === "BSCS" ? "bg-seal-light text-seal-dark" : "bg-ink-100 text-ink-700";
  return <span className={`rounded px-1.5 py-0.5 text-xs font-semibold ${tone}`}>{program}</span>;
}

const FILE_LABEL: Record<FileType, string> = { pdf: "PDF", markdown: "Markdown", code: "Code" };

export function FileTypeLabel({ type }: { type: FileType }) {
  return <span className="text-sm text-ink-500">{FILE_LABEL[type]}</span>;
}
