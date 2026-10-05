"use client";

import type { AdminVariety } from "@pomona/shared";
import { useState } from "react";
import styles from "./reviews.module.css";

/** 한 번에 보여줄 검색 결과 수 */
const LIMIT = 12;

function normalize(text: string): string {
  return text.replace(/\s+/g, "").toLowerCase();
}

function nameOf(variety: AdminVariety): string {
  return `${variety.mclsfNm} · ${variety.sclsfNm ?? "이름 없음"}`;
}

function codeOf(variety: AdminVariety): string {
  return `${variety.lclsfCd}-${variety.mclsfCd}-${variety.sclsfCd}`;
}

/**
 * 가락시장 품종 연결. 페이지 없는 소량 품종까지 품종 마스터 전부에서 품목·품종 이름으로 찾는다("포도샤인", "샤인").
 * 연결하면 이름표로 바뀌고, 해제하면 다시 찾기 칸이 된다.
 */
export function VarietyPicker({
  varieties,
  value,
  onChange,
}: {
  varieties: AdminVariety[];
  value: number | null;
  onChange: (id: number | null) => void;
}) {
  const [query, setQuery] = useState("");
  const selected = varieties.find((variety) => variety.id === value);

  if (value !== null) {
    return (
      <span className={styles.picked}>
        <span className={styles.pickedName}>
          {selected ? nameOf(selected) : `품종 ${value}`}
          {selected && <span className={styles.code}>{codeOf(selected)}</span>}
        </span>
        <button type="button" className={styles.unpick} onClick={() => onChange(null)}>
          ✕ 연결 해제
        </button>
      </span>
    );
  }

  const matches = query.trim()
    ? varieties.filter((variety) => normalize(`${variety.mclsfNm}${variety.sclsfNm ?? ""}`).includes(normalize(query)))
    : [];

  return (
    <div className={styles.picker}>
      <input
        className={styles.input}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="품목·품종 이름으로 찾기 (연결 없이 저장해도 됨)"
        aria-label="가락시장 품종 찾기"
      />
      {query.trim() && (
        <div className={styles.matches}>
          {matches.slice(0, LIMIT).map((variety) => (
            <button
              key={variety.id}
              type="button"
              className={styles.match}
              onClick={() => {
                onChange(variety.id);
                setQuery("");
              }}
            >
              {nameOf(variety)}
              <span className={styles.code}>{codeOf(variety)}</span>
            </button>
          ))}
          <span className={styles.matchNote}>
            {matches.length === 0
              ? "결과 없음 · 가락시장에 없는 과일이면 연결 없이 저장"
              : matches.length > LIMIT
                ? `${matches.length}개 중 ${LIMIT}개 · 더 좁혀 찾기`
                : `${matches.length}개`}
          </span>
        </div>
      )}
    </div>
  );
}
