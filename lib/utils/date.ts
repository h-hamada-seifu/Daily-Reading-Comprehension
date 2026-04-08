/**
 * JSTでの日付をYYYY-MM-DD形式で返す
 */
function formatDateJST(date: Date): string {
  const formatter = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(date);
  const year = parts.find((p) => p.type === "year")!.value;
  const month = parts.find((p) => p.type === "month")!.value;
  const day = parts.find((p) => p.type === "day")!.value;
  return `${year}-${month}-${day}`;
}

/**
 * 現在のJST日付をYYYY-MM-DD形式で返す
 */
export function getTodayJST(): string {
  return formatDateJST(new Date());
}

/**
 * 翌日のJST日付をYYYY-MM-DD形式で返す（夜間バッチで翌日分の記事を生成する用）
 */
export function getTomorrowJST(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return formatDateJST(tomorrow);
}
