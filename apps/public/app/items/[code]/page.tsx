import { type Item, longDate, monthsBetween } from "@pomona/shared";
import type { Metadata } from "next";
import styles from "@/components/layout.module.css";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { api } from "@/lib/api";
import { barsTotal, toBars } from "@/lib/bars";
import { itemCode, varietyCode, varietyName } from "@/lib/paths";
import { ItemVolumes, type VarietyRow } from "./ItemVolumes";

// 빌드 때 만든 품목만 있다. 목록에 없는 주소는 404
export const dynamicParams = false;

export async function generateStaticParams() {
  const items = await api.items();
  return items.map((item) => ({ code: itemCode(item) }));
}

async function findItem(code: string): Promise<Item> {
  const items = await api.items();
  const item = items.find((candidate) => itemCode(candidate) === code);
  if (!item) {
    throw new Error(`품목 목록에 없는 주소: ${code}`);
  }
  return item;
}

export async function generateMetadata({ params }: PageProps<"/items/[code]">): Promise<Metadata> {
  const item = await findItem((await params).code);
  const varieties = (await api.varieties()).filter((variety) => itemCode(variety) === itemCode(item));
  return {
    title: `${item.mclsfNm} 가격 · 품종별 도매가 · 출하 물량 | pomona`,
    description:
      varieties.length > 0
        ? `서울 가락시장 ${item.mclsfNm} 품종 ${varieties.length}종(${varieties
            .slice(0, 3)
            .map(varietyName)
            .join(", ")} 등)의 도매가, 12개월 출하 물량, 주요 산지.`
        : `서울 가락시장 ${item.mclsfNm} 12개월 출하 물량과 주요 산지.`,
  };
}

export default async function ItemPage({ params }: PageProps<"/items/[code]">) {
  const item = await findItem((await params).code);
  const code = itemCode(item);
  const [period, varieties, latestPrices, volumes, itemVolumes, tradingDays, itemOrigins] = await Promise.all([
    api.period(),
    api.varieties(),
    api.latestPrices(),
    api.volumes(),
    api.itemVolumes(),
    api.tradingDays(),
    api.itemOrigins(),
  ]);
  const months = monthsBetween(period.from, period.to);
  const itemBars = toBars(
    months,
    itemVolumes.filter((volume) => itemCode(volume) === code),
  );
  const itemTotal = barsTotal(itemBars);

  // 서버가 품목 안에서 물량 순으로 준다
  const rows: VarietyRow[] = varieties
    .filter((variety) => itemCode(variety) === code)
    .map((variety) => {
      const bars = toBars(
        months,
        volumes.filter((volume) => volume.varietyId === variety.id),
      );
      const latest = latestPrices.find((price) => price.varietyId === variety.id);
      return {
        code: varietyCode(variety),
        name: varietyName(variety),
        bars,
        total: barsTotal(bars),
        imported: bars.reduce((sum, bar) => sum + bar.imported, 0) > bars.reduce((sum, bar) => sum + bar.domestic, 0),
        latestPerKg: latest?.perKg ?? null,
        latestDate: latest && latest.date !== period.baseDate ? latest.date : null,
      };
    });
  // 기타·소량 품종은 페이지가 없어 목록에 없지만 품목 합계에는 들어 있다
  const otherTotal = itemTotal - rows.reduce((sum, row) => sum + row.total, 0);

  return (
    <>
      <SiteHeader current={{ itemCode: code }} />
      <main className={styles.main}>
        <section className={styles.hero}>
          <span className={styles.crumb}>{item.lclsfNm}</span>
          <h1 className={styles.name}>{item.mclsfNm}</h1>
          <p className={styles.basis}>
            서울 가락시장 도매 기준 · {longDate(period.baseDate)} · 품종 {rows.length}종
          </p>
        </section>

        <ItemVolumes
          itemName={item.mclsfNm}
          itemBars={itemBars}
          itemTotal={itemTotal}
          rows={rows}
          otherTotal={otherTotal}
          partial={{ month: period.to, tradingDays: tradingDays[period.to] ?? 0 }}
          origins={itemOrigins.find((origin) => itemCode(origin) === code) ?? { total: [], byMonth: {} }}
          chartLabel={`${item.mclsfNm} 월별 출하 물량 ${period.from} ~ ${period.to}, 국산과 수입`}
        />
      </main>
      <SiteFooter />
    </>
  );
}
