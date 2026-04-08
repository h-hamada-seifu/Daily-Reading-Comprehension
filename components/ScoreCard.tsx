import type { Scores } from "@/types/database";

interface ScoreCardProps {
  scoreOverall: number;
  scores: Scores;
}

/** 各観点の表示ラベル */
const SCORE_LABELS: Record<keyof Scores, string> = {
  main_point: "要点の把握",
  grammar: "文法",
  own_words: "自分の言葉",
  vocabulary: "語彙レベル",
};

/** フィードバック表示カード（総合スコア + 4観点） */
export default function ScoreCard({ scoreOverall, scores }: ScoreCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
      {/* 総合スコア */}
      <div className="text-center">
        <p className="text-xs text-gray-500">総合スコア</p>
        <p className="text-4xl font-bold text-blue-600">
          {scoreOverall}
          <span className="text-lg text-gray-400 ml-1">/ 100</span>
        </p>
      </div>

      {/* 4観点の詳細 */}
      <div className="space-y-3 border-t pt-4">
        {(Object.keys(SCORE_LABELS) as (keyof Scores)[]).map((key) => {
          const { score, comment } = scores[key];
          return (
            <div key={key} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {SCORE_LABELS[key]}
                </span>
                <span className="text-sm font-bold">{score} / 25</span>
              </div>
              {/* スコアバー */}
              <div className="h-2 rounded-full bg-gray-100">
                <div
                  className="h-2 rounded-full bg-blue-500 transition-all"
                  style={{ width: `${(score / 25) * 100}%` }}
                />
              </div>
              <p className="text-xs text-gray-600">{comment}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
