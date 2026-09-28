"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "./FruitSelect.module.css";

export interface SelectItem {
  code: string;
  name: string;
}

export interface SelectVariety extends SelectItem {
  itemCode: string;
}

const ITEM_ALL = "item";

/**
 * 품목 → 품종 셀렉트. 품목을 바꾸면 품종 목록만 바뀌고, 품종을 고르면 그 페이지로 간다. "품목 전체"는 품목 페이지로.
 * 지금 보는 페이지의 품목·품종을 처음 값으로 받는다(메인은 둘 다 없음).
 */
export function FruitSelect({
  items,
  varieties,
  itemCode,
  varietyCode,
}: {
  items: SelectItem[];
  varieties: SelectVariety[];
  itemCode?: string;
  varietyCode?: string;
}) {
  const router = useRouter();
  const [selectedItem, setSelectedItem] = useState(itemCode ?? "");
  // 품목 페이지면 "품목 전체"가 골라진 상태로 시작한다
  const [selectedVariety, setSelectedVariety] = useState(varietyCode ?? (itemCode ? ITEM_ALL : ""));
  const itemVarieties = varieties.filter((variety) => variety.itemCode === selectedItem);

  function changeVariety(value: string) {
    setSelectedVariety(value);
    router.push(value === ITEM_ALL ? `/items/${selectedItem}` : `/varieties/${value}`);
  }

  return (
    <div className={styles.selects}>
      <label className={styles.label}>
        품목
        <select
          className={styles.select}
          value={selectedItem}
          onChange={(event) => {
            setSelectedItem(event.target.value);
            // 품목을 바꾸면 품종은 아직 안 고른 상태로 돌아간다
            setSelectedVariety("");
          }}
        >
          {!selectedItem && <option value="">품목 선택</option>}
          {items.map((item) => (
            <option key={item.code} value={item.code}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      <label className={styles.label}>
        품종
        <select
          className={styles.select}
          value={selectedVariety}
          disabled={!selectedItem}
          onChange={(event) => changeVariety(event.target.value)}
        >
          {!selectedVariety && <option value="">품종 선택</option>}
          {selectedItem && <option value={ITEM_ALL}>품목 전체</option>}
          {itemVarieties.map((variety) => (
            <option key={variety.code} value={variety.code}>
              {variety.name}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
