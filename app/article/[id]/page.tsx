import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAppUser } from "@/lib/auth/app-user";
import { formatDayLabel } from "@/lib/utils/date";
import ArticleCard from "@/components/ArticleCard";
import SummaryForm from "@/components/SummaryForm";

interface ArticlePageProps {
  params: Promise<{ id: string }>;
}

/** 過去記事の提出ページ（未提出の記事に遡って取り組む用） */
export default async function ArticlePage({ params }: ArticlePageProps) {
  const { id } = await params;
  const appUser = await getAppUser();

  if (!appUser) {
    redirect("/login");
  }

  // 教師はダッシュボード専用
  if (appUser.role === "teacher") {
    redirect("/dashboard");
  }

  const supabase = await createClient();

  // 記事取得（RLSにより公開日が当日以前のみ取得される）
  const { data: article } = await supabase
    .from("articles")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!article) {
    notFound();
  }

  // 提出済みならフィードバック画面へ
  const { data: submission } = await supabase
    .from("submissions")
    .select("id")
    .eq("user_id", appUser.id)
    .eq("article_id", article.id)
    .maybeSingle();

  if (submission) {
    redirect(`/result/${submission.id}`);
  }

  return (
    <div className="flex flex-col gap-4 p-4 pb-8">
      <header className="pt-2 flex items-end justify-between">
        <div>
          <h1 className="text-lg font-bold">過去の記事</h1>
          <p className="text-xs text-gray-500">
            {formatDayLabel(article.publish_date)}
          </p>
        </div>
        <Link
          href="/archive"
          className="text-sm text-blue-600 hover:underline pb-0.5"
        >
          一覧に戻る
        </Link>
      </header>

      <ArticleCard article={article} />
      <SummaryForm articleId={article.id} />
    </div>
  );
}
