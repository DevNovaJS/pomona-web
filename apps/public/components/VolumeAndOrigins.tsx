"use client";

import {
  isImportOrigin,
  monthNumber,
  type OriginVolume,
  originName,
  percent,
  type TopOrigins,
  tons,
  type YearMonth,
} from "@pomona/shared";
import { type ReactNode, useState } from "react";
import { type MonthBar, MonthlyBars, type PartialMonth } from "./MonthlyBars";
import ui from "./ui.module.css";
import styles from "./VolumeAndOrigins.module.css";

/**
 * 12개월 출하 물량 막대와 주요 산지. 막대에서 달을 누르면 산지가 그 달 상위 5곳으로 바뀌고,
 * 같은 달을 다시 누르면 12개월로 돌아온다. 산지 카드 앞뒤 칸(품목 페이지의 품종 목록, 품종 페이지의 리뷰)은
 * [before]·[after] 로 받는다.
 */
export function VolumeAndOrigins({
  subtitle,
  bars,
  originBars = bars,
  partial,
  origins,
  chartLabel,
  originsScope,
  before,
  after,
  wideFirst,
  hint = "막대를 누르면 주요 산지가 그 달 기준으로 바뀝니다. 다시 누르면 최근 12개월로.",
}: {
  subtitle: string;
  bars: MonthBar[];
  /** 산지 비중의 분모가 되는 물량. 막대와 산지의 범위가 다를 때만 준다(품목 페이지에서 품종을 골랐을 때 품목 전체) */
  originBars?: MonthBar[];
  partial?: PartialMonth;
  origins: Pick<TopOrigins, "total" | "byMonth">;
  chartLabel: string;
  /** 막대와 산지의 범위가 다를 때 산지 제목에 붙인다(품목 페이지에서 품종을 골랐을 때 "포도 전체") */
  originsScope?: string;
  before?: ReactNode;
  after?: ReactNode;
  /** 넓은 화면에서 앞 칸을 더 넓게 */
  wideFirst?: boolean;
  /** 차트 아래 사용법 한 줄 */
  hint?: string;
}) {
  const [selected, setSelected] = useState<YearMonth | null>(null);
  const [hovered, setHovered] = useState<YearMonth | null>(null);
  const hasDomestic = bars.some((bar) => bar.domestic > 0);
  const hasImport = bars.some((bar) => bar.imported > 0);
  const periodTotal = bars.reduce((sum, bar) => sum + bar.domestic + bar.imported, 0);
  const shown = hovered ?? selected;
  const shownBar = bars.find((bar) => bar.month === shown);

  const originList = selected ? (origins.byMonth[selected] ?? []) : origins.total;
  const originBar = originBars.find((bar) => bar.month === selected);
  const originTotal = originBar
    ? originBar.domestic + originBar.imported
    : originBars.reduce((sum, bar) => sum + bar.domestic + bar.imported, 0);

  return (
    <>
      <section className={ui.card}>
        <div className={styles.head}>
          <h2 className={ui.h2}>
            12개월 출하 물량 <span className={ui.sub}>{subtitle}</span>
          </h2>
          <div className={ui.legend}>
            {hasDomestic && (
              <span>
                <i style={{ background: "var(--domestic)" }} />
                국산
              </span>
            )}
            {hasImport && (
              <span>
                <i style={{ background: "var(--import)" }} />
                수입
              </span>
            )}
          </div>
        </div>
        <div className={styles.readout} aria-live="polite">
          {shownBar ? <MonthReadout bar={shownBar} partial={partial} /> : <TotalReadout total={periodTotal} />}
        </div>
        <MonthlyBars
          bars={bars}
          partial={partial}
          selected={selected}
          onSelect={(month) => setSelected(month === selected ? null : month)}
          onHover={setHovered}
          label={chartLabel}
        />
        <p className={styles.hint}>{hint}</p>
      </section>

      <div className={wideFirst ? styles.pairWideFirst : styles.pair}>
        {before}
        <article className={ui.card}>
          <div className={styles.head}>
            <h2 className={ui.h2}>
              주요 산지{" "}
              <span className={ui.sub}>
                {originsScope && `${originsScope} · `}
                {selected ? `${monthNumber(selected)}월` : "최근 12개월"}
              </span>
            </h2>
            {selected && (
              <button type="button" className={styles.reset} onClick={() => setSelected(null)}>
                12개월 보기
              </button>
            )}
          </div>
          <OriginRows origins={originList} total={originTotal} />
        </article>
        {after}
      </div>
    </>
  );
}

function TotalReadout({ total }: { total: number }) {
  return (
    <>
      <span className={styles.readoutLabel}>최근 12개월 합계</span>
      <b>{tons(total)}</b>
    </>
  );
}

function MonthReadout({ bar, partial }: { bar: MonthBar; partial?: PartialMonth }) {
  const days = partial?.month === bar.month ? ` · 거래 ${partial.tradingDays}일, 진행 중` : "";
  const both = bar.domestic > 0 && bar.imported > 0;
  return (
    <>
      <span className={styles.readoutLabel}>
        {monthNumber(bar.month)}월{days}
      </span>
      <span>
        {both && (
          <span className={styles.split}>
            국산 {tons(bar.domestic)} · 수입 {tons(bar.imported)} ·{" "}
          </span>
        )}
        <b>{tons(bar.domestic + bar.imported)}</b>
      </span>
    </>
  );
}

function OriginRows({ origins, total }: { origins: OriginVolume[]; total: number }) {
  if (origins.length === 0) {
    return <p className={ui.muted}>이 달은 거래 없음</p>;
  }
  const top = origins[0].qty;
  const rest = 1 - origins.reduce((sum, origin) => sum + origin.qty, 0) / total;
  return (
    <div className={styles.origins}>
      {origins.map((origin) => (
        <div key={origin.plorCd} className={styles.origin}>
          <span className={styles.originName}>{originName(origin.plorNm)}</span>
          <span className={styles.track}>
            <span
              className={isImportOrigin(origin.plorCd) ? styles.barImport : styles.barDomestic}
              style={{ width: `${(origin.qty / top) * 100}%` }}
            />
          </span>
          <span className={styles.originValue}>
            {percent(origin.qty / total)} · {tons(origin.qty)}
          </span>
        </div>
      ))}
      {rest >= 0.0005 && <p className={`${ui.muted} ${styles.rest}`}>그 외 산지 {percent(rest)}</p>}
    </div>
  );
}
