/** ユーザーのロール */
export type UserRole = "student" | "teacher";

/** users テーブルの行（アプリ内ユーザー名簿） */
export type AppUser = {
  id: string;
  email: string;
  /** 学籍番号（生徒のみ。教師は null） */
  student_number: string | null;
  name: string;
  /** クラス（現時点では未使用） */
  class_name: string | null;
  role: UserRole;
  /** 初回ログイン時に auth.users と紐付け */
  auth_user_id: string | null;
  created_at: string;
};

/** 語彙メモ（1件分） */
export type VocabNote = {
  word: string;
  reading: string;
  meaning: string;
};

/** articles テーブルの行 */
export type Article = {
  id: string;
  publish_date: string;
  title: string;
  body: string;
  vocab_notes: VocabNote[];
  created_at: string;
};

/** 4観点の各スコア */
export type ScoreItem = {
  score: number;
  comment: string;
};

/** 4観点スコア */
export type Scores = {
  /** 要点の把握（0〜25） */
  main_point: ScoreItem;
  /** 文法（0〜25） */
  grammar: ScoreItem;
  /** 自分の言葉（0〜25） */
  own_words: ScoreItem;
  /** 語彙レベル（0〜25） */
  vocabulary: ScoreItem;
};

/** submissions テーブルの行 */
export type Submission = {
  id: string;
  user_id: string;
  article_id: string;
  summary: string;
  score_overall: number;
  scores: Scores;
  submitted_at: string;
};

/** Supabase Database 型定義 */
export type Database = {
  public: {
    Tables: {
      users: {
        Row: AppUser;
        Insert: Omit<AppUser, "id" | "created_at">;
        Update: Partial<Omit<AppUser, "id" | "created_at">>;
        Relationships: [];
      };
      articles: {
        Row: Article;
        Insert: Omit<Article, "id" | "created_at">;
        Update: Partial<Omit<Article, "id" | "created_at">>;
        Relationships: [
          {
            foreignKeyName: "submissions_article_id_fkey";
            columns: ["id"];
            isOneToOne: false;
            referencedRelation: "submissions";
            referencedColumns: ["article_id"];
          },
        ];
      };
      submissions: {
        Row: Submission;
        Insert: Omit<Submission, "id" | "submitted_at">;
        Update: Partial<Omit<Submission, "id" | "submitted_at">>;
        Relationships: [
          {
            foreignKeyName: "submissions_article_id_fkey";
            columns: ["article_id"];
            isOneToOne: false;
            referencedRelation: "articles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "submissions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
