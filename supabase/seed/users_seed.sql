-- ============================================
-- 名簿シード（サンプル）
-- 実運用ではこのファイルを元に実際の名簿へ置き換えて投入する
-- 投入方法: Supabase ダッシュボードの SQL Editor で実行
-- ============================================

-- 教師（ローカル部にアルファベットを含む → role = 'teacher'）
INSERT INTO users (email, student_number, name, class_name, role) VALUES
  ('h.hamada@i-seifu.jp', NULL, '濱田 秀樹', NULL, 'teacher')
ON CONFLICT (email) DO NOTHING;

-- 生徒（ローカル部が数字のみ＝学籍番号 → role = 'student'）
-- ↓サンプル行。実際の名簿に置き換えること
INSERT INTO users (email, student_number, name, class_name, role) VALUES
  ('23001@i-seifu.jp', '23001', 'グエン ヴァン アン', NULL, 'student'),
  ('23002@i-seifu.jp', '23002', '王 小明', NULL, 'student'),
  ('23003@i-seifu.jp', '23003', 'キム ミンス', NULL, 'student')
ON CONFLICT (email) DO NOTHING;
