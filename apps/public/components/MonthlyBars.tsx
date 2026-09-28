"use client";

import { monthNumber, type YearMonth } from "@pomona/shared";
import { useLayoutEffect, useRef, useState } from "react";
import styles from "./MonthlyBars.module.css";

export interface MonthBar {
  month: YearMonth;
  /** kg */
  domestic: number;
  /** kg */
  imported: number;
}

/** 거래일이 덜 찬 이번 달. 막대 아래에 거래일 수를 적는다 */
export interface PartialMonth {
  month: YearMonth;
  tradingDays: number;
}

/** 이 폭보다 좁으면 막대 위 숫자를 빼고 달 이름을 숫자만 쓴다 */
const NARROW = 600;
const BAR_MAX_WIDTH = 44;
const RADIUS = 4;
/** 쌓은 막대의 국산·수입 사이 틈 */
const GAP = 2;

/**
 * 12개월 출하 물량 막대. 국산(아래)·수입(위)을 쌓는다.
 *
 * 글자 크기가 화면 폭에 따라 늘거나 줄지 않게, 그릴 칸의 실제 폭을 재서 그 폭으로 SVG 를 다시 그린다.
 * 빌드한 HTML 에는 기본 폭(데스크톱)으로 그려 두고, 브라우저에서 폭을 재면 바로 맞춘다.
 */
export function MonthlyBars({
  bars,
  partial,
  selected,
  onSelect,
  onHover,
  label,
}: {
  bars: MonthBar[];
  partial?: PartialMonth;
  selected: YearMonth | null;
  onSelect: (month: YearMonth) => void;
  onHover: (month: YearMonth | null) => void;
  label: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(1080);

  // 화면에 그리기 전에 한 번 재서 데스크톱 폭으로 그렸다가 바뀌는 깜빡임을 줄이고, 이후 폭 변화는 observer 로 따라간다
  useLayoutEffect(() => {
    const element = box.current;
    if (!element) {
      return;
    }
    setWidth(Math.round(element.getBoundingClientRect().width));
    const observer = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const narrow = width < NARROW;
  const height = narrow ? 216 : 300;
  const top = narrow ? 14 : 28;
  const base = height - (narrow ? 44 : 48);
  // 왼쪽은 눈금 글자 자리로 비운다
  const left = narrow ? 40 : 48;
  const slot = (width - left) / bars.length;
  const barWidth = Math.min(BAR_MAX_WIDTH, slot * 0.55);
  const totals = bars.map((bar) => bar.domestic + bar.imported);
  const max = Math.max(...totals);
  const scale = (base - top) / max;
  const ticks = tonTicks(max / 1000);

  return (
    <div ref={box} className={styles.box}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className={narrow ? styles.narrow : undefined}
        role="img"
        aria-label={label}
      >
        {ticks.map((tick) => {
          const y = base - tick * 1000 * scale;
          return (
            <g key={tick}>
              <line x1={left} x2={width} y1={y} y2={y} className={styles.grid} />
              <text x={left - 6} y={y + 4} className={styles.tick}>
                {tick.toLocaleString("ko-KR")}t
              </text>
            </g>
          );
        })}
        <line x1={left} x2={width} y1={base} y2={base} className={styles.axis} />

        {bars.map((bar, index) => {
          const center = left + slot * index + slot / 2;
          const x = center - barWidth / 2;
          const total = totals[index];
          const dimmed = selected !== null && selected !== bar.month;
          const isPartial = partial?.month === bar.month;
          const month = monthNumber(bar.month);
          const yearLabel = index === 0 || month === 1 ? bar.month.slice(0, 4) : null;
          return (
            <g key={bar.month} className={dimmed ? styles.dimmed : undefined}>
              {total === 0 ? (
                <circle cx={center} cy={base} r={2.5} className={styles.empty} />
              ) : (
                stack(bar, x, base, barWidth, scale)
              )}
              {!narrow && total >= max * 0.1 && total >= 500 && (
                <text x={center} y={base - total * scale - 8} className={styles.value}>
                  {Math.round(total / 1000).toLocaleString("ko-KR")}
                </text>
              )}
              <text x={center} y={base + 18} className={isPartial ? styles.monthCurrent : styles.month}>
                {narrow ? month : `${month}월`}
              </text>
              {isPartial ? (
                // 이번 달은 보통 맨 끝 칸이라 글자가 오른쪽 밖으로 나가지 않게 끝을 칸 오른쪽에 맞춘다
                <text
                  x={index === bars.length - 1 ? width : center}
                  y={base + 36}
                  className={styles.partial}
                  textAnchor={index === bars.length - 1 ? "end" : "middle"}
                >
                  {narrow ? `${partial.tradingDays}일` : `거래 ${partial.tradingDays}일 · 진행 중`}
                </text>
              ) : (
                yearLabel && (
                  <text x={center} y={base + 36} className={styles.year}>
                    {yearLabel}
                  </text>
                )
              )}
              {total > 0 && (
                // biome-ignore lint/a11y/useSemanticElements: SVG 안이라 button 요소를 쓸 수 없다
                <rect
                  x={left + slot * index}
                  y={0}
                  width={slot}
                  height={base + 24}
                  className={styles.hit}
                  role="button"
                  tabIndex={0}
                  aria-pressed={selected === bar.month}
                  aria-label={`${month}월 ${Math.round(total / 1000).toLocaleString("ko-KR")}톤`}
                  onClick={() => onSelect(bar.month)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onSelect(bar.month);
                    }
                  }}
                  onMouseEnter={() => onHover(bar.month)}
                  onMouseLeave={() => onHover(null)}
                  onFocus={() => onHover(bar.month)}
                  onBlur={() => onHover(null)}
                />
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/** 국산을 아래, 수입을 위에 쌓는다. 맨 위 조각만 모서리를 둥글린다 */
function stack(bar: MonthBar, x: number, base: number, width: number, scale: number) {
  const segments = [
    { qty: bar.domestic, className: styles.domestic },
    { qty: bar.imported, className: styles.imported },
  ].filter((segment) => segment.qty > 0);
  let bottom = base;
  return segments.map((segment, index) => {
    const gap = index > 0 ? GAP : 0;
    const height = Math.max(2, segment.qty * scale);
    const top = bottom - height;
    const lower = bottom - gap;
    bottom = top;
    const isTop = index === segments.length - 1;
    const radius = isTop ? Math.min(RADIUS, (lower - top) / 2) : 0;
    const path =
      `M${x},${lower} V${top + radius} Q${x},${top} ${x + radius},${top} ` +
      `H${x + width - radius} Q${x + width},${top} ${x + width},${top + radius} V${lower} Z`;
    return <path key={segment.className} d={path} className={segment.className} />;
  });
}

/** 톤 단위 눈금. 1·2·5 × 10ⁿ 간격으로 최댓값 아래에 서너 개 */
function tonTicks(maxTons: number): number[] {
  const rough = maxTons / 4;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const step = ([1, 2, 5, 10].find((multiple) => multiple * magnitude >= rough) ?? 10) * magnitude;
  const ticks: number[] = [];
  for (let tick = step; tick <= maxTons; tick += step) {
    ticks.push(Number(tick.toPrecision(6)));
  }
  return ticks;
}
