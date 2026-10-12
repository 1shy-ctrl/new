import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

/** The signed-in student's profile row, or null. Cached per request. */
export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("users")
    .select("id, student_id, program, year_level, created_at")
    .eq("id", user.id)
    .maybeSingle();

  return (data as Profile | null) ?? null;
});
