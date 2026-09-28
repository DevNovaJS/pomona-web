import Link from "next/link";
import { api } from "@/lib/api";
import { selectOptions } from "@/lib/select";
import { FruitSelect } from "./FruitSelect";
import styles from "./SiteHeader.module.css";

/**
 * 공개 페이지의 머리. 품목·품종 페이지는 [current] 를 넘겨 셀렉트박스를 둔다(메인은 본문에, 캘린더·리뷰는 없음).
 * 넓은 화면은 한 줄, 좁은 화면은 로고 줄 아래에 셀렉트를 한 줄 더 둔다.
 */
export async function SiteHeader({ current }: { current?: { itemCode: string; varietyCode?: string } }) {
  const [items, varieties, period] = await Promise.all([api.items(), api.varieties(), api.period()]);
  const selects = current && (
    <div className={styles.selects}>
      <FruitSelect {...selectOptions(items, varieties)} itemCode={current.itemCode} varietyCode={current.varietyCode} />
    </div>
  );

  return (
    <header className={styles.header}>
      <Link href="/" className={styles.logo}>
        <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true">
          <circle cx="15" cy="17" r="10" fill="#cfe6b8" stroke="#5e9a5a" strokeWidth="2" />
          <path d="M15 7 C15 4 17 2 20 1" fill="none" stroke="#5e9a5a" strokeWidth="2" strokeLinecap="round" />
        </svg>
        pomona
      </Link>
      {selects}
      <nav className={styles.nav}>
        <Link href={`/calendar/${period.to.slice(5)}`}>과일 캘린더</Link>
        <Link href="/reviews">리뷰</Link>
      </nav>
    </header>
  );
}
