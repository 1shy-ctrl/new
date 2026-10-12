import Link from "next/link";
import VoteButtons from "./VoteButtons";
import { FileTypeLabel, ProgramBadge } from "./Badges";
import { YEAR_BAND, YEAR_LABELS } from "@/lib/constants";
import type { Resource, VoteType } from "@/lib/types";

export default function ResourceRow({
  resource,
  myVote,
  userId,
}: {
  resource: Resource;
  myVote: VoteType | null;
  userId: string;
}) {
  const total = resource.upvotes + resource.downvotes;
  const helpful = total > 0 ? Math.round((resource.upvotes / total) * 100) : null;
  const date = new Date(resource.created_at).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <li className={`flex gap-3 border-l-4 bg-white px-3 py-4 sm:gap-5 sm:px-5 ${YEAR_BAND[resource.year_level]}`}>
      <VoteButtons
        resourceId={resource.id}
        userId={userId}
        upvotes={resource.upvotes}
        downvotes={resource.downvotes}
        initialVote={myVote}
        isOwn={resource.uploader_id === userId}
      />

      <div className="min-w-0 flex-1">
        <Link href={`/resources/${resource.id}`} className="block text-lg font-semibold leading-snug hover:text-seal">
          {resource.title}
        </Link>
        {resource.description && (
          <p className="mt-1 line-clamp-2 text-sm text-ink-500">{resource.description}</p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm">
          <span className="font-bold">{resource.course_code}</span>
          <ProgramBadge program={resource.program} />
          <span className="text-ink-500">{YEAR_LABELS[resource.year_level]}</span>
          <FileTypeLabel type={resource.file_type} />
          {helpful !== null && <span className="text-ink-500">{helpful}% helpful</span>}
          <span className="text-ink-500">{date}</span>
        </div>
      </div>
    </li>
  );
}
