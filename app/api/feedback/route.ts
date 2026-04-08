import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { geminiModel } from "@/lib/gemini/client";
import { buildFeedbackPrompt, convertGeminiScores } from "@/lib/gemini/prompts";
import type { GeminiFeedbackResponse } from "@/types/gemini";

/** 要約の文字数制限 */
const MIN_LENGTH = 80;
const MAX_LENGTH = 120;

/**
 * 要約を受け取り、Gemini APIで採点してDBに保存する
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // 認証チェック
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  // リクエストボディの取得とバリデーション
  const body = await request.json();
  const { article_id, summary } = body as {
    article_id: string;
    summary: string;
  };

  if (!article_id || !summary) {
    return NextResponse.json(
      { error: "article_id と summary は必須です" },
      { status: 400 }
    );
  }

  const trimmedSummary = summary.trim();
  if (trimmedSummary.length < MIN_LENGTH || trimmedSummary.length > MAX_LENGTH) {
    return NextResponse.json(
      { error: `要約は${MIN_LENGTH}〜${MAX_LENGTH}文字で入力してください` },
      { status: 400 }
    );
  }

  // 重複提出チェック
  const { data: existingSubmission } = await supabase
    .from("submissions")
    .select("id")
    .eq("user_id", user.id)
    .eq("article_id", article_id)
    .maybeSingle();

  if (existingSubmission) {
    return NextResponse.json(
      { error: "この記事には既に提出済みです", submission_id: existingSubmission.id },
      { status: 409 }
    );
  }

  // 記事の取得
  const { data: article, error: articleError } = await supabase
    .from("articles")
    .select("title, body")
    .eq("id", article_id)
    .single();

  if (articleError || !article) {
    return NextResponse.json(
      { error: "記事が見つかりません" },
      { status: 404 }
    );
  }

  // Gemini APIでフィードバック生成
  const prompt = buildFeedbackPrompt(article.title, article.body, trimmedSummary);
  const result = await geminiModel.generateContent(prompt);
  const text = result.response.text();
  const rawScores: GeminiFeedbackResponse = JSON.parse(text);

  // スコア変換（100点満点 → 25点満点）
  const { scoreOverall, scores } = convertGeminiScores(rawScores);

  // DBに保存
  const { data: submission, error: saveError } = await supabase
    .from("submissions")
    .insert({
      user_id: user.id,
      article_id,
      summary: trimmedSummary,
      score_overall: scoreOverall,
      scores,
    })
    .select("id")
    .single();

  if (saveError) {
    console.error("提出保存エラー:", saveError);
    return NextResponse.json(
      { error: "提出の保存に失敗しました" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    submission_id: submission.id,
    score_overall: scoreOverall,
    scores,
  });
}
