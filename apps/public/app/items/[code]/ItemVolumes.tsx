"use client";

import { type ItemTopOrigins, percent, shortDate, tons, won } from "@pomona/shared";
import Link from "next/link";
import { useState } from "react";
import type { MonthBar, PartialMonth } from "@/components/MonthlyBars";
import ui from "@/components/ui.module.css";
import { VolumeAndOrigins } from "@/components/VolumeAndOrigins";
import styles from "./ItemVolumes.module.css";

export interface VarietyRow {
  code: string;
  name: string;
  bars: MonthBar[];
  /** 12개월 물량 kg */
  total: number;
  /** 수입 물량이 국산보다 많은 품종 */
  imported: boolean;
  latestPerKg: number | null;
  /** 마지막 거래일이 기준일이 아니면 그 날짜 */
  latestDate: string | null;
}

/** 처음에 펼쳐 두는 품종 수. 나머지는 "더 보기"로 편다(HTML 에는 다 들어 있다) */
const SHOWN = 8;

/**
 * 품목 페이지의 12개월 막대 · 품종 목록 · 주요 산지. 품종을 고르면 막대가 그 품종으로 바뀐다.
 * 산지는 품목 전체 그대로 둔다.
 */
export function ItemVolumes({
  itemName,
  itemBars,
  itemTotal,
  rows,
  otherTotal,
  partial,
  origins,
  chartLabel,
}: {
  itemName: string;
  itemBars: MonthBar[];
  itemTotal: number;
  rows: VarietyRow[];
  otherTotal: number;
  partial: PartialMonth;
  origins: Pick<ItemTopOrigins, "total" | "byMonth">;
  chartLabel: string;
}) {
  const [selected, setSelected] = useState<VarietyRow | null>(null);
  const [expanded, setExpanded] = useState(false);
  const top = rows[0]?.total ?? 0;

  const list = (
    <article className={ui.card}>
      <div className={styles.head}>
        <h2 className={ui.h2}>
          품종 <span className={ui.sub}>12개월 물량 순</span>
        </h2>
        <span className={styles.priceHead}>최근 도매가 kg당</span>
      </div>
      {rows.length === 0 ? (
        <p className={ui.muted}>품종 페이지가 있는 품종이 없습니다. 거래가 적은 품종만 들어오는 품목입니다.</p>
      ) : (
        <ul className={styles.rows}>
          {rows.map((row, index) => (
            <li
              key={row.code}
              className={[
                styles.row,
                selected?.code === row.code ? styles.selected : "",
                !expanded && index >= SHOWN ? styles.folded : "",
              ].join(" ")}
            >
              <button
                type="button"
                className={styles.pick}
                aria-pressed={selected?.code === row.code}
                onClick={() => setSelected(selected?.code === row.code ? null : row)}
              >
                <span className={styles.name}>
                  {row.name}
                  {row.imported && <span className={ui.chipImport}>수입</span>}
                </span>
                <span className={styles.volume}>
                  <span className={styles.track}>
                    <span
                      className={row.imported ? styles.barImport : styles.barDomestic}
                      style={{ width: `${(row.total / top) * 100}%` }}
                    />
                  </span>
                  <span className={styles.qty}>
                    {tons(row.total)} · {percent(row.total / itemTotal)}
                  </span>
                </span>
                <span className={styles.price}>
                  {row.latestPerKg === null ? "—" : `${won(row.latestPerKg)}원`}
                  {row.latestDate && <span className={styles.date}> · {shortDate(row.latestDate)}</span>}
                </span>
              </button>
              <Link href={`/varieties/${row.code}`} className={styles.go} aria-label={`${row.name} 페이지`}>
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M9 5 L16 12 L9 19" />
                </svg>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {!expanded && rows.length > SHOWN && (
        <button type="button" className={styles.more} onClick={() => setExpanded(true)}>
          나머지 {rows.length - SHOWN}종 더 보기
        </button>
      )}
      {otherTotal >= 500 && (
        <p className={ui.muted}>
          그 외 페이지 없는 품종 {tons(otherTotal)} ({percent(otherTotal / itemTotal)})
        </p>
      )}
    </article>
  );

  return (
    <VolumeAndOrigins
      subtitle={selected ? `${selected.name} · 가락시장 · 톤` : "품종 전체 · 가락시장 · 톤"}
      bars={selected ? selected.bars : itemBars}
      originBars={itemBars}
      partial={partial}
      origins={origins}
      originsScope={selected ? `${itemName} 전체` : undefined}
      chartLabel={selected ? `${selected.name} 월별 출하 물량` : chartLabel}
      before={list}
      wideFirst
      hint={
        rows.length > 0
          ? "품종을 누르면 막대가 그 품종으로 바뀌고, 오른쪽 화살표는 품종 페이지로 갑니다. 막대를 누르면 주요 산지가 그 달 기준으로 바뀝니다."
          : undefined
      }
    />
  );
}
