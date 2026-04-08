import type { Article } from "@/types/database";

interface ArticleCardProps {
  article: Article;
}

/** 記事表示カード（タイトル・本文・語彙メモ） */
export default function ArticleCard({ article }: ArticleCardProps) {
  return (
    <article className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
      <h2 className="text-lg font-bold leading-snug">{article.title}</h2>

      <p className="text-sm leading-relaxed whitespace-pre-wrap">
        {article.body}
      </p>

      {article.vocab_notes.length > 0 && (
        <div className="border-t pt-3">
          <h3 className="text-xs font-medium text-gray-500 mb-2">
            語彙メモ
          </h3>
          <ul className="space-y-1">
            {article.vocab_notes.map((note) => (
              <li key={note.word} className="text-sm">
                <span className="font-medium">{note.word}</span>
                <span className="text-gray-500 ml-1">({note.reading})</span>
                <span className="text-gray-600 ml-1">- {note.meaning}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}
