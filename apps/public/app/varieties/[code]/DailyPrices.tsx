"use client";

import { addDays, type DailyPrice, type IsoDate, monthDayWeekday, shortDate, won } from "@pomona/shared";
import { useLayoutEffect, useRef, useState } from "react";
import ui from "@/components/ui.module.css";
import styles from "./DailyPrices.module.css";

/** 기준일 포함 며칠을 그리나. 백엔드 /prices/daily 와 같은 기간 */
const DAYS = 30;
/** 이 폭보다 좁으면 글자를 줄인다 */
const NARROW = 600;

/**
 * 최근 30일 도매가 꺾은선. 가로축은 거래일이 아니라 달력 30일이라 거래가 띄엄띄엄인 품종은 점 사이가 벌어진다.
 * 거래 없는 날은 점 없이 앞뒤 거래일을 잇는다. 점을 누르면 위 칸에 그날 가격·물량을 보여주고, 처음엔 마지막 거래일.
 *
 * 폭은 MonthlyBars 와 같이 그릴 칸을 재서 맞춘다.
 */
export function DailyPrices({ baseDate, prices, label }: { baseDate: IsoDate; prices: DailyPrice[]; label: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(1080);
  const [selected, setSelected] = useState(prices.length - 1);

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

  const first = addDays(baseDate, -(DAYS - 1));
  const narrow = width < NARROW;
  const height = narrow ? 200 : 240;
  const top = 16;
  const base = height - 32;
  // 왼쪽은 눈금 글자 자리로 비운다
  const left = narrow ? 44 : 52;
  const slot = (width - left) / DAYS;
  const ticks = wonTicks(prices.map((price) => price.perKg));
  const low = ticks[0];
  const high = ticks[ticks.length - 1];
  const yOf = (perKg: number) => base - ((perKg - low) / (high - low)) * (base - top);
  const xOf = (date: IsoDate) => left + slot * dayIndex(first, date) + slot / 2;
  const points = prices.map((price) => ({ price, x: xOf(price.date), y: yOf(price.perKg) }));
  const shown = prices[selected];

  return (
    <section className={ui.card}>
      <div className={styles.head}>
        <h2 className={ui.h2}>
          최근 30일 도매가 <span className={ui.sub}>가락시장 · 등급 합산 kg당</span>
        </h2>
        <span className={styles.when}>
          {shortDate(first)} ~ {shortDate(baseDate)} · 거래 {prices.length}일
        </span>
      </div>

      <p className={styles.readout} aria-live="polite">
        <span className={styles.readoutDate}>{monthDayWeekday(shown.date)}</span>
        <span>
          <b>{won(shown.perKg)}</b> 원 / kg
        </span>
        <span>물량 {weight(shown.qty)}</span>
      </p>

      <div ref={box} className={styles.box}>
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className={narrow ? styles.narrow : undefined}
          role="img"
          aria-label={label}
        >
          {ticks.map((tick) => (
            <g key={tick}>
              <line x1={left} x2={width} y1={yOf(tick)} y2={yOf(tick)} className={styles.grid} />
              <text x={left - 6} y={yOf(tick) + 4} className={styles.tick}>
                {won(tick)}
              </text>
            </g>
          ))}

          {/* 날짜 눈금은 기준일에서 7일씩 거슬러 */}
          {Array.from({ length: DAYS }, (_, index) => index)
            .filter((index) => (DAYS - 1 - index) % 7 === 0)
            .map((index) => {
              const date = addDays(first, index);
              // 기준일은 맨 끝 칸이라 글자가 오른쪽 밖으로 나가지 않게 끝을 그림 오른쪽에 맞춘다
              const last = index === DAYS - 1;
              return (
                <text
                  key={date}
                  x={last ? width : left + slot * index + slot / 2}
                  y={base + 22}
                  className={styles.day}
                  textAnchor={last ? "end" : "middle"}
                >
                  {shortDate(date)}
                </text>
              );
            })}

          {points.length > 1 && (
            <polyline points={points.map((point) => `${point.x},${point.y}`).join(" ")} className={styles.line} />
          )}

          {points.map((point, index) => (
            <circle
              key={point.price.date}
              cx={point.x}
              cy={point.y}
              r={index === selected ? 6 : 4}
              className={index === selected ? styles.dotSelected : styles.dot}
            />
          ))}

          {points.map((point, index) => (
            // biome-ignore lint/a11y/useSemanticElements: SVG 안이라 button 요소를 쓸 수 없다
            <rect
              key={point.price.date}
              x={point.x - slot / 2}
              y={0}
              width={slot}
              height={base}
              className={styles.hit}
              role="button"
              tabIndex={0}
              aria-pressed={index === selected}
              aria-label={`${monthDayWeekday(point.price.date)} ${won(point.price.perKg)}원`}
              onClick={() => setSelected(index)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setSelected(index);
                }
              }}
            />
          ))}
        </svg>
      </div>
      <p className={ui.muted}>점을 누르면 그날 가격과 물량. 이 품종의 거래가 없는 날은 점 없이 앞뒤를 잇습니다.</p>
    </section>
  );
}

/** [first] 에서 며칠째인가 */
function dayIndex(first: IsoDate, date: IsoDate): number {
  return Math.round((Date.parse(date) - Date.parse(first)) / 86_400_000);
}

/** 원 단위 눈금. 1·2·5 × 10ⁿ 간격으로 최저가 아래 ~ 최고가 위를 덮는다. 하루뿐이거나 값이 같으면 위아래로 한 칸씩 */
function wonTicks(values: number[]): number[] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const rough = (max - min) / 4 || max / 4 || 1;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const step = ([1, 2, 5, 10].find((multiple) => multiple * magnitude >= rough) ?? 10) * magnitude;
  let low = Math.floor(min / step) * step;
  let high = Math.ceil(max / step) * step;
  if (low === high) {
    low -= step;
    high += step;
  }
  const ticks: number[] = [];
  for (let tick = Math.max(0, low); tick <= high; tick += step) {
    ticks.push(Number(tick.toPrecision(6)));
  }
  return ticks;
}

/** 하루 물량. 1톤부터 톤, 소수 1자리 */
function weight(kg: number): string {
  return kg >= 1000 ? `${(kg / 1000).toFixed(1)}t` : `${won(kg)}kg`;
}
