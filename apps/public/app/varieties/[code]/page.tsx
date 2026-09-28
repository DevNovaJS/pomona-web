import { longDate, monthsBetween, type PageVariety, won } from "@pomona/shared";
import type { Metadata } from "next";
import Link from "next/link";
import styles from "@/components/layout.module.css";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { VolumeAndOrigins } from "@/components/VolumeAndOrigins";
import { api } from "@/lib/api";
import { toBars } from "@/lib/bars";
import { itemCode, itemPath, varietyCode, varietyName } from "@/lib/paths";
import { PriceCards } from "./PriceCards";
import { VarietyReviews } from "./VarietyReviews";

// 빌드 때 만든 품종만 있다. 목록에 없는 주소는 404
export const dynamicParams = false;

export async function generateStaticParams() {
  const varieties = await api.varieties();
  return varieties.map((variety) => ({ code: varietyCode(variety) }));
}

async function findVariety(code: string): Promise<PageVariety> {
  const varieties = await api.varieties();
  const variety = varieties.find((candidate) => varietyCode(candidate) === code);
  if (!variety) {
    throw new Error(`품종 목록에 없는 주소: ${code}`);
  }
  return variety;
}

export async function generateMetadata({ params }: PageProps<"/varieties/[code]">): Promise<Metadata> {
  const variety = await findVariety((await params).code);
  const latest = (await api.latestPrices()).find((price) => price.varietyId === variety.id);
  const name = varietyName(variety);
  return {
    title: `${name} 도매가 · 출하 물량 · 산지 (${variety.mclsfNm}) | pomona`,
    description: latest
      ? `서울 가락시장 ${name} 도매가 kg당 ${won(latest.perKg)}원(${longDate(latest.date)}). 작년 같은 주 대비, 12개월 출하 물량, 주요 산지.`
      : `서울 가락시장 ${name} 12개월 출하 물량과 주요 산지.`,
  };
}

export default async function VarietyPage({ params }: PageProps<"/varieties/[code]">) {
  const variety = await findVariety((await params).code);
  const [period, latestPrices, weeklyPrices, retailPrices, volumes, tradingDays, origins, reviews] = await Promise.all([
    api.period(),
    api.latestPrices(),
    api.weeklyPrices(),
    api.retailPrices(),
    api.volumes(),
    api.tradingDays(),
    api.origins(),
    api.reviews(),
  ]);
  const name = varietyName(variety);
  const bars = toBars(
    monthsBetween(period.from, period.to),
    volumes.filter((volume) => volume.varietyId === variety.id),
  );
  const topOrigins = origins.find((origin) => origin.varietyId === variety.id) ?? { total: [], byMonth: {} };

  return (
    <>
      <SiteHeader current={{ itemCode: itemCode(variety), varietyCode: varietyCode(variety) }} />
      <main className={styles.main}>
        <section className={styles.hero}>
          <Link href={itemPath(variety)} className={styles.crumb}>
            {variety.lclsfNm} · {variety.mclsfNm}
          </Link>
          <h1 className={styles.name}>{name}</h1>
          <p className={styles.basis}>서울 가락시장 도매 기준 · {longDate(period.baseDate)}</p>
        </section>

        <PriceCards
          baseDate={period.baseDate}
          varietyName={name}
          latest={latestPrices.find((price) => price.varietyId === variety.id)}
          weekly={weeklyPrices.find((price) => price.varietyId === variety.id)}
          retail={retailPrices.find((price) => price.varietyId === variety.id)}
        />

        <VolumeAndOrigins
          subtitle="가락시장 · 톤"
          bars={bars}
          partial={{ month: period.to, tradingDays: tradingDays[period.to] ?? 0 }}
          origins={topOrigins}
          chartLabel={`${name} 월별 출하 물량 ${period.from} ~ ${period.to}`}
          after={
            <VarietyReviews reviews={reviews.filter((review) => review.varietyId === variety.id)} varietyName={name} />
          }
        />
      </main>
      <SiteFooter />
    </>
  );
}
