import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/data";
import FilterBar from "@/components/FilterBar";
import ResourceRow from "@/components/ResourceRow";
import { PROGRAMS, YEAR_LABELS } from "@/lib/constants";
import type { Resource, VoteType } from "@/lib/types";

export const metadata = { title: "Materials | CICT Review Board" };

type SearchParams = { program?: string; year?: string; course?: string; q?: string; sort?: string };

const LIMIT = 50;
// Strip characters that would break PostgREST filter syntax or act as LIKE wildcards.
const clean = (s?: string) => (s ?? "").replace(/[,()%_*\\]/g, " ").trim().slice(0, 60);

export default async function DashboardPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const profile = await getCurrentProfile();
  if (!profile) return null; // the layout already shows a notice

  // With no filters in the URL, the feed defaults to the student's own program and year.
  const programParam = sp.program ?? profile.program;
  const program =
    programParam === "all" || (PROGRAMS as readonly string[]).includes(programParam)
      ? programParam
      : profile.program;
  const yearParam = sp.year ?? String(profile.year_level);
  const year = yearParam === "all" || ["1", "2", "3", "4"].includes(yearParam) ? yearParam : String(profile.year_level);
  const sort = sp.sort === "new" ? "new" : "top";
  const course = clean(sp.course);
  const q = clean(sp.q);

  const supabase = await createClient();

  let query = supabase.from("resources").select("*, uploader:users(program, year_level)").limit(LIMIT);
  if (program !== "all") query = query.eq("program", program);
  if (year !== "all") query = query.eq("year_level", Number(year));
  if (course) query = query.ilike("course_code", `%${course}%`);
  if (q) query = query.or(`title.ilike.%${q}%,course_code.ilike.%${q}%`);
  query =
    sort === "new"
      ? query.order("created_at", { ascending: false })
      : query.order("score", { ascending: false }).order("created_at", { ascending: false });

  const [{ data, error }, { data: codeRows }] = await Promise.all([
    query,
    supabase.from("resources").select("course_code"),
  ]);

  const resources = (data ?? []) as Resource[];
  const courseCodes = Array.from(new Set(((codeRows ?? []) as { course_code: string }[]).map((r) => r.course_code))).sort();

  // RLS only returns this student's own votes.
  const ids = resources.map((r) => r.id);
  const { data: votes } = ids.length
    ? await supabase.from("ratings").select("resource_id, vote_type").in("resource_id", ids)
    : { data: [] };
  const myVotes = new Map(
    ((votes ?? []) as { resource_id: string; vote_type: VoteType }[]).map((v) => [v.resource_id, v.vote_type])
  );

  const scope = [program === "all" ? null : program, year === "all" ? null : YEAR_LABELS[Number(year)]]
    .filter(Boolean)
    .join(", ");

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            {scope ? `Materials for ${scope}` : "All CICT materials"}
          </h1>
          <p className="mt-1 text-ink-500">
            {resources.length === 0
              ? "Nothing here yet."
              : resources.length === LIMIT
                ? `Showing the first ${LIMIT} materials.`
                : `${resources.length} ${resources.length === 1 ? "material" : "materials"}.`}
          </p>
        </div>
        <Link href="/dashboard" className="text-sm font-semibold text-seal hover:underline">
          Reset to my curriculum
        </Link>
      </div>

      <FilterBar program={program} year={year} course={course} q={q} sort={sort} courseCodes={courseCodes} />

      {error ? (
        <p role="alert" className="rounded-md bg-seal-light px-4 py-3 text-seal-dark">
          Couldn&apos;t load materials. Refresh the page, and check that the database migration has been run.
        </p>
      ) : resources.length === 0 ? (
        <div className="rounded-lg border border-dashed border-ink-300 bg-white px-6 py-14 text-center">
          <p className="text-lg font-semibold">No materials match these filters.</p>
          <p className="mt-1 text-ink-500">Try another year level or course code, or share your own reviewer.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/dashboard?program=all&year=all" className="btn-quiet">Show all materials</Link>
            <Link href="/resources/new" className="btn-primary">Upload a reviewer</Link>
          </div>
        </div>
      ) : (
        <ul className="divide-y divide-ink-100 overflow-hidden rounded-lg border border-ink-100 bg-white">
          {resources.map((r) => (
            <ResourceRow key={r.id} resource={r} myVote={myVotes.get(r.id) ?? null} userId={profile.id} />
          ))}
        </ul>
      )}
    </>
  );
}
