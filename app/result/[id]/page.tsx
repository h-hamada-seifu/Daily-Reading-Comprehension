import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAppUser } from "@/lib/auth/app-user";
import ScoreCard from "@/components/ScoreCard";
import type { Article, Scores } from "@/types/database";

interface ResultPageProps {
  params: Promise<{ id: string }>;
}

export default async function ResultPage({ params }: ResultPageProps) {
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

  // 提出データ取得（自分のデータのみRLSで制限されるが、念のためuser_idも確認）
  const { data: submission } = await supabase
    .from("submissions")
    .select("*, articles(*)")
    .eq("id", id)
    .eq("user_id", appUser.id)
    .single();

  if (!submission) {
    notFound();
  }

  // Supabaseのrelation queryの型がanyになるため明示的にキャスト
  const article = submission.articles as Pick<Article, "title" | "body"> | null;

  return (
    <div className="flex flex-col gap-4 p-4 pb-8">
      <header className="pt-2">
        <h1 className="text-lg font-bold">フィードバック</h1>
      </header>

      <ScoreCard
        scoreOverall={submission.score_overall}
        scores={submission.scores as Scores}
      />

      {/* 提出した要約 */}
      <div className="bg-white rounded-2xl shadow-sm p-5 space-y-2">
        <h3 className="text-sm font-medium text-gray-500">あなたの要約</h3>
        <p className="text-sm leading-relaxed">{submission.summary}</p>
      </div>

      {/* 元の記事 */}
      {article && (
        <div className="bg-white rounded-2xl shadow-sm p-5 space-y-2">
          <h3 className="text-sm font-medium text-gray-500">元の記事</h3>
          <p className="text-sm font-medium">{article.title}</p>
          <p className="text-sm leading-relaxed text-gray-700">
            {article.body}
          </p>
        </div>
      )}

      <div className="flex items-center justify-center gap-6 py-2">
        <Link href="/" className="text-sm text-blue-600 hover:underline">
          トップに戻る
        </Link>
        <Link href="/archive" className="text-sm text-blue-600 hover:underline">
          過去の問題
        </Link>
      </div>
    </div>
  );
}
