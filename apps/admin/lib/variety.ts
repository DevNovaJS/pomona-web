import type { AdminVariety, RetailVariety } from "@pomona/shared";

/** 띄어쓰기·대소문자를 무시하고 찾는다. "샤인 머스캣" 으로도 "샤인머스캣" 이 나온다 */
export function normalize(text: string): string {
  return text.replace(/\s+/g, "").toLowerCase();
}

/** "포도 · 샤인마스캇" */
export function varietyName(variety: Pick<AdminVariety, "mclsfNm" | "sclsfNm">): string {
  return `${variety.mclsfNm} · ${variety.sclsfNm ?? "이름 없음"}`;
}

/** 정산 코드 "06-03-36" */
export function varietyCode(variety: AdminVariety): string {
  return `${variety.lclsfCd}-${variety.mclsfCd}-${variety.sclsfCd}`;
}

/** "포도 · 샤인머스켓" */
export function retailName(retail: RetailVariety): string {
  return `${retail.itemNm} · ${retail.vrtyNm}`;
}

/** 가격 API 코드 "414-12" */
export function retailCode(retail: RetailVariety): string {
  return `${retail.itemCd}-${retail.vrtyCd}`;
}
