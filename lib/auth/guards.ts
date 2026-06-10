import { redirect } from "next/navigation";
import { getAppUser, type ServerSupabaseClient } from "@/lib/auth/app-user";
import type { AppUser } from "@/types/database";

/**
 * 生徒専用ページのガード
 * 未ログイン・名簿未登録 → /login、教師 → /dashboard へリダイレクト
 */
export async function requireStudent(
  supabase: ServerSupabaseClient
): Promise<AppUser> {
  const appUser = await getAppUser(supabase);

  if (!appUser) {
    redirect("/login");
  }
  if (appUser.role === "teacher") {
    redirect("/dashboard");
  }

  return appUser;
}

/**
 * 教師専用ページのガード
 * 未ログイン・名簿未登録 → /login、生徒 → / へリダイレクト
 */
export async function requireTeacher(
  supabase: ServerSupabaseClient
): Promise<AppUser> {
  const appUser = await getAppUser(supabase);

  if (!appUser) {
    redirect("/login");
  }
  if (appUser.role !== "teacher") {
    redirect("/");
  }

  return appUser;
}
