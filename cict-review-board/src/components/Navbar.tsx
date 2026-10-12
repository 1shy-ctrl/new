import Link from "next/link";
import { logout } from "@/app/(auth)/actions";
import { YEAR_LABELS } from "@/lib/constants";
import type { Profile } from "@/lib/types";

export default function Navbar({ profile }: { profile: Profile }) {
  return (
    <header className="sticky top-0 z-20 border-b border-ink-100 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:px-6">
        <Link href="/dashboard" className="mr-auto text-lg font-bold tracking-tight">
          <span className="text-seal">CICT</span> Review Board
        </Link>
        <p className="hidden text-sm text-ink-500 sm:block">
          {profile.student_id}, {profile.program} {YEAR_LABELS[profile.year_level]}
        </p>
        <Link href="/resources/new" className="btn-primary">Upload</Link>
        <form action={logout}>
          <button type="submit" className="btn-quiet">Sign out</button>
        </form>
      </div>
    </header>
  );
}
