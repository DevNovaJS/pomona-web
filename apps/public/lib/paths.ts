import type { Item, PageVariety } from "@pomona/shared";

/*
 * 주소는 정산정보 코드를 그대로 쓴다. 품목 /items/06-03, 품종 /varieties/06-03-36.
 */
export function itemCode(item: Pick<Item, "lclsfCd" | "mclsfCd">): string {
  return `${item.lclsfCd}-${item.mclsfCd}`;
}

export function varietyCode(variety: PageVariety): string {
  return `${variety.lclsfCd}-${variety.mclsfCd}-${variety.sclsfCd}`;
}

export function itemPath(item: Pick<Item, "lclsfCd" | "mclsfCd">): string {
  return `/items/${itemCode(item)}`;
}

export function varietyPath(variety: PageVariety): string {
  return `/varieties/${varietyCode(variety)}`;
}

/** 품종 이름. 소분류 이름이 비어 오면 품목 이름으로 대신한다 */
export function varietyName(variety: PageVariety): string {
  return variety.sclsfNm ?? variety.mclsfNm;
}
