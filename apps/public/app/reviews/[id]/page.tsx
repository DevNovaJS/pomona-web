import { grams, longDate, monthDayWeekday, type Review, won } from "@pomona/shared";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import styles from "@/components/layout.module.css";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { Stars } from "@/components/Stars";
import ui from "@/components/ui.module.css";
import { api } from "@/lib/api";
import { itemCode, itemPath, varietyName, varietyPath } from "@/lib/paths";
import detail from "./detail.module.css";

// 빌드 때 있는 리뷰만. 새 리뷰는 저장 후 빌드를 돌려야 생긴다
export const dynamicParams = false;

/**
 * 리뷰가 하나도 없을 때 만드는 자리표시 주소. 정적 내보내기는 동적 주소마다 최소 한 장을 만들어야 빌드가 되고,
 * 운영은 처음에 리뷰가 0건이다. 이 주소는 404 내용을 보여주고 검색엔진에 올리지 않는다(Next 가 noindex 를 붙인다).
 */
const EMPTY = "_";

export async function generateStaticParams() {
  const reviews = await api.reviews();
  return reviews.length > 0 ? reviews.map((review) => ({ id: String(review.id) })) : [{ id: EMPTY }];
}

async function findReview(id: string): Promise<Review> {
  if (id === EMPTY) {
    notFound();
  }
  const review = (await api.reviews()).find((candidate) => String(candidate.id) === id);
  if (!review) {
    throw new Error(`리뷰 목록에 없는 주소: ${id}`);
  }
  return review;
}

/**
 * 맨 아래 연결. 품종 페이지가 있으면 품종 페이지, 페이지 없는 소량 품종이면 그 품목 페이지.
 * 품종을 연결하지 않았거나 품목 페이지도 없으면 연결하지 않는다
 */
async function linkOf(review: Review): Promise<{ href: string; label: string } | null> {
  if (review.varietyId === null || review.lclsfCd === null || review.mclsfCd === null) {
    return null;
  }
  const [varieties, items] = await Promise.all([api.varieties(), api.items()]);
  const variety = varieties.find((candidate) => candidate.id === review.varietyId);
  if (variety) {
    return { href: varietyPath(variety), label: `${variety.mclsfNm} · ${varietyName(variety)}` };
  }
  const code = `${review.lclsfCd}-${review.mclsfCd}`;
  const item = items.find((candidate) => itemCode(candidate) === code);
  return item ? { href: itemPath(item), label: item.mclsfNm } : null;
}

export async function generateMetadata({ params }: PageProps<"/reviews/[id]">): Promise<Metadata> {
  const review = await findReview((await params).id);
  return {
    title: `${review.title} — ${review.fruitName} 리뷰 | pomona`,
    description: review.body.slice(0, 120),
  };
}

export default async function ReviewPage({ params }: PageProps<"/reviews/[id]">) {
  const review = await findReview((await params).id);
  const link = await linkOf(review);
  const market = review.marketPrice;
  const paragraphs = review.body.split(/\n+/).filter((line) => line.trim());

  return (
    <>
      <SiteHeader />
      <main className={styles.main}>
        <Link href="/reviews" className={detail.back}>
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15 5 L8 12 L15 19" />
          </svg>
          리뷰 목록
        </Link>

        <section className={styles.hero}>
          <span className={detail.fruit}>{review.fruitName}</span>
          <h1 className={styles.name}>{review.title}</h1>
          <p className={detail.meta}>
            {longDate(review.eatenDate)} 먹음
            <Stars rating={review.rating} size={20} />
          </p>
        </section>

        <section className={detail.columns}>
          <article className={`${ui.card} ${detail.body}`}>
            {paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </article>

          <aside className={detail.aside}>
            <article className={ui.card}>
              <h2 className={detail.cardTitle}>산 정보</h2>
              <dl className={detail.rows}>
                <Pair label="산 곳" value={review.store} />
                <Pair label="산지" value={review.origin ?? "표기 없음"} />
                <Pair label="산 가격" value={`${won(review.price)}원`} />
                <Pair label="무게" value={review.weightGram === null ? "모름" : grams(review.weightGram)} />
              </dl>
              {review.pricePerKg !== null && (
                <div className={detail.perKg}>
                  <span>kg당 산 가격</span>
                  <span>
                    <b>{won(review.pricePerKg)}</b> 원 / kg
                  </span>
                </div>
              )}
            </article>

            {market && (
              <article className={ui.card}>
                <div className={detail.cardHead}>
                  <h2 className={detail.cardTitle}>그날 도매 시세</h2>
                  <span className={detail.when}>{monthDayWeekday(market.date)} 경매</span>
                </div>
                <div className={detail.big}>
                  <b>{won(market.perKg)}</b> 원 / kg · 등급 합산
                </div>
                <p className={ui.muted}>
                  {market.date === review.eatenDate
                    ? "먹은 날 경매 값. 서울 가락시장 기준."
                    : "먹은 날은 경매가 없어 그 전 거래일 값. 서울 가락시장 기준."}
                </p>
                {market.grades.length > 1 && (
                  <dl className={`${detail.rows} ${detail.grades}`}>
                    {market.grades.map((grade) => (
                      <Pair key={grade.grdCd} label={grade.grdNm} value={`${won(grade.perKg)}원`} />
                    ))}
                  </dl>
                )}
              </article>
            )}
          </aside>
        </section>

        {link && (
          <Link href={link.href} className={detail.link}>
            <span>
              <b>{link.label} 가격 · 출하 물량 · 산지 보기</b>
              <small>이 리뷰에 연결한 가락시장 품종</small>
            </span>
            <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 5 L16 12 L9 19" />
            </svg>
          </Link>
        )}
      </main>
      <SiteFooter />
    </>
  );
}

function Pair({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
