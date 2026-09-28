import type { Item, PageVariety } from "@pomona/shared";
import type { SelectItem, SelectVariety } from "@/components/FruitSelect";
import { itemCode, varietyCode, varietyName } from "./paths";

/** 품목 → 품종 셀렉트에 넣을 목록. 품종은 서버가 준 순서(품목 안에서 물량 순) 그대로 */
export function selectOptions(
  items: Item[],
  varieties: PageVariety[],
): { items: SelectItem[]; varieties: SelectVariety[] } {
  return {
    items: items.map((item) => ({ code: itemCode(item), name: item.mclsfNm })),
    varieties: varieties.map((variety) => ({
      code: varietyCode(variety),
      name: varietyName(variety),
      itemCode: itemCode(variety),
    })),
  };
}
