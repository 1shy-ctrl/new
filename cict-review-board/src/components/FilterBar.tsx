"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { PROGRAMS, YEAR_LABELS, YEAR_LEVELS } from "@/lib/constants";

interface Filters {
  program: string;
  year: string;
  course: string;
  q: string;
  sort: string;
}

export default function FilterBar({ courseCodes, ...initial }: Filters & { courseCodes: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [f, setF] = useState<Filters>(initial);

  // Stay in sync when the server resolves different values (e.g. "reset" link).
  useEffect(() => {
    setF({ program: initial.program, year: initial.year, course: initial.course, q: initial.q, sort: initial.sort });
  }, [initial.program, initial.year, initial.course, initial.q, initial.sort]);

  function apply(next: Filters) {
    const params = new URLSearchParams({ program: next.program, year: next.year, sort: next.sort });
    if (next.course.trim()) params.set("course", next.course.trim());
    if (next.q.trim()) params.set("q", next.q.trim());
    startTransition(() => router.replace(`${pathname}?${params.toString()}`));
  }

  function change(key: "program" | "year" | "sort", value: string) {
    const next = { ...f, [key]: value };
    setF(next);
    apply(next);
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        apply(f);
      }}
      aria-busy={pending}
      className="mb-6 grid gap-3 rounded-lg border border-ink-100 bg-white p-4 sm:grid-cols-3"
    >
      <div>
        <label htmlFor="f-program" className="label">Program</label>
        <select id="f-program" className="field" value={f.program} onChange={(e) => change("program", e.target.value)}>
          <option value="all">All programs</option>
          {PROGRAMS.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="f-year" className="label">Year level</label>
        <select id="f-year" className="field" value={f.year} onChange={(e) => change("year", e.target.value)}>
          <option value="all">All years</option>
          {YEAR_LEVELS.map((y) => (
            <option key={y} value={y}>{YEAR_LABELS[y]}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="f-sort" className="label">Order by</label>
        <select id="f-sort" className="field" value={f.sort} onChange={(e) => change("sort", e.target.value)}>
          <option value="top">Top rated</option>
          <option value="new">Newest</option>
        </select>
      </div>

      <div>
        <label htmlFor="f-course" className="label">Course code</label>
        <input
          id="f-course"
          className="field"
          list="course-codes"
          placeholder="e.g. CC106"
          value={f.course}
          onChange={(e) => setF({ ...f, course: e.target.value })}
        />
        <datalist id="course-codes">
          {courseCodes.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="f-q" className="label">Search titles</label>
        <div className="flex gap-2">
          <input
            id="f-q"
            className="field"
            type="search"
            placeholder="Midterm reviewer, SQL cheat sheet..."
            value={f.q}
            onChange={(e) => setF({ ...f, q: e.target.value })}
          />
          <button type="submit" className="btn-quiet">Search</button>
        </div>
      </div>
    </form>
  );
}
