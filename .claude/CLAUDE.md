# プロジェクト AI ガイド（N2読解練習アプリ）

> このファイルは、**N2読解練習アプリ専用の AI 向けルール集**です。
> 共通ルール（`~/.claude/CLAUDE.md`）に加えて、このプロジェクト固有の前提・例外・開発規約を定義します。

---

## 1. プロジェクト概要

- **プロジェクト名**: N2読解練習アプリ (Daily Reading Comprehension)
- **概要**:
  - 毎朝、前日のニュース記事（200〜250字）を生徒のスマートフォンに提供
  - 生徒が80〜120字の要約を書いて提出
  - Gemini APIが4観点（要点の把握・文法・自分の言葉・語彙レベル）でフィードバック生成
  - 1日5分以内で完結するモバイルファーストのWebアプリ
- **想定ユーザー**:
  - JLPT N2〜N3レベルの外国人留学生（数十〜百名規模）
  - 教師（将来拡張：記事・提出状況の確認）
- **設計書**: `docs/design-spec.md`

---

## 2. 技術スタック

### 2.1 フレームワーク・言語
- **言語**: TypeScript
- **フレームワーク**: Next.js (App Router)
- **ホスティング**: Vercel（Cronジョブ対応）
- **パッケージマネージャー**: npm（または既存構成に合わせる）

### 2.2 外部サービス
- **Supabase**: PostgreSQLデータベース + Auth（Google OAuth）+ RLS
- **Gemini API**: `gemini-2.5-flash-lite`（記事生成・フィードバック生成）
- **Vercel Cron**: 毎日22:00 JSTに記事自動生成バッチを起動

### 2.3 認証
- **方式**: Supabase Auth + Google OAuth
- **ドメイン制限**: `i-seifu.jp` のGoogleアカウントのみ

---

## 3. ディレクトリ構成ルール

Next.js App Router構成に従う。

```text
Daily-Reading-Comprehension/
├── app/                    # App Router ページ・レイアウト
│   ├── layout.tsx          # ルートレイアウト
│   ├── page.tsx            # トップ（今日の記事）
│   ├── login/              # ログイン画面
│   ├── result/[id]/        # フィードバック表示
│   └── api/                # API Routes
│       ├── feedback/       # 要約提出・採点
│       └── generate-article/ # 夜間バッチ（記事生成）
├── components/             # UIコンポーネント
├── lib/                    # ユーティリティ・設定
│   ├── supabase/           # Supabaseクライアント設定
│   └── gemini/             # Gemini API設定・プロンプト
├── types/                  # TypeScript型定義
├── docs/                   # 設計書
├── .claude/                # AI向けルール
├── .env.local              # 環境変数（コミット禁止）
├── vercel.json             # Vercel設定（Cronジョブ含む）
└── package.json
```

### ルール
- `app/api/`: API Route（サーバーサイドのみ）
- `lib/`: 再利用可能なユーティリティ・外部サービスとの接続
- `components/`: プレゼンテーション用コンポーネント
- `.env.local`: 環境変数（絶対にコミットしない）

---

## 4. コーディング規約

### 4.1 TypeScript
- 厳密な型定義を使用（`any` は避ける）
- Gemini APIのレスポンスには型ガードまたはバリデーションを実施
- Server Components をデフォルトで使用し、必要な場合のみ `"use client"` を付与

### 4.2 API Route パターン
```typescript
// app/api/feedback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  // 認証チェック
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }
  // 処理...
}
```

### 4.3 Gemini API呼び出しパターン
```typescript
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash-lite",
  generationConfig: { responseMimeType: "application/json" },
});
```
- `responseMimeType: "application/json"` を必ず指定してJSON出力を安定させる
- プロンプトは `lib/gemini/` に集約する

---

## 5. データモデル

### articles（記事テーブル）
| カラム | 型 | 説明 |
|--------|----|------|
| `id` | uuid | PK |
| `publish_date` | date | 公開日 |
| `title` | text | 記事タイトル（20〜30字） |
| `body` | text | 本文（200〜250字） |
| `vocab_notes` | jsonb | 語彙メモ（配列） |
| `created_at` | timestamptz | 生成日時 |

### submissions（提出テーブル）
| カラム | 型 | 説明 |
|--------|----|------|
| `id` | uuid | PK |
| `user_id` | uuid | FK → auth.users |
| `article_id` | uuid | FK → articles |
| `summary` | text | 生徒の要約文 |
| `score_overall` | int2 | 総合スコア（0〜100） |
| `scores` | jsonb | 4観点スコア＋コメント |
| `submitted_at` | timestamptz | 提出日時 |

- `(user_id, article_id)` にUNIQUE制約で1日1回制限を実現
- RLS（Row Level Security）を有効にし、生徒は自分のデータのみアクセス可能

---

## 6. 環境変数

| 変数名 | 説明 |
|--------|------|
| `GEMINI_API_KEY` | Google AI Studio で発行したAPIキー |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase プロジェクトURL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名キー |
| `SUPABASE_SERVICE_ROLE_KEY` | Cronジョブ用サービスロールキー |
| `CRON_SECRET` | Vercel Cron 認証トークン |

---

## 7. ビルド・品質チェック

```bash
# 型チェック
npx tsc --noEmit

# リンタ
npx next lint

# ビルド
npm run build
```

実装完了後は `npm run build` でエラーがないことを確認する。

---

## 8. セキュリティ

- `GEMINI_API_KEY` や `SUPABASE_SERVICE_ROLE_KEY` はサーバーサイド（API Route）でのみ使用
- `NEXT_PUBLIC_` プレフィックスの変数のみクライアントに公開
- Cron API Route は `CRON_SECRET` で認証（`Authorization: Bearer <CRON_SECRET>`）
- Supabase RLSで生徒間のデータ分離を保証

---

## 9. 非機能要件

| 項目 | 目標値 |
|------|--------|
| フィードバック応答時間 | 20秒以内 |
| 対応端末 | スマートフォン（iOS Safari / Android Chrome） |
| アクセス制限 | i-seifu.jp Googleアカウントのみ |
| 1日1回制限 | DB UNIQUE制約で担保 |

---

## 10. このファイルの運用ルール

- 技術スタック変更時: セクション2を更新
- テーブル追加・変更時: セクション5を更新
- 環境変数追加時: セクション6を更新
- ディレクトリ構成変更時: セクション3を更新

---

### 更新履歴

- 2026-03-31: 初版作成（設計書v0.2に基づく）
