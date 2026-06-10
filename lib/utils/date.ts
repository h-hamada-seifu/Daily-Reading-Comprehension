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

/** YYYY-MM形式の月文字列かを判定する */
export function isValidMonth(month: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(month);
}

/**
 * 現在のJST月をYYYY-MM形式で返す
 */
export function getCurrentMonthJST(): string {
  return getTodayJST().slice(0, 7);
}

/**
 * 月（YYYY-MM）の開始日・終了日をYYYY-MM-DD形式で返す
 */
export function getMonthDateRange(month: string): { start: string; end: string } {
  const [year, monthNum] = month.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, monthNum, 0)).getUTCDate();
  return {
    start: `${month}-01`,
    end: `${month}-${String(lastDay).padStart(2, "0")}`,
  };
}

/**
 * 月選択パラメータを検証して返す（不正・未来の月は当月にフォールバック）
 */
export function resolveMonthParam(monthParam: string | undefined): string {
  const currentMonth = getCurrentMonthJST();
  return monthParam && isValidMonth(monthParam) && monthParam <= currentMonth
    ? monthParam
    : currentMonth;
}

/**
 * 月（YYYY-MM）をdeltaヶ月ずらしたYYYY-MM形式で返す
 */
export function shiftMonth(month: string, delta: number): string {
  const [year, monthNum] = month.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, monthNum - 1 + delta, 1));
  const y = shifted.getUTCFullYear();
  const m = String(shifted.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

/**
 * 月（YYYY-MM）を「YYYY年M月」形式で返す
 */
export function formatMonthLabel(month: string): string {
  const [year, monthNum] = month.split("-").map(Number);
  return `${year}年${monthNum}月`;
}

/**
 * 日付（YYYY-MM-DD）を「M/D」形式で返す
 */
export function formatShortDayLabel(date: string): string {
  const [, monthNum, day] = date.split("-").map(Number);
  return `${monthNum}/${day}`;
}

/**
 * 日付（YYYY-MM-DD）を「M/D（曜）」形式で返す
 */
export function formatDayLabel(date: string): string {
  const [year, monthNum, day] = date.split("-").map(Number);
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  const weekday = weekdays[new Date(Date.UTC(year, monthNum - 1, day)).getUTCDay()];
  return `${monthNum}/${day}（${weekday}）`;
}
