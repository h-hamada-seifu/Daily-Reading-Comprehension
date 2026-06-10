import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireStudent } from "@/lib/auth/guards";
import {
  formatDayLabel,
  getMonthDateRange,
  getTodayJST,
  resolveMonthParam,
} from "@/lib/utils/date";
import MonthNav from "@/components/MonthNav";

interface ArchivePageProps {
  searchParams: Promise<{ month?: string }>;
}

/** 過去の問題一覧（提出済み/未提出のステータス付き） */
export default async function ArchivePage({ searchParams }: ArchivePageProps) {
  const supabase = await createClient();
  const appUser = await requireStudent(supabase);

  const { month: monthParam } = await searchParams;
  const month = resolveMonthParam(monthParam);

  const today = getTodayJST();
  const { start, end } = getMonthDateRange(month);

  // 対象月の記事一覧（RLSにより公開日が当日以前のみ取得される）
  const { data: articles } = await supabase
    .from("articles")
    .select("id, publish_date, title")
    .gte("publish_date", start)
    .lte("publish_date", end > today ? today : end)
    .order("publish_date", { ascending: false });

  // 自分の提出状況
  const articleIds = (articles ?? []).map((a) => a.id);
  const { data: submissions } = articleIds.length
    ? await supabase
        .from("submissions")
        .select("id, article_id, score_overall")
        .eq("user_id", appUser.id)
        .in("article_id", articleIds)
    : { data: [] };

  const submissionByArticleId = new Map(
    (submissions ?? []).map((s) => [s.article_id, s])
  );

  return (
    <div className="flex flex-col gap-4 p-4 pb-8">
      <header className="pt-2 flex items-end justify-between">
        <h1 className="text-lg font-bold">過去の問題</h1>
        <Link href="/" className="text-sm text-blue-600 hover:underline pb-0.5">
          今日の記事
        </Link>
      </header>

      <MonthNav month={month} basePath="/archive" />

      {/* 記事一覧 */}
      {articles && articles.length > 0 ? (
        <ul className="space-y-2">
          {articles.map((article) => {
            const submission = submissionByArticleId.get(article.id);
            const href = submission
              ? `/result/${submission.id}`
              : `/article/${article.id}`;

            return (
              <li key={article.id}>
                <Link
                  href={href}
                  className="flex items-center gap-3 bg-white rounded-xl shadow-sm p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500">
                      {formatDayLabel(article.publish_date)}
                    </p>
                    <p className="text-sm font-medium truncate">
                      {article.title}
                    </p>
                  </div>
                  {submission ? (
                    <span className="shrink-0 text-sm font-bold text-green-600">
                      ✅ {submission.score_overall}点
                    </span>
                  ) : (
                    <span className="shrink-0 text-sm text-red-500">
                      未提出
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-gray-500 text-sm">この月の記事はありません。</p>
        </div>
      )}
    </div>
  );
}
