import type { Metadata } from "next";
import styles from "@/components/layout.module.css";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { api } from "@/lib/api";
import { ReviewList } from "./ReviewList";

export const metadata: Metadata = {
  title: "먹어 본 과일 — 직접 사 먹은 과일 리뷰 | pomona",
  description: "직접 사 먹은 과일 리뷰. 산 곳·산 가격과 그날 서울 가락시장 도매가를 같이 적었습니다.",
};

/** 리뷰 전부를 한 페이지에 넣고 브라우저에서 과일 이름으로 거른다. 백엔드가 먹은 날 최신순으로 준다 */
export default async function ReviewsPage() {
  const reviews = await api.reviews();
  return (
    <>
      <SiteHeader />
      <main className={styles.main}>
        <section className={styles.hero}>
          <h1 className={styles.name}>먹어 본 과일</h1>
          <p className={styles.basis}>직접 사 먹은 과일 리뷰 · 산 가격과 그날 가락시장 도매가를 같이 적음</p>
        </section>
        <ReviewList reviews={reviews} />
      </main>
      <SiteFooter />
    </>
  );
}
