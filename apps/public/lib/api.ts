import { readFile } from "node:fs/promises";
import path from "node:path";
import type {
  BuildPeriod,
  Item,
  ItemMonthlyVolume,
  ItemTopOrigins,
  LatestPrice,
  MonthlyVolume,
  PageVariety,
  RetailPrice,
  Review,
  TopOrigins,
  TradingDays,
  WeeklyPrice,
} from "@pomona/shared";

/*
 * 백엔드 공개 API 응답. 빌드 직전에 scripts/fetch-data.mjs 가 받아 둔 data/*.json 을 읽는다
 * (fetch 로 부르지 않는 이유는 그 스크립트 주석). 파일마다 한 번 읽어 모듈 안에 들고 있다가 페이지들이 나눠 쓴다.
 */
const files = new Map<string, Promise<unknown>>();

function read<T>(name: string): Promise<T> {
  let file = files.get(name);
  if (!file) {
    file = readFile(path.join(process.cwd(), "data", `${name}.json`), "utf-8").then(JSON.parse);
    files.set(name, file);
  }
  return file as Promise<T>;
}

export const api = {
  period: () => read<BuildPeriod>("period"),
  items: () => read<Item[]>("items"),
  varieties: () => read<PageVariety[]>("varieties"),
  latestPrices: () => read<LatestPrice[]>("latest-prices"),
  weeklyPrices: () => read<WeeklyPrice[]>("weekly-prices"),
  retailPrices: () => read<RetailPrice[]>("retail-prices"),
  volumes: () => read<MonthlyVolume[]>("volumes"),
  itemVolumes: () => read<ItemMonthlyVolume[]>("item-volumes"),
  tradingDays: () => read<TradingDays>("trading-days"),
  origins: () => read<TopOrigins[]>("origins"),
  itemOrigins: () => read<ItemTopOrigins[]>("item-origins"),
  reviews: () => read<Review[]>("reviews"),
};
