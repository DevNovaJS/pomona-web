"use client";

import {
  addDays,
  type BatchDay,
  type BatchJob,
  type BatchOverview,
  type BatchRun,
  monthDayWeekday,
  type RetailVariety,
  shortDate,
  won,
} from "@pomona/shared";
import { useCallback, useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import ui from "../ui.module.css";
import styles from "./batch.module.css";

/** 이력 한 장. 백엔드가 수집 대상일 10일씩 준다 */
const PAGE_DAYS = 10;
/** 기간 재수집이 도는 동안 현황을 다시 묻는 간격 */
const POLL_MS = 3000;

const JOB_LABEL: Record<BatchJob, string> = {
  "wholesale-daily": "도매 · 가락 정산",
  "retail-daily": "소매 · 가격 API",
};

const WEEKDAY_NAME = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];

/** 오늘 날짜(이 노트북 시간대) */
function today(): string {
  return new Date().toLocaleDateString("sv-SE");
}

function weekdayOf(date: string): number {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

/**
 * 수집 대상일. 도매는 그 하루, 소매는 대상일까지 며칠 구간을 한 번에 조회해서(params.from ~ to) 구간으로 적는다
 */
function targetOf(run: BatchRun): string {
  return run.jobName === "retail-daily" && typeof run.params.from === "string" && run.params.from !== run.targetDate
    ? `${shortDate(run.params.from)} ~ ${monthDayWeekday(run.targetDate)}`
    : monthDayWeekday(run.targetDate);
}

/** "2026-10-05T23:12:08.1+09:00" → "10-05 23:12" */
function startedAt(run: BatchRun): string {
  return run.startedAt.slice(5, 16).replace("T", " ");
}

/**
 * 배치 관리. 도매·소매 수집 현황, 안 풀린 실패와 재실행, 기간 재수집, 최근 실행 이력(10건씩 더 보기).
 * 결측(EMPTY)은 실패가 아니라 그날 거래·조사가 없던 것이다. 도매는 주말인지 평일인지 수집 대상일의 요일로 나눠 보여준다.
 * 공개면 빌드는 실행 방식을 인프라 구성 때 정해서 아직 버튼만 있다.
 */
export default function BatchPage() {
  const [overview, setOverview] = useState<BatchOverview | null>(null);
  const [failures, setFailures] = useState<BatchRun[]>([]);
  const [days, setDays] = useState<BatchDay[]>([]);
  /** 소매를 품목별로 펼친 날짜 */
  const [openDate, setOpenDate] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [itemNames, setItemNames] = useState<Map<string, string>>(new Map());
  const [loadError, setLoadError] = useState<string | null>(null);
  const [from, setFrom] = useState(() => addDays(today(), -7));
  const [to, setTo] = useState(() => addDays(today(), -1));
  const [retrying, setRetrying] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  /** 현황·실패·이력 첫 장을 다시 받는다. 재실행·재수집이 끝난 뒤에도 부른다 */
  const reload = useCallback(async () => {
    const [loadedOverview, loadedFailures, loadedRuns] = await Promise.all([
      adminApi.get<BatchOverview>("/batch/status"),
      adminApi.get<BatchRun[]>("/batch/failures"),
      adminApi.get<BatchDay[]>("/batch/runs"),
    ]);
    setOverview(loadedOverview);
    setFailures(loadedFailures ?? []);
    setDays(loadedRuns ?? []);
    setHasMore((loadedRuns ?? []).length === PAGE_DAYS);
  }, []);

  useEffect(() => {
    reload().catch((caught: Error) => setLoadError(caught.message));
    adminApi
      .get<RetailVariety[]>("/mappings/retail-varieties")
      .then((retailVarieties) =>
        setItemNames(new Map((retailVarieties ?? []).map((retail) => [retail.itemCd, retail.itemNm]))),
      )
      .catch((caught: Error) => setLoadError(caught.message));
  }, [reload]);

  // 재수집이 도는 동안 현황을 다시 물어 끝나면 전부 새로 받는다
  const running = overview?.running ?? false;
  useEffect(() => {
    if (!running) {
      return;
    }
    const timer = setInterval(async () => {
      const latest = await adminApi.get<BatchOverview>("/batch/status");
      if (latest && !latest.running) {
        await reload();
        setNotice("기간 재수집이 끝났습니다. 공개면은 빌드를 돌려야 바뀝니다.");
      }
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [running, reload]);

  const jobLabel = (run: BatchRun) =>
    run.jobName === "wholesale-daily"
      ? "도매 · 가락 정산"
      : `소매 · ${itemNames.get(String(run.params.item)) ?? `품목 ${String(run.params.item)}`}`;

  const more = async () => {
    try {
      const next = await adminApi.get<BatchDay[]>(`/batch/runs?before=${days[days.length - 1].targetDate}`);
      setDays((current) => [...current, ...(next ?? [])]);
      setHasMore((next ?? []).length === PAGE_DAYS);
    } catch (caught) {
      setError((caught as Error).message);
    }
  };

  const retry = async (run: BatchRun) => {
    setRetrying(run.id);
    setError(null);
    try {
      const result = await adminApi.post<BatchRun>(`/batch/runs/${run.id}/retry`, undefined);
      await reload();
      setNotice(
        result?.status === "FAILED"
          ? `${jobLabel(run)} ${monthDayWeekday(run.targetDate)} 재실행도 실패했습니다`
          : `${jobLabel(run)} ${monthDayWeekday(run.targetDate)} 재실행했습니다`,
      );
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setRetrying(null);
    }
  };

  const collect = async () => {
    setError(null);
    if (from > to) {
      setError("시작일이 끝일보다 늦습니다");
      return;
    }
    try {
      await adminApi.post(`/batch/collect?from=${from}&to=${to}`, undefined);
      setNotice(null);
      setOverview((current) => (current ? { ...current, running: true } : current));
    } catch (caught) {
      setError((caught as Error).message);
    }
  };

  if (loadError) {
    return <p className={ui.loadError}>불러오지 못했습니다: {loadError}</p>;
  }
  if (!overview) {
    return <p className={ui.loading}>불러오는 중</p>;
  }

  return (
    <>
      <div className={ui.titleRow}>
        <h1 className={ui.title}>배치 관리</h1>
        <span className={ui.subtitle}>매일 새벽 도매(가락 정산)·소매(가격 API) 수집</span>
        {notice && <span className={ui.notice}>{notice}</span>}
      </div>

      <section className={styles.cards}>
        {overview.jobs.map((job) => (
          <article key={job.jobName} className={styles.card}>
            <div className={styles.cardHead}>
              <h2 className={styles.cardTitle}>{JOB_LABEL[job.jobName]}</h2>
              <span className={job.unresolvedFailures > 0 ? styles.badgeFailed : styles.badgeOk}>
                실패 {job.unresolvedFailures}
              </span>
            </div>
            <span className={styles.cardLabel}>마지막 성공 수집일</span>
            <span className={styles.cardValue}>
              {job.lastSuccessDate ? monthDayWeekday(job.lastSuccessDate) : "아직 없음"}
            </span>
          </article>
        ))}
        <article className={styles.card}>
          <div className={styles.cardHead}>
            <h2 className={styles.cardTitle}>공개면 빌드</h2>
            <span className={styles.badgeMuted}>실행 방식 미정</span>
          </div>
          <span className={styles.cardLabel}>
            리뷰를 쓰거나 재수집한 뒤 눌러서 공개면에 반영. 실행 방식은 인프라 구성 때 정한다.
          </span>
          <button type="button" className={ui.primary} disabled>
            빌드 실행
          </button>
        </article>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>안 풀린 실패</h2>
          <span className={styles.sectionNote}>같은 조건으로 다시 성공하면 목록에서 빠짐</span>
        </div>
        {failures.length === 0 ? (
          <span className={styles.empty}>안 풀린 실패가 없습니다</span>
        ) : (
          failures.map((run) => (
            <div key={run.id} className={styles.failure}>
              <span className={styles.date}>{targetOf(run)}</span>
              <span>{jobLabel(run)}</span>
              <span className={styles.message}>{run.message ?? "사유 없음"}</span>
              <span className={styles.time}>{startedAt(run)} 실행</span>
              <button
                type="button"
                className={ui.secondary}
                disabled={retrying !== null || running}
                onClick={() => retry(run)}
              >
                {retrying === run.id ? "재실행 중" : "재실행"}
              </button>
            </div>
          ))
        )}
      </section>

      <section className={styles.collect}>
        <h2 className={styles.sectionTitle}>기간 재수집</h2>
        <label className={styles.dateField}>
          부터
          <input
            type="date"
            className={ui.input}
            value={from}
            max={to}
            onChange={(event) => setFrom(event.target.value)}
          />
        </label>
        <label className={styles.dateField}>
          까지
          <input
            type="date"
            className={ui.input}
            value={to}
            min={from}
            onChange={(event) => setTo(event.target.value)}
          />
        </label>
        <button type="button" className={ui.primary} disabled={running} onClick={collect}>
          {running ? "수집 중" : "도매·소매 다시 수집"}
        </button>
        <span className={error ? styles.error : styles.sectionNote}>
          {error ?? "뒤에서 돌고 바로 돌아옴. 도는 동안 버튼이 잠기고 끝나면 아래 목록이 새로 뜸"}
        </span>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>최근 실행 이력</h2>
          <span className={styles.sectionNote}>수집 대상일별 · 같은 날을 여러 번 돌렸으면 마지막 결과</span>
          <span className={styles.legend}>
            <span className={styles.statusSuccess}>성공</span>
            <span className={styles.statusEmpty}>결측 · 주말·조사 없음</span>
            <span className={styles.statusEmptyWeekday}>결측 · 평일</span>
            <span className={styles.statusFailed}>실패</span>
          </span>
        </div>
        <div className={styles.dayHead}>
          <span>수집 대상일</span>
          <span>도매</span>
          <span>소매</span>
        </div>
        {days.map((day) => {
          const wholesale = day.runs.find(({ run }) => run.jobName === "wholesale-daily");
          const retail = day.runs.filter(({ run }) => run.jobName === "retail-daily");
          const open = openDate === day.targetDate;
          return (
            <div key={day.targetDate} className={styles.day}>
              <div className={styles.dayRow}>
                <span className={styles.date}>{monthDayWeekday(day.targetDate)}</span>
                <span className={styles.cell}>
                  {wholesale ? (
                    <>
                      <RunStatus run={wholesale.run} />
                      {wholesale.attempts > 1 && <span className={styles.attempts}>실행 {wholesale.attempts}번</span>}
                    </>
                  ) : (
                    <span className={styles.none}>기록 없음</span>
                  )}
                </span>
                <span className={styles.cell}>
                  {retail.length > 0 ? (
                    <>
                      <RetailSummary runs={retail.map(({ run }) => run)} />
                      <button
                        type="button"
                        className={styles.toggle}
                        aria-expanded={open}
                        onClick={() => setOpenDate(open ? null : day.targetDate)}
                      >
                        품목별 {open ? "▴" : "▾"}
                      </button>
                    </>
                  ) : (
                    <span className={styles.none}>기록 없음</span>
                  )}
                </span>
              </div>
              {open && (
                <div className={styles.items}>
                  <span className={styles.itemsNote}>
                    소매 {targetOf(retail[0].run)} 조회 · 품목별 마지막 실행 · {retail.length}품목 ·{" "}
                    {won(retail.reduce((sum, { run }) => sum + run.rowCount, 0))}행
                  </span>
                  <div className={styles.itemChips}>
                    {retail.map(({ run, attempts }) => (
                      <span key={run.id} className={chipClass(run)} title={run.message ?? undefined}>
                        {itemNames.get(String(run.params.item)) ?? `품목 ${String(run.params.item)}`}
                        {run.status === "SUCCESS" && ` ${won(run.rowCount)}행`}
                        {run.status === "EMPTY" && " · 결측"}
                        {run.status === "FAILED" && " · 실패"}
                        {attempts > 1 && ` (${attempts}번)`}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {days.length === 0 && <span className={styles.empty}>실행 기록이 없습니다</span>}
        {hasMore && (
          <button type="button" className={`${ui.secondary} ${styles.more}`} onClick={more}>
            10일 더 보기
          </button>
        )}
      </section>
    </>
  );
}

/** 소매 하루 요약. 품목별 마지막 실행을 상태별로 센다 */
function RetailSummary({ runs }: { runs: BatchRun[] }) {
  const count = (status: BatchRun["status"]) => runs.filter((run) => run.status === status).length;
  return (
    <>
      {count("SUCCESS") > 0 && <span className={styles.statusSuccess}>성공 {count("SUCCESS")}</span>}
      {count("EMPTY") > 0 && <span className={styles.statusEmpty}>결측 {count("EMPTY")}</span>}
      {count("FAILED") > 0 && <span className={styles.statusFailed}>실패 {count("FAILED")}</span>}
      {count("RUNNING") > 0 && <span className={styles.statusRunning}>도는 중 {count("RUNNING")}</span>}
    </>
  );
}

function chipClass(run: BatchRun): string {
  if (run.status === "SUCCESS") {
    return styles.chipSuccess;
  }
  return run.status === "FAILED" ? styles.chipFailed : styles.chipEmpty;
}

function RunStatus({ run }: { run: BatchRun }) {
  if (run.status === "SUCCESS") {
    return <span className={styles.statusSuccess}>성공 {won(run.rowCount)}행</span>;
  }
  if (run.status === "EMPTY" && run.jobName === "retail-daily") {
    // 소매는 며칠 구간을 조회하므로 요일로 가를 수 없다. 그 품목이 구간 안에 조사되지 않은 것
    return <span className={styles.statusEmpty}>결측 · 조사 없음</span>;
  }
  if (run.status === "EMPTY") {
    const weekday = weekdayOf(run.targetDate);
    return weekday === 0 || weekday === 6 ? (
      <span className={styles.statusEmpty}>결측 · {WEEKDAY_NAME[weekday]}</span>
    ) : (
      <span className={styles.statusEmptyWeekday}>결측 · 평일</span>
    );
  }
  if (run.status === "RUNNING") {
    return <span className={styles.statusRunning}>도는 중</span>;
  }
  return (
    <span className={styles.statusFailed} title={run.message ?? undefined}>
      실패{run.message && ` · ${run.message}`}
    </span>
  );
}
