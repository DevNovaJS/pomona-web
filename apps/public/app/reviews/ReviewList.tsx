"use client";

import { grams, monthDay, monthDayWeekday, type Review, won } from "@pomona/shared";
import Link from "next/link";
import { useState } from "react";
import { Stars } from "@/components/Stars";
import ui from "@/components/ui.module.css";
import styles from "./reviews.module.css";

/** 띄어쓰기·대소문자를 무시하고 찾는다. "샤인 머스캣" 으로도 "샤인머스캣" 이 나온다 */
function normalize(text: string): string {
  return text.replace(/\s+/g, "").toLowerCase();
}

/** 적은 과일 이름, 연결한 품목·품종 이름, 제목에서 찾는다. "포도"로 찾으면 "샤인머스캣" 리뷰도 나온다 */
function matches(review: Review, query: string): boolean {
  const target = normalize([review.fruitName, review.itemName, review.varietyName, review.title].join(" "));
  return target.includes(normalize(query));
}

export function ReviewList({ reviews }: { reviews: Review[] }) {
  const [query, setQuery] = useState("");
  const shown = query.trim() ? reviews.filter((review) => matches(review, query)) : reviews;

  return (
    <>
      <section className={styles.search}>
        <label className={styles.searchBox}>
          <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="6.5" />
            <path d="M16 16 L20.5 20.5" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="과일 이름으로 찾기"
            aria-label="과일 이름으로 리뷰 찾기"
          />
        </label>
        <span className={styles.count}>
          리뷰 <b>{shown.length}</b>개 · 먹은 날 최신순
        </span>
      </section>

      {reviews.length === 0 ? (
        <p className={styles.empty}>아직 리뷰가 없습니다.</p>
      ) : shown.length === 0 ? (
        <p className={styles.empty}>“{query}” 리뷰가 없습니다.</p>
      ) : (
        <section className={styles.cards}>
          {shown.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </section>
      )}
    </>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const market = review.marketPrice;
  return (
    <Link href={`/reviews/${review.id}`} className={`${ui.card} ${styles.card}`}>
      <span className={styles.top}>
        <span className={ui.chipFruit}>{review.fruitName}</span>
        <span className={styles.date}>{monthDayWeekday(review.eatenDate)} 먹음</span>
      </span>
      <span className={styles.heading}>
        <span className={styles.title}>{review.title}</span>
        <Stars rating={review.rating} size={18} />
      </span>
      <span className={styles.body}>{review.body}</span>
      <span className={styles.facts}>
        <Fact label="산 곳 · 산지" lines={[review.store, review.origin ?? "산지 표기 없음"]} />
        <Fact
          label="산 가격"
          lines={[`${won(review.price)}원`, review.weightGram === null ? "무게 모름" : grams(review.weightGram)]}
        />
        <Fact label="kg당" lines={[review.pricePerKg === null ? "—" : `${won(review.pricePerKg)}원`]} />
        <Fact
          label={market ? `그날 도매 (${monthDay(market.date)})` : "그날 도매"}
          lines={[market ? `${won(market.perKg)}원 / kg` : "없음"]}
        />
      </span>
    </Link>
  );
}

function Fact({ label, lines }: { label: string; lines: string[] }) {
  return (
    <span className={styles.fact}>
      <small>{label}</small>
      {lines.map((line) => (
        <span key={line}>{line}</span>
      ))}
    </span>
  );
}
