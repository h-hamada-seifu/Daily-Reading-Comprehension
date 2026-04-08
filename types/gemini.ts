import type { VocabNote } from "./database";

/** 記事生成APIのレスポンス型（Geminiが返すJSON） */
export interface GenerateArticleResponse {
  title: string;
  body: string;
  vocab_notes: VocabNote[];
}

/** Geminiが返す各観点スコア（0〜100） */
export interface GeminiScoreItem {
  score: number;
  comment: string;
}

/** フィードバック生成APIのレスポンス型（Geminiが返すJSON） */
export interface GeminiFeedbackResponse {
  main_point: GeminiScoreItem;
  grammar: GeminiScoreItem;
  own_words: GeminiScoreItem;
  vocabulary: GeminiScoreItem;
}
