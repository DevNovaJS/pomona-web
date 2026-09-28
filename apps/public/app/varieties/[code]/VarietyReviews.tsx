import { monthDay, type Review, won } from "@pomona/shared";
import Link from "next/link";
import { Stars } from "@/components/Stars";
import ui from "@/components/ui.module.css";
import styles from "./VarietyReviews.module.css";

/** 이 품종에 연결한 리뷰. 최근에 먹은 것 3개 */
export function VarietyReviews({ reviews, varietyName }: { reviews: Review[]; varietyName: string }) {
  return (
    <article className={ui.card}>
      <div className={styles.head}>
        <h2 className={ui.h2}>이 품종 리뷰</h2>
        <Link href="/reviews" className={styles.all}>
          리뷰 전체 보기
        </Link>
      </div>
      {reviews.length === 0 ? (
        <div className={styles.empty}>
          <strong>아직 리뷰 없음</strong>
          <span>직접 사 먹은 {varietyName} 리뷰를 쓰면 여기에 붙습니다.</span>
        </div>
      ) : (
        <div className={styles.list}>
          {reviews.slice(0, 3).map((review) => (
            <Link key={review.id} href={`/reviews/${review.id}`} className={styles.review}>
              <span className={styles.meta}>
                <span className={ui.chipFruit}>{review.fruitName}</span>
                <Stars rating={review.rating} />
                <span className={styles.date}>{monthDay(review.eatenDate)} 먹음</span>
              </span>
              <span className={styles.title}>{review.title}</span>
              <span className={styles.prices}>
                <span>kg당 산 가격 {review.pricePerKg === null ? "—" : `${won(review.pricePerKg)}원`}</span>
                <span>그날 도매 {review.marketPrice ? `${won(review.marketPrice.perKg)}원` : "—"}</span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </article>
  );
}
