import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { geminiModel } from "@/lib/gemini/client";
import { buildArticlePrompt } from "@/lib/gemini/prompts";
import { getTomorrowJST } from "@/lib/utils/date";
import type { GenerateArticleResponse } from "@/types/gemini";

/**
 * Cronバッチ: 翌日分の記事を自動生成
 * 毎日22:00 JST（UTC 13:00）に実行
 */
export async function GET(request: NextRequest) {
  // CRON_SECRET による認証
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "認証エラー" }, { status: 401 });
  }

  const publishDate = getTomorrowJST();
  const supabase = createAdminClient();

  // 冪等性チェック: 同日の記事が既に存在する場合はスキップ
  const { data: existing } = await supabase
    .from("articles")
    .select("id")
    .eq("publish_date", publishDate)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({
      message: "記事は既に生成済みです",
      article_id: existing.id,
    });
  }

  // Gemini APIで記事生成
  const prompt = buildArticlePrompt(publishDate);
  const result = await geminiModel.generateContent(prompt);
  const text = result.response.text();
  const article: GenerateArticleResponse = JSON.parse(text);

  // DBに保存
  const { data, error } = await supabase
    .from("articles")
    .insert({
      publish_date: publishDate,
      title: article.title,
      body: article.body,
      vocab_notes: article.vocab_notes,
    })
    .select("id")
    .single();

  if (error) {
    console.error("記事保存エラー:", error);
    return NextResponse.json(
      { error: "記事の保存に失敗しました" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    message: "記事を生成しました",
    article_id: data.id,
    publish_date: publishDate,
  });
}
