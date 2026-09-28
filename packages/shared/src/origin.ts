/** 백엔드 응답의 국산·수입 구분 (`/volumes` 등의 origin). */
export type Origin = "DOMESTIC" | "IMPORT";

export const ORIGIN_LABEL: Record<Origin, string> = {
  DOMESTIC: "국산",
  IMPORT: "수입",
};

/** 산지 코드가 `800` + 국가코드면 수입이다(`800CL` 칠레). 국내 산지는 시·군 코드 6자리 */
export function isImportOrigin(plorCd: string): boolean {
  return plorCd.startsWith("800");
}

/** 산지 이름. 원본 그대로 쓰고("경상북도 김천시"), 이름이 비어 오면 "산지 미상" */
export function originName(plorNm: string | null): string {
  return plorNm ?? "산지 미상";
}
