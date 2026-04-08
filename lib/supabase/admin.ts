import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * サービスロールキーを使用するSupabaseクライアント
 * Cronバッチなど、RLSをバイパスする必要がある処理で使用
 */
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
