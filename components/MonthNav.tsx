import Link from "next/link";
import {
  formatMonthLabel,
  getCurrentMonthJST,
  shiftMonth,
} from "@/lib/utils/date";

interface MonthNavProps {
  /** 表示中の月（YYYY-MM） */
  month: string;
  /** 月切り替えリンクの遷移先パス（例: "/archive"） */
  basePath: string;
}

/** 月選択ナビゲーション（未来の月へは進めない） */
export default function MonthNav({ month, basePath }: MonthNavProps) {
  const prevMonth = shiftMonth(month, -1);
  const nextMonth = shiftMonth(month, 1);
  const hasNextMonth = nextMonth <= getCurrentMonthJST();

  return (
    <div className="flex items-center justify-between bg-white rounded-xl shadow-sm px-2 py-1.5">
      <Link
        href={`${basePath}?month=${prevMonth}`}
        className="px-3 py-1.5 text-sm text-blue-600 hover:underline"
      >
        ← 前の月
      </Link>
      <span className="text-sm font-medium">{formatMonthLabel(month)}</span>
      {hasNextMonth ? (
        <Link
          href={`${basePath}?month=${nextMonth}`}
          className="px-3 py-1.5 text-sm text-blue-600 hover:underline"
        >
          次の月 →
        </Link>
      ) : (
        <span className="px-3 py-1.5 text-sm text-gray-300">次の月 →</span>
      )}
    </div>
  );
}
