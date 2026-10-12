"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  PROGRAMS,
  isValidStudentId,
  normalizeStudentId,
  studentIdToEmail,
} from "@/lib/constants";
import type { AuthState } from "@/lib/types";

export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const studentId = normalizeStudentId(String(formData.get("student_id") ?? ""));
  const password = String(formData.get("password") ?? "");

  if (!isValidStudentId(studentId)) {
    return { error: "Enter your Student ID exactly as it appears on your school ID." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: studentIdToEmail(studentId),
    password,
  });

  if (error) return { error: "Student ID or password is incorrect." };
  redirect("/dashboard");
}

export async function register(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const studentId = normalizeStudentId(String(formData.get("student_id") ?? ""));
  const program = String(formData.get("program") ?? "");
  const yearLevel = Number(formData.get("year_level"));
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!isValidStudentId(studentId)) {
    return { error: "Enter your Student ID exactly as it appears on your school ID." };
  }
  if (!(PROGRAMS as readonly string[]).includes(program)) {
    return { error: "Choose your program." };
  }
  if (![1, 2, 3, 4].includes(yearLevel)) {
    return { error: "Choose your year level." };
  }
  if (password.length < 8) {
    return { error: "Use a password with at least 8 characters." };
  }
  if (password !== confirm) {
    return { error: "The two passwords don't match." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: studentIdToEmail(studentId),
    password,
    // Read by the handle_new_user() trigger, which also checks the enrollment roster.
    options: { data: { student_id: studentId, program, year_level: yearLevel } },
  });

  if (error) {
    if (/already registered/i.test(error.message)) {
      return { error: "This Student ID already has an account. Sign in instead." };
    }
    if (/database error/i.test(error.message)) {
      return {
        error:
          "This Student ID isn't on the active CICT enrollment list, or it already has an account.",
      };
    }
    return { error: error.message };
  }

  if (!data.session) {
    return {
      error:
        "Your account was created but you can't be signed in yet. An admin needs to turn off “Confirm email” in Supabase Auth settings.",
    };
  }

  redirect("/dashboard");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
