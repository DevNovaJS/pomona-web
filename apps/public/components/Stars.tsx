import styles from "./Stars.module.css";

const STAR = "M12 2.8l2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3L2.9 9.5l6.3-.9z";

/** 별점 1~5 */
export function Stars({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <span className={styles.stars} role="img" aria-label={`별점 ${rating}점 (5점 만점)`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <svg key={star} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
          <path d={STAR} className={star <= rating ? styles.on : styles.off} />
        </svg>
      ))}
    </span>
  );
}
