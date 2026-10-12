import Link from "next/link";
import RegisterForm from "./register-form";

export const metadata = { title: "Create account | CICT Review Board" };

export default function RegisterPage() {
  return (
    <>
      <h2 className="text-2xl font-bold tracking-tight">Create your account</h2>
      <p className="mb-8 mt-1 text-ink-500">
        Your Student ID must be on the CICT enrollment list. Your program and year level decide which
        materials you see first.
      </p>
      <RegisterForm />
      <p className="mt-6 text-sm text-ink-500">
        Already registered?{" "}
        <Link href="/login" className="font-semibold text-seal hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}
