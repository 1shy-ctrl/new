"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PROGRAMS, PROGRAM_NAMES, YEAR_LABELS, YEAR_LEVELS } from "@/lib/constants";
import { ACCEPT_ATTR, MAX_FILE_BYTES, detectFileType, sanitizeFileName } from "@/lib/files";

interface Props {
  defaultProgram: string;
  defaultYear: number;
  courseCodes: string[];
}

export default function UploadForm({ defaultProgram, defaultYear, courseCodes }: Props) {
  const router = useRouter();
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = new FormData(e.currentTarget);
    const file = form.get("file") as File | null;
    const title = String(form.get("title") ?? "").trim();
    const courseCode = String(form.get("course_code") ?? "").trim().toUpperCase();
    const description = String(form.get("description") ?? "").trim();
    const program = String(form.get("program") ?? "");
    const yearLevel = Number(form.get("year_level"));

    if (!file || file.size === 0) return setError("Choose a file to upload.");
    const fileType = detectFileType(file.name);
    if (!fileType) return setError("That file type isn't supported. Upload a PDF, a Markdown note, or a code file.");
    if (file.size > MAX_FILE_BYTES) return setError("That file is larger than 10 MB.");
    if (title.length < 3) return setError("Give the material a title of at least 3 characters.");
    if (courseCode.length < 2) return setError("Enter the course code, for example CC106.");

    setUploading(true);
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setUploading(false);
      return setError("Your session expired. Sign in again.");
    }

    // 1. Upload the file to the private bucket, inside this student's own folder.
    const path = `${user.id}/${crypto.randomUUID()}-${sanitizeFileName(file.name)}`;
    const { error: uploadError } = await supabase.storage.from("resources").upload(path, file, {
      contentType: fileType === "pdf" ? "application/pdf" : "text/plain",
      upsert: false,
    });
    if (uploadError) {
      setUploading(false);
      return setError("The file couldn't be uploaded. Check your connection and try again.");
    }

    // 2. Create the database row. If that fails, remove the orphaned file.
    const { data: row, error: insertError } = await supabase
      .from("resources")
      .insert({
        title,
        description: description || null,
        course_code: courseCode,
        program,
        year_level: yearLevel,
        file_url: path,
        file_type: fileType,
        uploader_id: user.id,
      })
      .select("id")
      .single();

    if (insertError || !row) {
      await supabase.storage.from("resources").remove([path]);
      setUploading(false);
      return setError("The material couldn't be saved. Try again.");
    }

    router.push(`/resources/${row.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <label htmlFor="file" className="label">File</label>
        <label
          htmlFor="file"
          className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-ink-300 bg-white px-4 py-10 text-center hover:border-seal"
        >
          <span className="font-semibold">{fileName ?? "Choose a file"}</span>
          <span className="mt-1 text-sm text-ink-500">PDF, Markdown, or code. Up to 10 MB.</span>
        </label>
        <input
          id="file"
          name="file"
          type="file"
          accept={ACCEPT_ATTR}
          className="sr-only"
          onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
        />
      </div>

      <div>
        <label htmlFor="title" className="label">Title</label>
        <input id="title" name="title" className="field" maxLength={150} placeholder="Midterm reviewer: normalization and SQL joins" required />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="course_code" className="label">Course code</label>
          <input id="course_code" name="course_code" className="field uppercase" list="upload-course-codes" maxLength={20} placeholder="CC106" required />
          <datalist id="upload-course-codes">
            {courseCodes.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
        <div>
          <label htmlFor="program" className="label">Program</label>
          <select id="program" name="program" className="field" defaultValue={defaultProgram} required>
            {PROGRAMS.map((p) => (
              <option key={p} value={p}>{p} ({PROGRAM_NAMES[p]})</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="year_level" className="label">Year level</label>
          <select id="year_level" name="year_level" className="field" defaultValue={defaultYear} required>
            {YEAR_LEVELS.map((y) => (
              <option key={y} value={y}>{YEAR_LABELS[y]}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="description" className="label">Description (optional)</label>
        <textarea id="description" name="description" rows={3} maxLength={1000} className="field" placeholder="What does it cover? Which topics or exam coverage?" />
      </div>

      {error && (
        <p role="alert" className="rounded-md bg-seal-light px-3 py-2 text-sm text-seal-dark">{error}</p>
      )}

      <button type="submit" disabled={uploading} className="btn-primary">
        {uploading ? "Uploading..." : "Upload material"}
      </button>
    </form>
  );
}
