import Link from "next/link";
import LoginForm from "./login-form";

export const metadata = { title: "Sign in | CICT Review Board" };

export default function LoginPage() {
  return (
    <>
      <h2 className="text-2xl font-bold tracking-tight">Sign in</h2>
      <p className="mb-8 mt-1 text-ink-500">Use your Student ID and password.</p>
      <LoginForm />
      <p className="mt-6 text-sm text-ink-500">
        First time here?{" "}
        <Link href="/register" className="font-semibold text-seal hover:underline">
          Create an account
        </Link>
      </p>
    </>
  );
}
