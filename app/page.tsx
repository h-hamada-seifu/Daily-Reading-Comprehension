import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTodayJST } from "@/lib/utils/date";
import ArticleCard from "@/components/ArticleCard";
import SummaryForm from "@/components/SummaryForm";

export default async function Home() {
  const supabase = await createClient();
  const today = getTodayJST();

  // ユーザー情報取得
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 今日の記事を取得
  const { data: article } = await supabase
    .from("articles")
    .select("*")
    .eq("publish_date", today)
    .maybeSingle();

  // 提出済みチェック
  if (article) {
    const { data: submission } = await supabase
      .from("submissions")
      .select("id")
      .eq("user_id", user.id)
      .eq("article_id", article.id)
      .maybeSingle();

    if (submission) {
      redirect(`/result/${submission.id}`);
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4 pb-8">
      <header className="pt-2">
        <h1 className="text-lg font-bold">今日の記事</h1>
        <p className="text-xs text-gray-500">{today}</p>
      </header>

      {article ? (
        <>
          <ArticleCard article={article} />
          <SummaryForm articleId={article.id} />
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-gray-500 text-sm">
            今日の記事はまだ準備中です。
          </p>
          <p className="text-gray-400 text-xs mt-1">
            毎朝新しい記事が届きます。
          </p>
        </div>
      )}
    </div>
  );
}
