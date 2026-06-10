import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireStudent } from "@/lib/auth/guards";
import { formatDayLabel } from "@/lib/utils/date";
import ArticleCard from "@/components/ArticleCard";
import SummaryForm from "@/components/SummaryForm";

interface ArticlePageProps {
  params: Promise<{ id: string }>;
}

/** 過去記事の提出ページ（未提出の記事に遡って取り組む用） */
export default async function ArticlePage({ params }: ArticlePageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const appUser = await requireStudent(supabase);

  // 記事と自分の提出状況は互いに依存しないため並列取得する
  const [{ data: article }, { data: submission }] = await Promise.all([
    // RLSにより公開日が当日以前の記事のみ取得される
    supabase.from("articles").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("submissions")
      .select("id")
      .eq("user_id", appUser.id)
      .eq("article_id", id)
      .maybeSingle(),
  ]);

  if (!article) {
    notFound();
  }

  // 提出済みならフィードバック画面へ
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
