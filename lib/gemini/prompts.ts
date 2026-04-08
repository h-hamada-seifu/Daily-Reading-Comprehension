import type { GenerateArticleResponse, GeminiFeedbackResponse } from "@/types/gemini";
import type { Scores } from "@/types/database";

/**
 * 記事生成プロンプトを組み立てる
 * @param dateStr 公開日（YYYY-MM-DD）
 */
export function buildArticlePrompt(dateStr: string): string {
  return `あなたはJLPT N2レベルの日本語学習者向けに、ニュース記事を作成する教育アシスタントです。

以下の条件で、前日のニュースに基づいた短い記事を1つ作成してください。

## 条件
- 公開日: ${dateStr}
- タイトル: 20〜30文字
- 本文: 200〜250文字
- JLPT N2レベルの語彙・文法を中心に使用
- 実際のニューストピックに基づく内容（政治・経済・社会・文化・技術など）
- 語彙メモ: N2レベルの学習者にとって難しい可能性がある単語を3〜5個選び、読み方と意味を添える

## 出力形式（JSON）
{
  "title": "記事タイトル",
  "body": "記事本文",
  "vocab_notes": [
    { "word": "単語", "reading": "たんご", "meaning": "意味の説明" }
  ]
}`;
}

/**
 * フィードバック生成プロンプトを組み立てる
 */
export function buildFeedbackPrompt(
  articleTitle: string,
  articleBody: string,
  summary: string
): string {
  return `あなたはJLPT N2レベルの日本語教師です。
生徒が以下のニュース記事を読み、要約を書きました。4つの観点で採点し、フィードバックを返してください。

## 記事
タイトル: ${articleTitle}
本文: ${articleBody}

## 生徒の要約
${summary}

## 採点基準（各観点0〜100点）
1. **main_point（要点の把握）**: 記事の重要な情報を正確に捉えているか
2. **grammar（文法）**: 文法的に正しく書けているか
3. **own_words（自分の言葉）**: 記事の丸写しではなく、自分の言葉で表現できているか
4. **vocabulary（語彙レベル）**: N2レベルにふさわしい語彙を使えているか

## 出力形式（JSON）
各観点のscoreは0〜100の整数、commentはN2学習者に分かりやすい日本語で50文字以内で書いてください。
{
  "main_point": { "score": 80, "comment": "コメント" },
  "grammar": { "score": 70, "comment": "コメント" },
  "own_words": { "score": 90, "comment": "コメント" },
  "vocabulary": { "score": 75, "comment": "コメント" }
}`;
}

/**
 * 記事生成レスポンスのバリデーション
 * @throws バリデーション失敗時にError
 */
export function validateArticleResponse(data: unknown): GenerateArticleResponse {
  const obj = data as Record<string, unknown>;
  if (
    typeof obj?.title !== "string" ||
    typeof obj?.body !== "string" ||
    !Array.isArray(obj?.vocab_notes)
  ) {
    throw new Error("記事生成レスポンスの形式が不正です");
  }
  return obj as unknown as GenerateArticleResponse;
}

/**
 * フィードバックレスポンスのバリデーション
 * @throws バリデーション失敗時にError
 */
export function validateFeedbackResponse(data: unknown): GeminiFeedbackResponse {
  const obj = data as Record<string, unknown>;
  const keys = ["main_point", "grammar", "own_words", "vocabulary"] as const;
  for (const key of keys) {
    const item = obj?.[key] as Record<string, unknown> | undefined;
    if (
      typeof item?.score !== "number" ||
      item.score < 0 ||
      item.score > 100 ||
      typeof item?.comment !== "string"
    ) {
      throw new Error(`フィードバックレスポンスの ${key} が不正です`);
    }
  }
  return obj as unknown as GeminiFeedbackResponse;
}

/**
 * Geminiの100点満点スコアをDB用の25点満点に変換し、総合スコアも算出する
 */
export function convertGeminiScores(raw: GeminiFeedbackResponse): {
  scoreOverall: number;
  scores: Scores;
} {
  const convert = (item: { score: number; comment: string }) => ({
    score: Math.round(item.score / 4),
    comment: item.comment,
  });

  const scores: Scores = {
    main_point: convert(raw.main_point),
    grammar: convert(raw.grammar),
    own_words: convert(raw.own_words),
    vocabulary: convert(raw.vocabulary),
  };

  const scoreOverall =
    scores.main_point.score +
    scores.grammar.score +
    scores.own_words.score +
    scores.vocabulary.score;

  return { scoreOverall, scores };
}
