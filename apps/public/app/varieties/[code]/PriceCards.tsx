import {
  addDays,
  type LatestPrice,
  monthDay,
  type RetailPrice,
  shortDate,
  signedPercent,
  type WeeklyPrice,
  won,
} from "@pomona/shared";
import ui from "@/components/ui.module.css";
import styles from "./PriceCards.module.css";

/** 오늘 도매가 · 작년 같은 주 대비 · 소매가. 소매가는 소매 품종이 연결된 품종만 붙는다 */
export function PriceCards({
  baseDate,
  varietyName,
  latest,
  weekly,
  retail,
}: {
  baseDate: string;
  varietyName: string;
  latest: LatestPrice | undefined;
  weekly: WeeklyPrice | undefined;
  retail: RetailPrice | undefined;
}) {
  const week = `${shortDate(addDays(baseDate, -6))} ~ ${shortDate(baseDate)}`;
  return (
    <section className={styles.cards}>
      <article className={ui.card}>
        <header className={styles.head}>
          <Icon tone="green" />
          <h2 className={styles.title}>오늘 도매가</h2>
          {latest && <span className={styles.when}>{monthDay(latest.date)} 경매</span>}
        </header>
        {latest ? (
          <>
            <Big value={won(latest.perKg)} unit="원 / kg" />
            <p className={ui.muted}>등급 합산 대표가 (총액 ÷ 물량)</p>
            {latest.grades.length > 1 ? (
              <details className={styles.grades}>
                <summary>등급별 가격 보기 ({latest.grades.length}개 등급)</summary>
                <dl>
                  {latest.grades.map((grade) => (
                    <div key={grade.grdCd}>
                      <dt>{grade.grdNm}</dt>
                      <dd>{won(grade.perKg)}원</dd>
                    </div>
                  ))}
                </dl>
              </details>
            ) : (
              <p className={ui.muted}>등급 {latest.grades[0]?.grdNm}</p>
            )}
          </>
        ) : (
          <p className={ui.muted}>최근 12개월 거래 없음</p>
        )}
      </article>

      <article className={ui.card}>
        <header className={styles.head}>
          <Icon tone="purple" />
          <h2 className={styles.title}>작년 같은 주 대비</h2>
          <span className={styles.when}>{week}</span>
        </header>
        {weekly ? (
          <>
            {weekly.changeRate === null ? <Big value="—" muted /> : <Big value={signedPercent(weekly.changeRate)} />}
            <dl className={`${styles.rows} ${styles.purple}`}>
              <div>
                <dt>이번 주 평균</dt>
                <dd>{won(weekly.thisWeekPerKg)}원 / kg</dd>
              </div>
              <div className={weekly.lastYearPerKg === null ? styles.none : undefined}>
                <dt>작년 같은 주</dt>
                <dd>{weekly.lastYearPerKg === null ? "거래 없음" : `${won(weekly.lastYearPerKg)}원 / kg`}</dd>
              </div>
            </dl>
          </>
        ) : (
          <>
            <Big value="—" muted />
            <p className={ui.muted}>이번 주 거래 없음</p>
          </>
        )}
      </article>

      {retail && <RetailCard retail={retail} varietyName={varietyName} />}
    </section>
  );
}

function RetailCard({ retail, varietyName }: { retail: RetailPrice; varietyName: string }) {
  const unit = retail.unitSize === 1 ? retail.unit : `${retail.unitSize}${retail.unit}`;
  const [only] = retail.grades;
  const retailName = `${retail.itemName} ${retail.retailVarietyName}`;
  return (
    <article className={ui.card}>
      <header className={styles.head}>
        <Icon tone="orange" />
        <h2 className={styles.title}>소매가</h2>
        <span className={styles.when}>
          {shortDate(retail.from)} ~ {shortDate(retail.to)}
        </span>
      </header>
      {retail.grades.length === 1 ? (
        <>
          <Big value={won(only.price)} unit={`원 / ${unit}`} />
          <p className={ui.muted}>
            {only.grdNm} · 전국 점포 {only.storeCount}곳 · 7일 중앙값
          </p>
        </>
      ) : (
        <>
          <p className={ui.muted}>등급별 · 전국 점포 7일 중앙값 · {unit}당</p>
          <dl className={`${styles.rows} ${styles.orange}`}>
            {retail.grades.map((grade) => (
              <div key={grade.grdCd}>
                <dt>{grade.grdNm}</dt>
                <dd>
                  {won(grade.price)}원 · {grade.storeCount}곳
                </dd>
              </div>
            ))}
          </dl>
        </>
      )}
      {!retailName.includes(varietyName) && <p className={styles.note}>소매 조사 표기 “{retailName}”</p>}
    </article>
  );
}

function Big({ value, unit, muted }: { value: string; unit?: string; muted?: boolean }) {
  return (
    <div className={styles.big}>
      <span className={muted ? styles.bigMuted : styles.bigValue}>{value}</span>
      {unit && <span className={styles.unit}>{unit}</span>}
    </div>
  );
}

const ICONS = {
  green: (
    <path d="M3 13 H21 M8 8 V5 H16 V8 M6 8 H18 A3 3 0 0 1 21 11 V17 A3 3 0 0 1 18 20 H6 A3 3 0 0 1 3 17 V11 A3 3 0 0 1 6 8 Z" />
  ),
  purple: (
    <path d="M6 5 H18 A3 3 0 0 1 21 8 V18 A3 3 0 0 1 18 21 H6 A3 3 0 0 1 3 18 V8 A3 3 0 0 1 6 5 Z M3 10 H21 M8 3 V7 M16 3 V7" />
  ),
  orange: <path d="M4 10 H20 L18 20 H6 Z M8 10 L11 4 M16 10 L13 4" />,
};

function Icon({ tone }: { tone: keyof typeof ICONS }) {
  return (
    <span className={`${styles.icon} ${styles[tone]}`}>
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
        {ICONS[tone]}
      </svg>
    </span>
  );
}
