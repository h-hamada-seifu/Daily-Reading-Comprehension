/** 語彙メモ（1件分） */
export interface VocabNote {
  word: string;
  reading: string;
  meaning: string;
}

/** articles テーブルの行 */
export interface Article {
  id: string;
  publish_date: string;
  title: string;
  body: string;
  vocab_notes: VocabNote[];
  created_at: string;
}

/** 4観点スコア */
export interface Scores {
  /** 要点の把握（0〜25） */
  main_point: { score: number; comment: string };
  /** 文法（0〜25） */
  grammar: { score: number; comment: string };
  /** 自分の言葉（0〜25） */
  own_words: { score: number; comment: string };
  /** 語彙レベル（0〜25） */
  vocabulary: { score: number; comment: string };
}

/** submissions テーブルの行 */
export interface Submission {
  id: string;
  user_id: string;
  article_id: string;
  summary: string;
  score_overall: number;
  scores: Scores;
  submitted_at: string;
}

/** Supabase Database 型定義 */
export interface Database {
  public: {
    Tables: {
      articles: {
        Row: Article;
        Insert: Omit<Article, "id" | "created_at">;
        Update: Partial<Omit<Article, "id" | "created_at">>;
      };
      submissions: {
        Row: Submission;
        Insert: Omit<Submission, "id" | "submitted_at">;
        Update: Partial<Omit<Submission, "id" | "submitted_at">>;
      };
    };
  };
}
