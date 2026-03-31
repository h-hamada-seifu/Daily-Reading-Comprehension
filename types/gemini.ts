import type { VocabNote, Scores } from "./database";

/** 記事生成APIのレスポンス型 */
export interface GenerateArticleResponse {
  title: string;
  body: string;
  vocab_notes: VocabNote[];
}

/** フィードバック生成APIのレスポンス型 */
export interface FeedbackResponse {
  score_overall: number;
  scores: Scores;
}
