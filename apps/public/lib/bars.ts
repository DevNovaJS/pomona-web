import type { MonthlyVolume, YearMonth } from "@pomona/shared";
import type { MonthBar } from "@/components/MonthlyBars";

/** 달마다 국산·수입 물량을 12칸으로 편다. 거래가 없는 달은 0 */
export function toBars(months: YearMonth[], volumes: Pick<MonthlyVolume, "month" | "origin" | "qty">[]): MonthBar[] {
  return months.map((month) => ({
    month,
    domestic: volumes.find((volume) => volume.month === month && volume.origin === "DOMESTIC")?.qty ?? 0,
    imported: volumes.find((volume) => volume.month === month && volume.origin === "IMPORT")?.qty ?? 0,
  }));
}

/** 12칸 물량 합계(kg) */
export function barsTotal(bars: MonthBar[]): number {
  return bars.reduce((sum, bar) => sum + bar.domestic + bar.imported, 0);
}

/** 12개월 동안 수입 물량이 국산보다 많은 품종. "수입" 칩과 수입 색을 붙인다 */
export function importedVarietyIds(volumes: MonthlyVolume[]): Set<number> {
  const balance = new Map<number, number>();
  for (const volume of volumes) {
    const sign = volume.origin === "IMPORT" ? 1 : -1;
    balance.set(volume.varietyId, (balance.get(volume.varietyId) ?? 0) + sign * volume.qty);
  }
  return new Set([...balance].filter(([, qty]) => qty > 0).map(([id]) => id));
}
