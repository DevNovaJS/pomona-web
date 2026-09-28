import { ORIGIN_LABEL } from "@pomona/shared";
import styles from "./page.module.css";

// 셋업 확인용. 메인 화면을 만들 때 바꾼다
export default function Home() {
  return (
    <main className={styles.main}>
      <h1 className={styles.title}>지금 제철 과일</h1>
      <p>
        <span className={styles.domestic}>{ORIGIN_LABEL.DOMESTIC}</span>{" "}
        <span className={styles.import}>{ORIGIN_LABEL.IMPORT}</span>
      </p>
    </main>
  );
}
