import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/data";
import UploadForm from "@/components/UploadForm";

export const metadata = { title: "Upload a material | CICT Review Board" };

export default async function NewResourcePage() {
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const supabase = await createClient();
  const { data } = await supabase.from("resources").select("course_code");
  const courseCodes = Array.from(new Set(((data ?? []) as { course_code: string }[]).map((r) => r.course_code))).sort();

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/dashboard" className="text-sm font-semibold text-seal hover:underline">
        Back to materials
      </Link>
      <h1 className="mb-1 mt-3 text-3xl font-extrabold tracking-tight">Upload a material</h1>
      <p className="mb-8 text-ink-500">Share a reviewer, note, or code sample with other CICT students.</p>
      <UploadForm defaultProgram={profile.program} defaultYear={profile.year_level} courseCodes={courseCodes} />
    </div>
  );
}
