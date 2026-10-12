import Navbar from "@/components/Navbar";
import { logout } from "@/app/(auth)/actions";
import { getCurrentProfile } from "@/lib/data";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();

  if (!profile) {
    return (
      <main className="mx-auto max-w-md px-6 py-20 text-center">
        <h1 className="text-2xl font-bold">Your student profile is missing</h1>
        <p className="mt-2 text-ink-500">
          You&apos;re signed in, but no CICT profile is linked to this account. Ask an admin to check the
          enrollment list, then sign in again.
        </p>
        <form action={logout} className="mt-6">
          <button type="submit" className="btn-quiet">Sign out</button>
        </form>
      </main>
    );
  }

  return (
    <>
      <Navbar profile={profile} />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">{children}</main>
    </>
  );
}
