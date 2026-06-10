"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface SummaryFormProps {
  articleId: string;
}

const MIN_LENGTH = 80;
const MAX_LENGTH = 120;

/** 要約入力フォーム（文字数カウント・80〜120字制限） */
export default function SummaryForm({ articleId }: SummaryFormProps) {
  const router = useRouter();
  const [summary, setSummary] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const charCount = summary.length;
  const isValidLength = charCount >= MIN_LENGTH && charCount <= MAX_LENGTH;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidLength || isSubmitting) return;

    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ article_id: articleId, summary }),
      });

      const data = await res.json();

      if (!res.ok) {
        // 提出済み（409）なら既存のフィードバック画面へ誘導する
        if (res.status === 409 && data.submission_id) {
          router.push(`/result/${data.submission_id}`);
          return;
        }
        setError(data.error || "エラーが発生しました");
        return;
      }

      // フィードバック画面にリダイレクト
      router.push(`/result/${data.submission_id}`);
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <label htmlFor="summary" className="block text-sm font-medium">
        要約を書いてください
      </label>

      <textarea
        id="summary"
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
        placeholder={`記事を読んで、${MIN_LENGTH}〜${MAX_LENGTH}文字で要約してください`}
        rows={5}
        className="w-full rounded-xl border border-gray-300 p-3 text-sm leading-relaxed focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
        disabled={isSubmitting}
      />

      {/* 文字数カウンター */}
      <div className="flex items-center justify-between text-xs">
        <span
          className={
            charCount === 0
              ? "text-gray-400"
              : isValidLength
                ? "text-green-600"
                : "text-red-500"
          }
        >
          {charCount} / {MIN_LENGTH}〜{MAX_LENGTH}文字
        </span>
        {error && <span className="text-red-500">{error}</span>}
      </div>

      <button
        type="submit"
        disabled={!isValidLength || isSubmitting}
        className="w-full rounded-xl bg-blue-600 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        {isSubmitting ? "採点中..." : "提出する"}
      </button>
    </form>
  );
}
