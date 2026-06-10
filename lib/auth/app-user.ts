import { createClient } from "@/lib/supabase/server";
import type { AppUser } from "@/types/database";

/**
 * ログイン中の認証ユーザーに紐づくアプリ内ユーザー（名簿行）を取得する
 * 未ログイン・名簿未登録の場合は null を返す
 */
export async function getAppUser(): Promise<AppUser | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return null;
  }

  const { data: appUser, error } = await supabase
    .from("users")
    .select("*")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("アプリ内ユーザー取得エラー:", error);
    return null;
  }

  return appUser;
}
