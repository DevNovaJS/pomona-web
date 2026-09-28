import styles from "./SiteFooter.module.css";

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <p>데이터: 한국농수산식품유통공사 전국 공영도매시장 정산정보 · 일별 도·소매 가격정보 (공공데이터포털)</p>
      <p>도매가는 서울 가락시장 경매 기준, 소매가는 전국 조사 점포 기준.</p>
    </footer>
  );
}
