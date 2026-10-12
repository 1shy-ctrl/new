"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function deleteResource(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: resource } = await supabase
    .from("resources")
    .select("file_url, uploader_id")
    .eq("id", id)
    .maybeSingle();

  // RLS also enforces this; the check just avoids a pointless round trip.
  if (!resource || resource.uploader_id !== user.id) redirect("/dashboard");

  const { error } = await supabase.from("resources").delete().eq("id", id);
  if (!error) await supabase.storage.from("resources").remove([resource.file_url]);

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
