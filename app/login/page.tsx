import LoginButton from "@/components/LoginButton";
import { ALLOWED_EMAIL_DOMAIN } from "@/lib/auth/roles";

/** ログイン失敗理由ごとのエラーメッセージ */
const ERROR_MESSAGES: Record<string, string> = {
  domain: `${ALLOWED_EMAIL_DOMAIN} のアカウントでログインしてください。`,
  not_registered:
    "このアカウントは名簿に登録されていません。先生に確認してください。",
  auth: "ログインに失敗しました。もう一度お試しください。",
};

interface LoginPageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error } = await searchParams;
  const errorMessage = error ? ERROR_MESSAGES[error] : undefined;

  return (
    <div className="flex flex-col items-center justify-center min-h-dvh p-6">
      <div className="text-center space-y-6 w-full max-w-sm">
        <h1 className="text-2xl font-bold">N2読解練習</h1>
        <p className="text-gray-600 text-sm">
          毎日のニュース記事で読解力を鍛えよう
        </p>

        {errorMessage && (
          <p
            role="alert"
            className="rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm p-3"
          >
            {errorMessage}
          </p>
        )}

        <LoginButton />

        <p className="text-xs text-gray-400">
          {ALLOWED_EMAIL_DOMAIN} のアカウントのみ利用できます
        </p>
      </div>
    </div>
  );
}
