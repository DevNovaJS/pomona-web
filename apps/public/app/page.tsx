import { longDate, shortDate, tons, won } from "@pomona/shared";
import type { Metadata } from "next";
import Link from "next/link";
import { FruitSelect } from "@/components/FruitSelect";
import styles from "@/components/layout.module.css";
import { ShowMore } from "@/components/ShowMore";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import ui from "@/components/ui.module.css";
import { ABOVE_USUAL_RATIO } from "@/lib/above-usual";
import { api } from "@/lib/api";
import { importedVarietyIds } from "@/lib/bars";
import { varietyName, varietyPath } from "@/lib/paths";
import { selectOptions } from "@/lib/select";
import home from "./home.module.css";

export const metadata: Metadata = {
  title: "pomona — 요즘 많이 나오는 과일과 도매가",
  description: "서울 가락시장에 요즘 평소보다 많이 들어오는 과일과 품종별 오늘 도매가.",
};

/** 카드를 처음에 펼쳐 두는 수(4열 × 3줄, 모바일 2열 × 6줄) */
const ABOVE_USUAL_SHOWN = 12;
const PRICE_SHOWN = 10;

export default async function HomePage() {
  const [period, items, varieties, latestPrices, weeklyPrices, recentVolumes, volumes] = await Promise.all([
    api.period(),
    api.items(),
    api.varieties(),
    api.latestPrices(),
    api.weeklyPrices(),
    api.recentVolumes(),
    api.volumes(),
  ]);
  // 품종 페이지가 있는 품종만 싣는다. 카드·줄마다 그 페이지로 간다
  const pageVarieties = new Map(varieties.map((variety) => [variety.id, variety]));
  const latestOf = new Map(latestPrices.map((price) => [price.varietyId, price]));
  const recentOf = new Map(recentVolumes.map((volume) => [volume.varietyId, volume]));

  const importedIds = importedVarietyIds(volumes);

  // 오늘 도매가. 마지막 거래일이 기준일이 아니면 그 날짜를 작게 붙인다
  const latestDate = (varietyId: number) => {
    const date = latestOf.get(varietyId)?.date;
    return date && date !== period.baseDate ? <small className={home.date}>{shortDate(date)}</small> : null;
  };
  const latestWon = (varietyId: number) => {
    const latest = latestOf.get(varietyId);
    return latest ? won(latest.perKg) : "—";
  };

  // 최근 14일 물량이 평소의 ABOVE_USUAL_RATIO 배 이상인 품종. 최근 14일 물량 순
  const aboveUsual = recentVolumes
    .filter((volume) => volume.ratio >= ABOVE_USUAL_RATIO && pageVarieties.has(volume.varietyId))
    .sort((a, b) => b.recentQty - a.recentQty);

  // 최근 7일에 거래한 품종. 최근 14일 물량 순
  const weekly = weeklyPrices
    .filter((price) => pageVarieties.has(price.varietyId))
    .sort((a, b) => (recentOf.get(b.varietyId)?.recentQty ?? 0) - (recentOf.get(a.varietyId)?.recentQty ?? 0));

  return (
    <>
      <SiteHeader />
      <main className={styles.main}>
        <section className={`${styles.hero} ${home.hero}`}>
          <div className={home.heroText}>
            <h1 className={styles.name}>요즘 많이 나오는 과일</h1>
            <p className={styles.basis}>서울 가락시장 도매 기준 · {longDate(period.baseDate)}</p>
          </div>
          <Link href={`/calendar/${period.to.slice(5)}`} className={home.calendarLink}>
            월별 과일 캘린더
          </Link>
        </section>

        <section className={home.finder}>
          <h2 className={home.finderTitle}>과일 찾기</h2>
          <FruitSelect {...selectOptions(items, varieties)} />
          <p className={home.finderHint}>품종을 고르면 그 페이지로 · "품목 전체"는 품목 페이지로</p>
        </section>

        <section className={home.aboveUsual}>
          <h2 className={home.aboveUsualTitle}>
            평소보다 많이 나오는 과일{" "}
            <span className={ui.sub}>
              최근 2주 물량이 평소의 {ABOVE_USUAL_RATIO}배 이상인 품종 · 물량 순 · 가격은 오늘 도매가 kg당
            </span>
          </h2>
          {aboveUsual.length === 0 ? (
            <p className={ui.muted}>지금은 평소보다 크게 늘어난 품종이 없습니다.</p>
          ) : (
            <ShowMore
              className={home.cards}
              shown={ABOVE_USUAL_SHOWN}
              moreLabel={`${aboveUsual.length}종 전부 보기`}
              items={aboveUsual.map((volume) => {
                // biome-ignore lint/style/noNonNullAssertion: 위에서 페이지가 있는 품종만 걸렀다
                const variety = pageVarieties.get(volume.varietyId)!;
                return {
                  key: String(volume.varietyId),
                  node: (
                    <Link href={varietyPath(variety)} className={home.card}>
                      <span className={home.cardTop}>
                        <span className={ui.chipFruit}>{variety.mclsfNm}</span>
                        {importedIds.has(variety.id) && <span className={ui.chipImport}>수입</span>}
                        <span className={home.recent}>2주 {tons(volume.recentQty)}</span>
                      </span>
                      <span className={home.cardName}>{varietyName(variety)}</span>
                      <span className={home.cardPrice}>
                        {latestWon(variety.id)}
                        <small>원/kg</small>
                        {latestDate(variety.id)}
                      </span>
                    </Link>
                  ),
                };
              })}
            />
          )}
        </section>

        <section className={ui.card}>
          <h2 className={ui.h2}>
            품종별 도매가 <span className={ui.sub}>최근 7일 거래 {weekly.length}종 · 물량 순</span>
          </h2>
          <div className={home.priceHead}>
            <span>품종</span>
            <span>오늘 도매가 kg당</span>
            <span className={home.weekHead}>이번 주 평균</span>
          </div>
          <ShowMore
            className={home.prices}
            shown={PRICE_SHOWN}
            moreLabel={`${weekly.length - PRICE_SHOWN}종 더 보기`}
            items={weekly.map((price) => {
              // biome-ignore lint/style/noNonNullAssertion: 위에서 페이지가 있는 품종만 걸렀다
              const variety = pageVarieties.get(price.varietyId)!;
              return {
                key: String(price.varietyId),
                node: (
                  <Link href={varietyPath(variety)} className={home.priceRow}>
                    <span className={home.priceName}>
                      <b>{varietyName(variety)}</b>
                      <small>{variety.mclsfNm}</small>
                      {importedIds.has(variety.id) && <span className={ui.chipImport}>수입</span>}
                    </span>
                    <span className={home.today}>
                      {latestDate(variety.id)} {latestWon(variety.id)}원
                    </span>
                    <span className={home.week}>
                      <small>이번 주 평균 </small>
                      {won(price.thisWeekPerKg)}원
                    </span>
                  </Link>
                ),
              };
            })}
          />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
