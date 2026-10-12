"use client";

import { useActionState } from "react";
import SubmitButton from "@/components/SubmitButton";
import { login } from "../actions";

export default function LoginForm() {
  const [state, formAction] = useActionState(login, undefined);

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label htmlFor="student_id" className="label">Student ID</label>
        <input id="student_id" name="student_id" className="field" autoComplete="username" required />
      </div>
      <div>
        <label htmlFor="password" className="label">Password</label>
        <input id="password" name="password" type="password" className="field" autoComplete="current-password" required />
      </div>

      {state?.error && (
        <p role="alert" className="rounded-md bg-seal-light px-3 py-2 text-sm text-seal-dark">
          {state.error}
        </p>
      )}

      <SubmitButton pendingLabel="Signing in...">Sign in</SubmitButton>
    </form>
  );
}
