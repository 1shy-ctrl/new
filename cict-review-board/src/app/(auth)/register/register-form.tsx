"use client";

import { useActionState } from "react";
import SubmitButton from "@/components/SubmitButton";
import { PROGRAMS, PROGRAM_NAMES, YEAR_LABELS, YEAR_LEVELS } from "@/lib/constants";
import { register } from "../actions";

export default function RegisterForm() {
  const [state, formAction] = useActionState(register, undefined);

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label htmlFor="student_id" className="label">Student ID</label>
        <input id="student_id" name="student_id" className="field" autoComplete="username" required />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="program" className="label">Program</label>
          <select id="program" name="program" className="field" defaultValue="" required>
            <option value="" disabled>Choose</option>
            {PROGRAMS.map((p) => (
              <option key={p} value={p}>{p} ({PROGRAM_NAMES[p]})</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="year_level" className="label">Year level</label>
          <select id="year_level" name="year_level" className="field" defaultValue="" required>
            <option value="" disabled>Choose</option>
            {YEAR_LEVELS.map((y) => (
              <option key={y} value={y}>{YEAR_LABELS[y]}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="password" className="label">Password</label>
        <input id="password" name="password" type="password" className="field" autoComplete="new-password" minLength={8} required />
        <p className="mt-1 text-xs text-ink-500">At least 8 characters.</p>
      </div>
      <div>
        <label htmlFor="confirm" className="label">Confirm password</label>
        <input id="confirm" name="confirm" type="password" className="field" autoComplete="new-password" minLength={8} required />
      </div>

      {state?.error && (
        <p role="alert" className="rounded-md bg-seal-light px-3 py-2 text-sm text-seal-dark">
          {state.error}
        </p>
      )}

      <SubmitButton pendingLabel="Creating account...">Create account</SubmitButton>
    </form>
  );
}
