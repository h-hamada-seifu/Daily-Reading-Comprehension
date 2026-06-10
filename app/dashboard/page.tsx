import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAppUser } from "@/lib/auth/app-user";
import {
  formatMonthLabel,
  getCurrentMonthJST,
  getMonthDateRange,
  getTodayJST,
  isValidMonth,
  shiftMonth,
} from "@/lib/utils/date";

interface DashboardPageProps {
  searchParams: Promise<{ month?: string }>;
}

/** 日付（YYYY-MM-DD）を「M/D」形式で返す（マトリクス表の列見出し用） */
function formatShortDay(date: string): string {
  const [, monthNum, day] = date.split("-").map(Number);
  return `${monthNum}/${day}`;
}

/** 教師向けダッシュボード（生徒×日付の点数マトリクス表） */
export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const appUser = await getAppUser();

  if (!appUser) {
    redirect("/login");
  }

  // 生徒はトップページへ
  if (appUser.role !== "teacher") {
    redirect("/");
  }

  const currentMonth = getCurrentMonthJST();
  const { month: monthParam } = await searchParams;
  const month =
    monthParam && isValidMonth(monthParam) && monthParam <= currentMonth
      ? monthParam
      : currentMonth;

  const supabase = await createClient();
  const today = getTodayJST();
  const { start, end } = getMonthDateRange(month);

  // 対象月の記事（＝マトリクス表の列）と生徒名簿（＝行）を取得
  const [{ data: articles }, { data: students }] = await Promise.all([
    supabase
      .from("articles")
      .select("id, publish_date")
      .gte("publish_date", start)
      .lte("publish_date", end > today ? today : end)
      .order("publish_date", { ascending: true }),
    supabase
      .from("users")
      .select("id, student_number, name")
      .eq("role", "student")
      .order("student_number", { ascending: true }),
  ]);

  // 対象月の全生徒の提出を取得（教師はRLSで全行閲覧可能）
  const articleIds = (articles ?? []).map((a) => a.id);
  const { data: submissions } = articleIds.length
    ? await supabase
        .from("submissions")
        .select("user_id, article_id, score_overall")
        .in("article_id", articleIds)
    : { data: [] };

  // (user_id, article_id) → スコア のマップ
  const scoreMap = new Map(
    (submissions ?? []).map((s) => [
      `${s.user_id}:${s.article_id}`,
      s.score_overall,
    ])
  );

  const prevMonth = shiftMonth(month, -1);
  const nextMonth = shiftMonth(month, 1);
  const hasNextMonth = nextMonth <= currentMonth;

  return (
    <div className="flex flex-col gap-4 p-4 pb-8">
      <header className="pt-2">
        <h1 className="text-lg font-bold">読解練習ダッシュボード</h1>
        <p className="text-xs text-gray-500">
          各生徒の日々の点数（総合スコア）
        </p>
      </header>

      {/* 月選択 */}
      <div className="flex items-center justify-between bg-white rounded-xl shadow-sm px-2 py-1.5">
        <Link
          href={`/dashboard?month=${prevMonth}`}
          className="px-3 py-1.5 text-sm text-blue-600 hover:underline"
        >
          ← 前の月
        </Link>
        <span className="text-sm font-medium">{formatMonthLabel(month)}</span>
        {hasNextMonth ? (
          <Link
            href={`/dashboard?month=${nextMonth}`}
            className="px-3 py-1.5 text-sm text-blue-600 hover:underline"
          >
            次の月 →
          </Link>
        ) : (
          <span className="px-3 py-1.5 text-sm text-gray-300">次の月 →</span>
        )}
      </div>

      {/* マトリクス表 */}
      {students && students.length > 0 && articles && articles.length > 0 ? (
        <div className="overflow-x-auto bg-white rounded-xl shadow-sm">
          <table className="text-sm border-collapse min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="sticky left-0 bg-white text-left font-medium text-gray-500 px-3 py-2 whitespace-nowrap border-r border-gray-200">
                  生徒
                </th>
                {articles.map((article) => (
                  <th
                    key={article.id}
                    className="font-medium text-gray-500 px-3 py-2 text-center whitespace-nowrap"
                  >
                    {formatShortDay(article.publish_date)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr
                  key={student.id}
                  className="border-b border-gray-100 last:border-b-0"
                >
                  <td className="sticky left-0 bg-white px-3 py-2 whitespace-nowrap border-r border-gray-200">
                    <span className="font-medium">{student.name}</span>
                    <span className="text-xs text-gray-400 ml-1.5">
                      {student.student_number}
                    </span>
                  </td>
                  {articles.map((article) => {
                    const score = scoreMap.get(`${student.id}:${article.id}`);
                    return (
                      <td
                        key={article.id}
                        className={`px-3 py-2 text-center tabular-nums ${
                          score === undefined ? "text-gray-300" : ""
                        }`}
                      >
                        {score ?? "−"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-gray-500 text-sm">
            {students && students.length === 0
              ? "生徒が名簿に登録されていません。"
              : "この月の記事はありません。"}
          </p>
        </div>
      )}
    </div>
  );
}
