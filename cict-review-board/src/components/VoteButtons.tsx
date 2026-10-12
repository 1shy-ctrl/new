"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { VoteType } from "@/lib/types";

interface Props {
  resourceId: string;
  userId: string;
  upvotes: number;
  downvotes: number;
  initialVote: VoteType | null;
  /** True when the signed-in student uploaded this resource. */
  isOwn?: boolean;
  layout?: "stack" | "inline";
}

function Chevron({ up }: { up: boolean }) {
  return (
    <svg viewBox="0 0 20 20" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={up ? "M4 12.5 10 6.5l6 6" : "M4 7.5 10 13.5l6-6"} />
    </svg>
  );
}

export default function VoteButtons({
  resourceId,
  userId,
  upvotes,
  downvotes,
  initialVote,
  isOwn = false,
  layout = "stack",
}: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [counts, setCounts] = useState({ up: upvotes, down: downvotes });
  const [vote, setVote] = useState<VoteType | null>(initialVote);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const score = counts.up - counts.down;
  const total = counts.up + counts.down;
  const helpful = total > 0 ? Math.round((counts.up / total) * 100) : null;

  async function cast(clicked: VoteType) {
    if (busy || isOwn) return;
    setBusy(true);
    setError(null);

    const previous = { vote, counts };
    const next: VoteType | null = vote === clicked ? null : clicked; // clicking again removes the vote
    const nextCounts = { ...counts };
    if (vote) nextCounts[vote] -= 1;
    if (next) nextCounts[next] += 1;
    setVote(next);
    setCounts(nextCounts);

    const supabase = createClient();
    const { error: dbError } = next
      ? await supabase
          .from("ratings")
          .upsert(
            { resource_id: resourceId, user_id: userId, vote_type: next },
            { onConflict: "resource_id,user_id" }
          )
      : await supabase.from("ratings").delete().eq("resource_id", resourceId).eq("user_id", userId);

    if (dbError) {
      setVote(previous.vote);
      setCounts(previous.counts);
      setError("Couldn't save your vote. Try again.");
    } else {
      startTransition(() => router.refresh());
    }
    setBusy(false);
  }

  const base = "grid h-9 w-9 place-items-center rounded-md transition-colors disabled:cursor-not-allowed disabled:opacity-40";
  const upClass = vote === "up" ? "bg-seal text-white" : "text-ink-500 hover:bg-seal-light hover:text-seal";
  const downClass = vote === "down" ? "bg-ink text-white" : "text-ink-500 hover:bg-ink-100 hover:text-ink";
  const ownHint = isOwn ? "You can't vote on your own upload" : undefined;

  if (layout === "inline") {
    return (
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 rounded-lg border border-ink-100 bg-white p-1">
            <button type="button" onClick={() => cast("up")} disabled={busy || isOwn} aria-pressed={vote === "up"} aria-label="Mark as helpful" title={ownHint ?? "Helpful"} className={`${base} ${upClass}`}>
              <Chevron up />
            </button>
            <span className="min-w-10 text-center text-lg font-bold tabular-nums" aria-live="polite">{score}</span>
            <button type="button" onClick={() => cast("down")} disabled={busy || isOwn} aria-pressed={vote === "down"} aria-label="Mark as not helpful" title={ownHint ?? "Not helpful"} className={`${base} ${downClass}`}>
              <Chevron up={false} />
            </button>
          </div>
          <p className="text-sm text-ink-500">
            {helpful === null ? "No votes yet." : `${helpful}% of ${total} ${total === 1 ? "student" : "students"} found this helpful.`}
          </p>
        </div>
        {isOwn && <p className="mt-2 text-sm text-ink-500">You uploaded this, so voting is turned off for you.</p>}
        {error && <p role="alert" className="mt-2 text-sm text-seal-dark">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex w-10 shrink-0 flex-col items-center">
      <button type="button" onClick={() => cast("up")} disabled={busy || isOwn} aria-pressed={vote === "up"} aria-label="Mark as helpful" title={ownHint ?? "Helpful"} className={`${base} ${upClass}`}>
        <Chevron up />
      </button>
      <span className="py-0.5 text-base font-bold tabular-nums" aria-live="polite">{score}</span>
      <button type="button" onClick={() => cast("down")} disabled={busy || isOwn} aria-pressed={vote === "down"} aria-label="Mark as not helpful" title={ownHint ?? "Not helpful"} className={`${base} ${downClass}`}>
        <Chevron up={false} />
      </button>
      {error && <span role="alert" className="mt-1 text-center text-[11px] leading-tight text-seal-dark">{error}</span>}
    </div>
  );
}
