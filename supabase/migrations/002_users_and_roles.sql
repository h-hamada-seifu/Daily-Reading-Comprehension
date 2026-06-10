-- ============================================
-- v0.3: users テーブル・ロール判定・RLS再構築
-- 設計書: docs/design-spec.md セクション4
-- 注意: 本番運用前のため submissions は作り直す（既存データは破棄）
-- ============================================

-- ============================================
-- 1. users テーブル（名簿）
-- ============================================

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  student_number text UNIQUE,
  name text NOT NULL,
  class_name text,
  role text NOT NULL CHECK (role IN ('student', 'teacher')),
  auth_user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  -- 生徒は学籍番号必須、教師は学籍番号なし
  CONSTRAINT student_number_required_for_student
    CHECK ((role = 'student') = (student_number IS NOT NULL))
);

COMMENT ON TABLE users IS 'アプリ内ユーザー名簿（教師が事前登録）';
COMMENT ON COLUMN users.email IS 'i-seifu.jp のメールアドレス（名簿照合キー）';
COMMENT ON COLUMN users.student_number IS '学籍番号（生徒のみ。メールのローカル部と一致）';
COMMENT ON COLUMN users.class_name IS 'クラス（現時点では未使用、将来のクラス別表示用）';
COMMENT ON COLUMN users.auth_user_id IS '初回ログイン時に auth.users と紐付け';

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_student_number ON users(student_number);

-- ============================================
-- 2. ロール判定ヘルパー関数
-- RLSポリシーから利用するため SECURITY DEFINER で定義
-- ============================================

-- ログイン中ユーザーのアプリ内ユーザーIDを返す（未登録なら NULL）
CREATE OR REPLACE FUNCTION current_app_user_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT id FROM users WHERE auth_user_id = auth.uid();
$$;

-- ログイン中ユーザーが教師かを返す
CREATE OR REPLACE FUNCTION is_teacher()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE auth_user_id = auth.uid() AND role = 'teacher'
  );
$$;

-- ============================================
-- 3. submissions テーブルの作り直し（users 参照に変更）
-- ============================================

DROP TABLE IF EXISTS submissions;

CREATE TABLE submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  article_id uuid NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  summary text NOT NULL,
  score_overall int2 NOT NULL CHECK (score_overall BETWEEN 0 AND 100),
  scores jsonb NOT NULL,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, article_id)
);

COMMENT ON TABLE submissions IS '生徒の要約提出（日々の採点結果の蓄積）';
COMMENT ON COLUMN submissions.user_id IS 'FK → users.id（アプリ内ユーザー）';
COMMENT ON COLUMN submissions.scores IS '4観点スコア {main_point, grammar, own_words, vocabulary}';

CREATE INDEX idx_submissions_user_id ON submissions(user_id);
CREATE INDEX idx_submissions_article_id ON submissions(article_id);

-- ============================================
-- 4. RLS ポリシー
-- ============================================

-- users: 生徒は自分の行のみ、教師は全行閲覧可
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "自分の名簿行のみ閲覧可能"
  ON users FOR SELECT
  TO authenticated
  USING (auth_user_id = auth.uid() OR is_teacher());

-- articles: 公開日が当日（JST）以前のみ閲覧可（夜間バッチの翌日分を隠す）
DROP POLICY IF EXISTS "認証済みユーザーは記事を閲覧可能" ON articles;

CREATE POLICY "公開済みの記事のみ閲覧可能"
  ON articles FOR SELECT
  TO authenticated
  USING (publish_date <= (now() AT TIME ZONE 'Asia/Tokyo')::date);

-- submissions: 生徒は自分の行のみ閲覧・作成可、教師は全行閲覧のみ可
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "自分の提出または教師は閲覧可能"
  ON submissions FOR SELECT
  TO authenticated
  USING (user_id = current_app_user_id() OR is_teacher());

CREATE POLICY "生徒は自分の提出のみ作成可能"
  ON submissions FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = current_app_user_id()
    AND NOT is_teacher()
  );
