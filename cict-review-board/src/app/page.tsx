import { redirect } from "next/navigation";

// Middleware sends signed-out visitors to /login; this covers everyone else.
export default function Home() {
  redirect("/dashboard");
}
