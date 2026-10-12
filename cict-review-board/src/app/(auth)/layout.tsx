import { YEAR_LABELS, YEAR_SWATCH } from "@/lib/constants";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside className="flex flex-col gap-10 bg-ink px-6 py-8 text-white sm:px-10 lg:justify-between lg:px-14 lg:py-14">
        <p className="text-lg font-bold tracking-tight">
          <span className="text-seal-soft">CICT</span> Review Board
        </p>

        <div className="max-w-md">
          <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight lg:text-5xl">
            Review materials for every CICT course, ranked by the students who used them.
          </h1>
          <p className="mt-5 text-lg text-ink-100">
            Sign in with your Student ID to see what&apos;s useful for your program and year level.
          </p>
        </div>

        <div>
          <p className="mb-3 text-sm text-ink-300">The colored bar on each material shows its year level.</p>
          <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            {[1, 2, 3, 4].map((y) => (
              <li key={y} className="flex items-center gap-2">
                <span className={`h-3 w-6 rounded-sm ${YEAR_SWATCH[y]}`} aria-hidden />
                {YEAR_LABELS[y]}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <section className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">{children}</div>
      </section>
    </main>
  );
}
