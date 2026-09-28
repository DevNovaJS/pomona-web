"use client";

import { type ReactNode, useState } from "react";
import styles from "./ShowMore.module.css";

/**
 * 앞의 [shown] 개만 보여주고 나머지는 버튼으로 편다. 접힌 것도 HTML 에는 들어 있어 검색엔진이 링크를 따라간다.
 * [items] 는 [className] 을 단 목록 안에 그대로 놓인다.
 */
export function ShowMore({
  items,
  shown,
  className,
  moreLabel,
}: {
  items: { key: string; node: ReactNode }[];
  shown: number;
  className: string;
  moreLabel: string;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <>
      <div className={className}>
        {items.map((item, index) => (
          // 감싼 칸은 display: contents 라 목록의 격자·줄 배치에 끼어들지 않는다
          <div key={item.key} className={!expanded && index >= shown ? styles.folded : styles.item}>
            {item.node}
          </div>
        ))}
      </div>
      {!expanded && items.length > shown && (
        <button type="button" className={styles.more} onClick={() => setExpanded(true)}>
          {moreLabel}
        </button>
      )}
    </>
  );
}
