import { createClient } from "@/lib/supabase/server";
import type { AppUser } from "@/types/database";

/** サーバーサイドSupabaseクライアントの型 */
export type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

/**
 * auth.users のIDからアプリ内ユーザー（名簿行）を取得する
 * 認証チェック済みのクライアントを再利用する場合はこちらを使う
 */
export async function fetchAppUserByAuthId(
  supabase: ServerSupabaseClient,
  authUserId: string
): Promise<AppUser | null> {
  const { data: appUser, error } = await supabase
    .from("users")
    .select("*")
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  if (error) {
    console.error("アプリ内ユーザー取得エラー:", error);
    return null;
  }

  return appUser;
}

/**
 * ログイン中の認証ユーザーに紐づくアプリ内ユーザー（名簿行）を取得する
 * 未ログイン・名簿未登録の場合は null を返す
 * 呼び出し側で生成済みのクライアントを渡すと認証検証の重複を避けられる
 */
export async function getAppUser(
  supabase?: ServerSupabaseClient
): Promise<AppUser | null> {
  const client = supabase ?? (await createClient());

  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) {
    return null;
  }

  return fetchAppUserByAuthId(client, user.id);
}
