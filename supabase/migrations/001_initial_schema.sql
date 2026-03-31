-- ============================================
-- N2読解練習アプリ 初期スキーマ
-- ============================================

-- articles テーブル
CREATE TABLE articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  publish_date date NOT NULL UNIQUE,
  title text NOT NULL,
  body text NOT NULL,
  vocab_notes jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE articles IS '毎日のニュース記事';
COMMENT ON COLUMN articles.publish_date IS '公開日（1日1記事）';
COMMENT ON COLUMN articles.vocab_notes IS '語彙メモ配列 [{word, reading, meaning}]';

-- submissions テーブル
CREATE TABLE submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  article_id uuid NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  summary text NOT NULL,
  score_overall int2 NOT NULL CHECK (score_overall BETWEEN 0 AND 100),
  scores jsonb NOT NULL,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, article_id)
);

COMMENT ON TABLE submissions IS '生徒の要約提出';
COMMENT ON COLUMN submissions.scores IS '4観点スコア {main_point, grammar, own_words, vocabulary}';

-- インデックス
CREATE INDEX idx_articles_publish_date ON articles(publish_date DESC);
CREATE INDEX idx_submissions_user_id ON submissions(user_id);
CREATE INDEX idx_submissions_article_id ON submissions(article_id);

-- ============================================
-- Row Level Security (RLS)
-- ============================================

-- articles: 認証済みユーザーのみ閲覧可
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "認証済みユーザーは記事を閲覧可能"
  ON articles FOR SELECT
  TO authenticated
  USING (true);

-- submissions: 自分のデータのみアクセス可能
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "自分の提出のみ閲覧可能"
  ON submissions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "自分の提出のみ作成可能"
  ON submissions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
