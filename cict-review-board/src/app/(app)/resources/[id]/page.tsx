import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/data";
import VoteButtons from "@/components/VoteButtons";
import DeleteButton from "@/components/DeleteButton";
import { FileTypeLabel, ProgramBadge } from "@/components/Badges";
import { deleteResource } from "../actions";
import { YEAR_BAND, YEAR_LABELS } from "@/lib/constants";
import { MAX_TEXT_PREVIEW_BYTES, displayFileName } from "@/lib/files";
import type { Resource, VoteType } from "@/lib/types";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const BUCKET = "resources";

export default async function ResourcePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const profile = await getCurrentProfile();
  if (!profile) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("resources")
    .select("*, uploader:users!uploader_id(program, year_level)")
    .eq("id", id)
    .maybeSingle();

  // A failed query is not the same as a missing material: show the real problem.
  if (error) {
    return (
      <div role="alert" className="rounded-md bg-seal-light px-4 py-3 text-seal-dark">
        <p className="font-semibold">Couldn&apos;t load this material.</p>
        <p className="mt-1 text-sm">{error.message}</p>
        <Link href="/dashboard" className="mt-3 inline-block text-sm font-semibold underline">
          Back to materials
        </Link>
      </div>
    );
  }
  if (!data) notFound();
  const resource = data as Resource;

  const { data: myRating } = await supabase
    .from("ratings")
    .select("vote_type")
    .eq("resource_id", id)
    .maybeSingle();
  const myVote = (myRating?.vote_type as VoteType | undefined) ?? null;

  const fileName = displayFileName(resource.file_url);
  const storage = supabase.storage.from(BUCKET);

  const [{ data: download }, { data: inline }] = await Promise.all([
    storage.createSignedUrl(resource.file_url, 3600, { download: fileName }),
    resource.file_type === "pdf" ? storage.createSignedUrl(resource.file_url, 3600) : Promise.resolve({ data: null }),
  ]);

  // Markdown and code are fetched on the server and rendered as text (never as HTML).
  let text: string | null = null;
  let tooLarge = false;
  if (resource.file_type !== "pdf") {
    const { data: blob } = await storage.download(resource.file_url);
    if (blob) {
      if (blob.size > MAX_TEXT_PREVIEW_BYTES) tooLarge = true;
      else text = await blob.text();
    }
  }

  const isOwn = resource.uploader_id === profile.id;
  const uploaderLabel = resource.uploader
    ? `${resource.uploader.program} ${YEAR_LABELS[resource.uploader.year_level]} student`
    : "a CICT student";
  const date = new Date(resource.created_at).toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" });

  return (
    <article>
      <Link href="/dashboard" className="text-sm font-semibold text-seal hover:underline">
        Back to materials
      </Link>

      <header className={`mt-4 border-l-4 pl-4 sm:pl-6 ${YEAR_BAND[resource.year_level]}`}>
        <h1 className="text-3xl font-extrabold leading-tight tracking-tight">{resource.title}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm">
          <span className="font-bold">{resource.course_code}</span>
          <ProgramBadge program={resource.program} />
          <span className="text-ink-500">{YEAR_LABELS[resource.year_level]}</span>
          <FileTypeLabel type={resource.file_type} />
        </div>
        <p className="mt-2 text-sm text-ink-500">Shared by {uploaderLabel} on {date}.</p>
        {resource.description && <p className="mt-4 max-w-prose text-ink-700">{resource.description}</p>}
      </header>

      <div className="my-6 flex flex-wrap items-start justify-between gap-4">
        <VoteButtons
          resourceId={resource.id}
          userId={profile.id}
          upvotes={resource.upvotes}
          downvotes={resource.downvotes}
          initialVote={myVote}
          isOwn={isOwn}
          layout="inline"
        />
        <div className="flex flex-wrap gap-2">
          {download?.signedUrl && (
            <a href={download.signedUrl} className="btn-primary">Download</a>
          )}
          {inline?.signedUrl && (
            <a href={inline.signedUrl} target="_blank" rel="noopener noreferrer" className="btn-quiet">Open in new tab</a>
          )}
          {isOwn && (
            <form action={deleteResource}>
              <input type="hidden" name="id" value={resource.id} />
              <DeleteButton />
            </form>
          )}
        </div>
      </div>

      <section aria-label="Preview" className="overflow-hidden rounded-lg border border-ink-100 bg-white">
        {resource.file_type === "pdf" && inline?.signedUrl && (
          <>
            <iframe src={inline.signedUrl} title={resource.title} className="h-[75vh] w-full" />
            <p className="border-t border-ink-100 px-4 py-2 text-sm text-ink-500">
              PDF not showing on your phone? Use “Open in new tab” or “Download” above.
            </p>
          </>
        )}

        {resource.file_type === "markdown" && text !== null && (
          <div className="prose max-w-none px-5 py-6 prose-a:text-seal prose-headings:font-bold sm:px-8">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                a: ({ node, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" />,
              }}
            >
              {text}
            </ReactMarkdown>
          </div>
        )}

        {resource.file_type === "code" && text !== null && (
          <pre className="overflow-x-auto bg-ink py-4 font-mono text-sm leading-6 text-ink-100">
            <code>
              {text.split("\n").map((line, i) => (
                <div key={i} className="flex px-4">
                  <span className="w-10 shrink-0 select-none pr-4 text-right text-ink-500">{i + 1}</span>
                  <span className="whitespace-pre">{line || " "}</span>
                </div>
              ))}
            </code>
          </pre>
        )}

        {tooLarge && (
          <p className="px-5 py-10 text-center text-ink-500">
            This file is too large to preview. Use Download to open it.
          </p>
        )}

        {!tooLarge && text === null && !inline?.signedUrl && (
          <p role="alert" className="px-5 py-10 text-center text-seal-dark">
            The preview couldn&apos;t be loaded. Try Download instead.
          </p>
        )}
      </section>
    </article>
  );
}
