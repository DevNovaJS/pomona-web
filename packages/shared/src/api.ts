/*
 * 백엔드 공개 빌드 API(/api/public/**) 응답. 백엔드 모델(com.pomona.*.model)을 그대로 옮긴다.
 * 날짜는 "2026-09-22", 달은 "2026-09" 문자열이고, BigDecimal 은 숫자로 온다.
 */
import type { Origin } from "./origin";

/** 날짜 "2026-09-22" */
export type IsoDate = string;
/** 달 "2026-09" */
export type YearMonth = string;

/** GET /period — 기준일(DB 의 마지막 거래일)과 기준일이 속한 달까지 12개월 */
export interface BuildPeriod {
  baseDate: IsoDate;
  from: YearMonth;
  to: YearMonth;
}

/** GET /items */
export interface Item {
  lclsfCd: string;
  lclsfNm: string;
  mclsfCd: string;
  mclsfNm: string;
}

/** GET /varieties — 품종 페이지를 만들 품종. 품목 안에서 물량 순 */
export interface PageVariety extends Item {
  id: number;
  sclsfCd: string;
  sclsfNm: string | null;
}

export interface GradePrice {
  grdCd: string;
  grdNm: string;
  /** kg당 원 */
  perKg: number;
}

/** GET /prices/latest — 품종별 마지막 거래일 도매가 */
export interface LatestPrice {
  varietyId: number;
  date: IsoDate;
  /** 등급 합산 대표가, kg당 원 */
  perKg: number;
  /** 등급 코드 순 */
  grades: GradePrice[];
}

/** GET /prices/weekly — 기준일 포함 최근 7일 평균과 364일 전 같은 7일 평균. 최근 7일에 거래한 품종만 온다 */
export interface WeeklyPrice {
  varietyId: number;
  thisWeekPerKg: number;
  lastYearPerKg: number | null;
  /** 등락률(%), 소수 1자리 */
  changeRate: number | null;
}

export interface RetailGradePrice {
  grdCd: string;
  grdNm: string;
  price: number;
  storeCount: number;
}

/** GET /retail-prices — 소매 품종이 연결된 품종만 온다. 가격은 [unitSize][unit] 당 */
export interface RetailPrice {
  varietyId: number;
  itemName: string;
  retailVarietyName: string;
  from: IsoDate;
  to: IsoDate;
  unit: string;
  unitSize: number;
  grades: RetailGradePrice[];
}

/** GET /volumes — 품종·달·국산/수입별 물량(kg). 거래가 없는 달은 오지 않는다 */
export interface MonthlyVolume {
  varietyId: number;
  month: YearMonth;
  origin: Origin;
  qty: number;
}

/** GET /volumes/items — 품목·달·국산/수입별 물량(kg). 품목 안의 기타·소량 품종까지 전부 합친다 */
export interface ItemMonthlyVolume {
  lclsfCd: string;
  mclsfCd: string;
  month: YearMonth;
  origin: Origin;
  qty: number;
}

/** GET /trading-days — 달마다 가락시장 거래일 수 */
export type TradingDays = Record<YearMonth, number>;

export interface OriginVolume {
  plorCd: string;
  /** 코드 339000 하나는 이름이 늘 비어 온다 */
  plorNm: string | null;
  qty: number;
}

/** GET /origins — 품종별 12개월 합계 상위 5곳과 달마다 상위 5곳 */
export interface TopOrigins {
  varietyId: number;
  total: OriginVolume[];
  byMonth: Record<YearMonth, OriginVolume[]>;
}

/** GET /origins/items — 품목별 12개월 합계 상위 5곳과 달마다 상위 5곳 */
export interface ItemTopOrigins {
  lclsfCd: string;
  mclsfCd: string;
  total: OriginVolume[];
  byMonth: Record<YearMonth, OriginVolume[]>;
}

/** 리뷰의 그날 도매 시세 */
export interface MarketPrice {
  date: IsoDate;
  perKg: number;
  grades: GradePrice[];
}

/** GET /reviews — 먹은 날 최신순. 품종을 연결하지 않았으면 varietyId·itemName·varietyName·marketPrice 가 null */
export interface Review {
  id: number;
  fruitName: string;
  varietyId: number | null;
  itemName: string | null;
  varietyName: string | null;
  eatenDate: IsoDate;
  title: string;
  store: string;
  origin: string | null;
  price: number;
  weightGram: number | null;
  pricePerKg: number | null;
  rating: number;
  body: string;
  marketPrice: MarketPrice | null;
  createdAt: string;
  updatedAt: string;
}
