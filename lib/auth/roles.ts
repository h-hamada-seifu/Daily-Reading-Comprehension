import type { UserRole } from "@/types/database";

/** ログインを許可するメールドメイン */
export const ALLOWED_EMAIL_DOMAIN = "i-seifu.jp";

/**
 * 許可ドメインのメールアドレスかを判定する
 */
export function isAllowedDomainEmail(email: string): boolean {
  return email.toLowerCase().endsWith(`@${ALLOWED_EMAIL_DOMAIN}`);
}

/**
 * メールアドレスのローカル部（@より前）を返す
 */
export function getEmailLocalPart(email: string): string {
  return email.split("@")[0] ?? "";
}

/**
 * メールアドレスからロールを判定する
 * - ローカル部が数字のみ → 生徒（数字＝学籍番号）
 * - アルファベットを含む → 教師
 */
export function determineRoleFromEmail(email: string): UserRole {
  return /^[0-9]+$/.test(getEmailLocalPart(email)) ? "student" : "teacher";
}
