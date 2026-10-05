"use client";

import { type AdminVariety, type Review, shortDate } from "@pomona/shared";
import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import { ReviewForm } from "./ReviewForm";
import styles from "./reviews.module.css";

/** 띄어쓰기·대소문자를 무시하고 찾는다 */
function normalize(text: string): string {
  return text.replace(/\s+/g, "").toLowerCase();
}

/** 왼쪽 목록에서 고른 것. 새 리뷰를 쓰는 중이면 "new" */
type Selection = number | "new";

/**
 * 리뷰 목록과 작성·수정. 왼쪽에서 고르면 오른쪽 폼에 불러온다. 임시저장은 없고, 저장하지 않은 채
 * 다른 리뷰로 옮기려 하면 버릴지 묻는다. 저장해도 공개면은 빌드를 돌려야 바뀐다.
 */
export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [varieties, setVarieties] = useState<AdminVariety[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selection, setSelection] = useState<Selection>("new");
  const [dirty, setDirty] = useState(false);
  const [query, setQuery] = useState("");
  /** 저장·삭제 결과 한 줄. 다른 리뷰를 고르면 지운다 */
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([adminApi.get<Review[]>("/reviews"), adminApi.get<AdminVariety[]>("/varieties")])
      .then(([loadedReviews, loadedVarieties]) => {
        setReviews(loadedReviews ?? []);
        setVarieties(loadedVarieties ?? []);
      })
      .catch((error: Error) => setLoadError(error.message));
  }, []);

  const select = (next: Selection) => {
    if (next === selection) {
      return;
    }
    if (dirty && !window.confirm("저장하지 않은 내용이 있습니다. 버리고 옮길까요?")) {
      return;
    }
    setDirty(false);
    setNotice(null);
    setSelection(next);
  };

  /** 저장한 리뷰를 목록에 넣고 먹은 날 최신순으로 다시 세운다(백엔드 목록과 같은 순서) */
  const onSaved = (saved: Review) => {
    setReviews((current) =>
      [...(current ?? []).filter((review) => review.id !== saved.id), saved].sort(
        (a, b) => b.eatenDate.localeCompare(a.eatenDate) || b.id - a.id,
      ),
    );
    setDirty(false);
    setNotice(`“${saved.title}” 저장했습니다. 공개면은 빌드를 돌려야 바뀝니다.`);
    setSelection(saved.id);
  };

  const onDeleted = (id: number) => {
    const deleted = reviews?.find((review) => review.id === id);
    setReviews((current) => (current ?? []).filter((review) => review.id !== id));
    setNotice(`“${deleted?.title}” 지웠습니다. 공개면은 빌드를 돌려야 바뀝니다.`);
    setDirty(false);
    setSelection("new");
  };

  if (loadError) {
    return <p className={styles.loadError}>불러오지 못했습니다: {loadError}</p>;
  }
  if (!reviews) {
    return <p className={styles.loading}>불러오는 중</p>;
  }

  const shown = query.trim()
    ? reviews.filter((review) =>
        normalize([review.fruitName, review.itemName, review.varietyName, review.title].join(" ")).includes(
          normalize(query),
        ),
      )
    : reviews;
  const current = selection === "new" ? null : (reviews.find((review) => review.id === selection) ?? null);

  return (
    <>
      <div className={styles.titleRow}>
        <h1 className={styles.title}>리뷰</h1>
        <span className={styles.subtitle}>저장하면 다음 빌드 때 공개면에 반영 (임시저장 없음)</span>
        {notice && <span className={styles.notice}>{notice}</span>}
      </div>

      <section className={styles.columns}>
        <aside className={styles.list}>
          <button type="button" className={styles.primary} onClick={() => select("new")}>
            + 새 리뷰
          </button>
          <input
            type="search"
            className={styles.input}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="과일명·제목으로 찾기"
            aria-label="리뷰 찾기"
          />
          {shown.map((review) => (
            <button
              key={review.id}
              type="button"
              className={review.id === selection ? styles.rowSelected : styles.row}
              onClick={() => select(review.id)}
            >
              <span className={styles.rowMeta}>
                <span>
                  {shortDate(review.eatenDate)} · {review.fruitName}
                </span>
                <Stars rating={review.rating} />
              </span>
              <span className={styles.rowTitle}>{review.title}</span>
            </button>
          ))}
          <span className={styles.listNote}>
            {reviews.length === 0
              ? "아직 리뷰가 없습니다"
              : shown.length === 0
                ? `“${query}” 리뷰가 없습니다`
                : `${shown.length}개 · 먹은 날 최신순`}
          </span>
        </aside>

        {/* 저장하면 수정 시각이 바뀌어 폼을 새로 만든다 — 저장한 값이 새 기준(되돌리기·저장 안 한 내용 판단)이 된다 */}
        <ReviewForm
          key={current ? `${current.id}-${current.updatedAt}` : "new"}
          review={current}
          varieties={varieties}
          onDirtyChange={setDirty}
          onSaved={onSaved}
          onDeleted={onDeleted}
        />
      </section>
    </>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className={styles.stars} role="img" aria-label={`별점 ${rating}`}>
      {"★".repeat(rating)}
      <span className={styles.starsEmpty}>{"★".repeat(5 - rating)}</span>
    </span>
  );
}
