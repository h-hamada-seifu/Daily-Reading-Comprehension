import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAllowedDomainEmail } from "@/lib/auth/roles";

/**
 * OAuthコールバック処理
 * 1. 認可コードをセッションに交換
 * 2. ドメイン検証（i-seifu.jp 以外は拒否）
 * 3. 名簿（usersテーブル）照合（未登録は拒否）
 * 4. auth_user_id の紐付け（初回ログイン時）
 * 5. ロール別リダイレクト（生徒→ / 、教師→ /dashboard）
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    console.error("セッション交換エラー:", error);
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  const email = data.user.email?.toLowerCase();

  // ドメイン検証（OAuthのhdパラメータは保証にならないためサーバーサイドで必須チェック）
  if (!email || !isAllowedDomainEmail(email)) {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/login?error=domain`);
  }

  // 名簿照合（auth_user_id 紐付け前はRLSで自分の行が見えないため管理者クライアントを使用）
  const adminClient = createAdminClient();
  const { data: appUser, error: lookupError } = await adminClient
    .from("users")
    .select("id, role, auth_user_id")
    .eq("email", email)
    .maybeSingle();

  if (lookupError) {
    console.error("名簿照合エラー:", lookupError);
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  if (!appUser) {
    // 名簿に未登録のアカウントは拒否
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/login?error=not_registered`);
  }

  // 初回ログイン時に auth.users と紐付け
  if (appUser.auth_user_id !== data.user.id) {
    const { error: linkError } = await adminClient
      .from("users")
      .update({ auth_user_id: data.user.id })
      .eq("id", appUser.id);

    if (linkError) {
      console.error("auth_user_id 紐付けエラー:", linkError);
      await supabase.auth.signOut();
      return NextResponse.redirect(`${origin}/login?error=auth`);
    }
  }

  // ロール別リダイレクト
  const destination = appUser.role === "teacher" ? "/dashboard" : "/";
  return NextResponse.redirect(`${origin}${destination}`);
}
