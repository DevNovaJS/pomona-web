import { type Item, monthNumber, monthsBetween, type YearMonth } from "@pomona/shared";
import type { Metadata } from "next";
import Link from "next/link";
import styles from "@/components/layout.module.css";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import ui from "@/components/ui.module.css";
import { api } from "@/lib/api";
import { itemCode, itemPath } from "@/lib/paths";
import calendar from "./calendar.module.css";

// 달마다 한 장. 주소는 두 자리 달(/calendar/09)
export const dynamicParams = false;

const MONTHS = Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, "0"));
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
/** 크게 보여줄 위쪽 품목 수. 나머지는 아래 표로 */
const TOP = 10;

/** 칸의 진하기 단계. 0 = 거래 없음, 1~5 = 그 품목이 최근 12개월 중 가장 많이 나온 날에 견준 몫 */
const LEVELS = ["거래 없음", "아주 적음", "적음", "보통", "많음", "아주 많음"];

export function generateStaticParams() {
  return MONTHS.map((month) => ({ month }));
}

interface Day {
  date: string;
  day: number;
  weekday: number;
  /** 시장이 그날 거래했는지. 일요일·공휴일·아직 오지 않은 날은 false */
  traded: boolean;
}

interface Row {
  item: Item;
  levels: number[];
  total: number;
  /** 그 달 거래일 칸들의 평균 진하기. 줄 순서를 정한다 */
  shade: number;
}

/** 좁은 화면에서 숫자를 남기는 날. 30일은 맨 끝이라 칸 밖으로 나가서 뺀다 */
function majorDay(day: Day): boolean {
  return day.day === 1 || (day.day % 5 === 0 && day.day <= 25);
}

/** 주소의 달("09")을 최근 12개월 안의 실제 달("2026-09")로 */
async function periodMonth(month: string): Promise<YearMonth> {
  const period = await api.period();
  const found = monthsBetween(period.from, period.to).find((candidate) => candidate.endsWith(`-${month}`));
  if (!found) {
    throw new Error(`최근 12개월에 없는 달: ${month}`);
  }
  return found;
}

/**
 * 그 달 품목 × 1~말일 표. 칸 = 그날 물량을 그 품목이 최근 12개월 중 가장 많이 나온 날과 견줘 5단계로.
 * 그 달에 거래가 있었던 품목만, 칸이 진한 순(거래일 칸들의 평균 진하기, 같으면 물량 순).
 * 물량(kg) 순으로 세우면 무거운 과일이 앞에 오는데 칸은 옅어 순위와 색이 어긋난다(9월 수박: 물량 8위, 1년의 2.6%).
 */
async function calendarOf(month: YearMonth): Promise<{ days: Day[]; rows: Row[] }> {
  const [items, daily] = await Promise.all([api.items(), api.itemDailyVolumes()]);
  const [year, monthIndex] = month.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, monthIndex, 0)).getUTCDate();
  const tradedDates = new Set(daily.map((volume) => volume.date));
  const days: Day[] = Array.from({ length: lastDay }, (_, index) => {
    const date = `${month}-${String(index + 1).padStart(2, "0")}`;
    return {
      date,
      day: index + 1,
      weekday: new Date(Date.UTC(year, monthIndex - 1, index + 1)).getUTCDay(),
      traded: tradedDates.has(date),
    };
  });

  const tradingDays = days.filter((day) => day.traded).length;
  const rows = items
    .map((item) => {
      const code = itemCode(item);
      const own = daily.filter((volume) => itemCode(volume) === code);
      const peak = Math.max(0, ...own.map((volume) => volume.qty));
      const byDate = new Map(own.map((volume) => [volume.date, volume.qty]));
      const qtys = days.map((day) => byDate.get(day.date) ?? 0);
      const levels = qtys.map((qty) => (qty > 0 ? Math.max(1, Math.ceil((qty / peak) * 5)) : 0));
      return {
        item,
        levels,
        total: qtys.reduce((sum, qty) => sum + qty, 0),
        shade: levels.reduce((sum, level) => sum + level, 0) / tradingDays,
      };
    })
    .filter((row) => row.total > 0)
    .sort((a, b) => b.shade - a.shade || b.total - a.total);
  return { days, rows };
}

export async function generateMetadata({ params }: PageProps<"/calendar/[month]">): Promise<Metadata> {
  const month = await periodMonth((await params).month);
  const { rows } = await calendarOf(month);
  const name = `${monthNumber(month)}월`;
  return {
    title: `${name} 과일 캘린더 — ${name}에 한창인 과일 | pomona`,
    description: `${name} 서울 가락시장에 한창 들어오는 과일: ${rows
      .slice(0, 6)
      .map((row) => row.item.mclsfNm)
      .join(", ")} 등 ${rows.length}가지.`,
  };
}

export default async function CalendarPage({ params }: PageProps<"/calendar/[month]">) {
  const month = await periodMonth((await params).month);
  const [period, { days, rows }] = await Promise.all([api.period(), calendarOf(month)]);
  const name = `${monthNumber(month)}월`;
  const inProgress = month === period.to;
  const top = rows.slice(0, TOP);
  const rest = rows.slice(TOP);
  const title = (row: Row, day: Day, level: number) =>
    `${row.item.mclsfNm} ${monthNumber(month)}월 ${day.day}일 ${day.traded ? LEVELS[level] : "휴장"}`;

  return (
    <>
      <SiteHeader />
      <main className={styles.main}>
        <section className={styles.hero}>
          <h1 className={styles.name}>{name} 과일 캘린더</h1>
          <p className={styles.basis}>
            서울 가락시장 품목별 하루 출하 물량 · {month.slice(0, 4)}년 {name}
            {inProgress && ` (${Number(period.baseDate.slice(8))}일까지)`}
          </p>
          <nav className={calendar.tabs} aria-label="달">
            {MONTHS.map((tab) => (
              <Link
                key={tab}
                href={`/calendar/${tab}`}
                className={tab === month.slice(5) ? calendar.tabCurrent : calendar.tab}
                aria-current={tab === month.slice(5) ? "page" : undefined}
              >
                {Number(tab)}월
              </Link>
            ))}
          </nav>
        </section>

        <section className={ui.card}>
          <div className={calendar.legend}>
            <span className={calendar.legendScale}>
              적게
              {[1, 2, 3, 4, 5].map((level) => (
                <i key={level} className={calendar[`level${level}`]} />
              ))}
              많이
            </span>
            <span className={calendar.legendNote}>진할수록 그 과일이 1년 중 많이 들어온 날 · 빈 칸은 거래 없는 날</span>
          </div>

          <h2 className={calendar.sectionTitle}>
            {name}에 한창인 과일 <span className={ui.sub}>진한 순 1~{top.length}위</span>
          </h2>
          {/* 날짜 머리. 아래 줄들의 날짜 칸과 같은 격자라 세로로 맞는다 */}
          <div className={calendar.topHead} aria-hidden="true">
            <div className={calendar.strip} style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}>
              {days.map((day) => (
                <span
                  key={day.date}
                  className={[
                    calendar.topDay,
                    day.weekday === 0 ? calendar.sunday : "",
                    majorDay(day) ? calendar.major : "",
                  ].join(" ")}
                >
                  <span className={calendar.dayNumber}>{day.day}</span>
                  <span className={calendar.weekday}>{WEEKDAYS[day.weekday]}</span>
                </span>
              ))}
            </div>
          </div>
          <ol className={calendar.topList}>
            {top.map((row, rank) => (
              <li key={itemCode(row.item)} className={calendar.topRow}>
                <span className={calendar.rank}>{rank + 1}</span>
                <Link href={itemPath(row.item)} className={calendar.topName}>
                  {row.item.mclsfNm}
                </Link>
                <div
                  className={calendar.strip}
                  style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}
                >
                  {row.levels.map((level, index) => {
                    const day = days[index];
                    return (
                      <span
                        key={day.date}
                        className={`${calendar.topCell} ${day.traded ? calendar[`level${level}`] : calendar.closedCell}`}
                        title={title(row, day, level)}
                      >
                        <span className={calendar.hidden}>{title(row, day, level)}</span>
                      </span>
                    );
                  })}
                </div>
              </li>
            ))}
          </ol>
        </section>

        {rest.length > 0 && (
          <section className={ui.card}>
            <h2 className={calendar.sectionTitle}>
              그 밖의 과일 <span className={ui.sub}>{rest.length}가지</span>
            </h2>
            <div className={calendar.scroll}>
              <table className={calendar.table}>
                <thead>
                  <tr>
                    <th scope="col" className={calendar.itemHead}>
                      과일
                    </th>
                    {days.map((day) => (
                      <th
                        key={day.date}
                        scope="col"
                        className={[
                          calendar.dayHead,
                          day.weekday === 0 ? calendar.sunday : "",
                          majorDay(day) ? calendar.major : "",
                        ].join(" ")}
                      >
                        <span className={calendar.dayNumber}>{day.day}</span>
                        <span className={calendar.weekday}>{WEEKDAYS[day.weekday]}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rest.map((row) => (
                    <tr key={itemCode(row.item)}>
                      <th scope="row" className={calendar.itemName}>
                        <Link href={itemPath(row.item)}>{row.item.mclsfNm}</Link>
                      </th>
                      {row.levels.map((level, index) => {
                        const day = days[index];
                        return (
                          <td key={day.date} className={day.traded ? calendar.cell : calendar.closed}>
                            <span
                              className={`${calendar.swatch} ${calendar[`level${level}`]}`}
                              title={title(row, day, level)}
                            >
                              <span className={calendar.hidden}>{title(row, day, level)}</span>
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
