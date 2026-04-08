/**
 * 現在のJST日付をYYYY-MM-DD形式で返す
 */
export function getTodayJST(): string {
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return jst.toISOString().slice(0, 10);
}

/**
 * 翌日のJST日付をYYYY-MM-DD形式で返す（夜間バッチで翌日分の記事を生成する用）
 */
export function getTomorrowJST(): string {
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000 + 24 * 60 * 60 * 1000);
  return jst.toISOString().slice(0, 10);
}
