import type { IsoDate, YearMonth } from "./api";

const WEEKDAY = ["일", "월", "화", "수", "목", "금", "토"];

/** 원 단위로 반올림해 쉼표를 찍는다. 3089.54 → "3,090" */
export function won(value: number): string {
  return Math.round(value).toLocaleString("ko-KR");
}

/** kg 을 톤으로 반올림한다. 3938570.96 → "3,939t". 반올림해 0이 되는 물량은 "1t 미만" */
export function tons(kg: number): string {
  const rounded = Math.round(kg / 1000);
  return rounded === 0 && kg > 0 ? "1t 미만" : `${rounded.toLocaleString("ko-KR")}t`;
}

/** 백분율, 소수 1자리. 0.502 → "50.2%" */
export function percent(ratio: number): string {
  return `${(ratio * 100).toFixed(1)}%`;
}

/** 등락률. 12.3 → "+12.3%", -5 → "−5.0%" */
export function signedPercent(rate: number): string {
  const sign = rate > 0 ? "+" : rate < 0 ? "−" : "";
  return `${sign}${Math.abs(rate).toFixed(1)}%`;
}

/*
 * 날짜는 "2026-09-22" 문자열을 그대로 쪼갠다. Date 로 바꾸면 빌드 서버의 시간대에 따라 하루 밀릴 수 있다.
 * 요일만 UTC 기준 Date 로 구한다.
 */
function parts(date: IsoDate): [number, number, number] {
  const [year, month, day] = date.split("-").map(Number);
  return [year, month, day];
}

function weekday(date: IsoDate): string {
  const [year, month, day] = parts(date);
  return WEEKDAY[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
}

/** "2026년 9월 22일(화)" */
export function longDate(date: IsoDate): string {
  const [year, month, day] = parts(date);
  return `${year}년 ${month}월 ${day}일(${weekday(date)})`;
}

/** "9월 22일" */
export function monthDay(date: IsoDate): string {
  const [, month, day] = parts(date);
  return `${month}월 ${day}일`;
}

/** "9월 19일(토)" */
export function monthDayWeekday(date: IsoDate): string {
  return `${monthDay(date)}(${weekday(date)})`;
}

/** "9/22" */
export function shortDate(date: IsoDate): string {
  const [, month, day] = parts(date);
  return `${month}/${day}`;
}

/** 날짜에 일수를 더한다. 달력 계산이라 UTC 로 한다 */
export function addDays(date: IsoDate, days: number): IsoDate {
  const [year, month, day] = parts(date);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

/** "2025-10" 부터 "2026-09" 까지 12달 */
export function monthsBetween(from: YearMonth, to: YearMonth): YearMonth[] {
  const months: YearMonth[] = [];
  let [year, month] = from.split("-").map(Number);
  while (true) {
    const current = `${year}-${String(month).padStart(2, "0")}`;
    months.push(current);
    if (current === to) {
      return months;
    }
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
}

/** "2026-09" → 9 */
export function monthNumber(month: YearMonth): number {
  return Number(month.slice(5));
}
