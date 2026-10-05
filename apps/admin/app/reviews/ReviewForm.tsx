"use client";

import {
  type AdminVariety,
  type MarketPrice,
  monthDayWeekday,
  type Review,
  type ReviewRequest,
  shortDate,
  won,
} from "@pomona/shared";
import { type ReactNode, useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import ui from "../ui.module.css";
import styles from "./reviews.module.css";
import { VarietyPicker } from "./VarietyPicker";

/** 입력 중인 값. 숫자 칸도 입력 그대로 문자열로 들고 있다가 저장할 때 바꾼다 */
interface Draft {
  fruitName: string;
  varietyId: number | null;
  eatenDate: string;
  store: string;
  origin: string;
  price: string;
  weightGram: string;
  rating: number | null;
  title: string;
  body: string;
}

/** 오늘 날짜(이 노트북 시간대) "2026-10-05" */
function today(): string {
  return new Date().toLocaleDateString("sv-SE");
}

function toDraft(review: Review | null): Draft {
  return {
    fruitName: review?.fruitName ?? "",
    varietyId: review?.varietyId ?? null,
    eatenDate: review?.eatenDate ?? today(),
    store: review?.store ?? "",
    origin: review?.origin ?? "",
    price: review ? String(review.price) : "",
    weightGram: review?.weightGram ? String(review.weightGram) : "",
    rating: review?.rating ?? null,
    title: review?.title ?? "",
    body: review?.body ?? "",
  };
}

/** 숫자만 남긴다. "15,000원" → "15000" */
function digits(text: string): string {
  return text.replace(/\D/g, "");
}

/** 필수 칸이 비었으면 빠진 칸 이름 목록, 다 찼으면 요청 본문 */
function toRequest(draft: Draft): ReviewRequest | string[] {
  const missing = [
    !draft.fruitName.trim() && "과일명",
    !draft.eatenDate && "먹은 날",
    !draft.store.trim() && "산 곳",
    !draft.price && "산 가격",
    draft.rating === null && "별점",
    !draft.title.trim() && "제목",
    !draft.body.trim() && "본문",
  ].filter((name): name is string => Boolean(name));
  if (missing.length > 0 || draft.rating === null) {
    return missing;
  }
  return {
    fruitName: draft.fruitName.trim(),
    varietyId: draft.varietyId,
    eatenDate: draft.eatenDate,
    title: draft.title.trim(),
    store: draft.store.trim(),
    origin: draft.origin.trim() || null,
    price: Number(draft.price),
    weightGram: draft.weightGram ? Number(draft.weightGram) : null,
    rating: draft.rating,
    body: draft.body.trim(),
  };
}

type Market =
  | { state: "none" }
  | { state: "loading" }
  | { state: "empty" }
  | { state: "error"; message: string }
  | {
      state: "ok";
      price: MarketPrice;
    };

/**
 * 리뷰 한 건 작성·수정 폼. [review] 가 null 이면 새 리뷰. 고른 리뷰가 바뀌면 page 가 key 로 새로 만든다.
 * 품종과 먹은 날이 있으면 그날 도매 시세를 불러와 옆에 보여준다(저장하지 않는다 — 공개면 빌드 때 다시 계산한다).
 */
export function ReviewForm({
  review,
  varieties,
  onDirtyChange,
  onSaved,
  onDeleted,
}: {
  review: Review | null;
  varieties: AdminVariety[];
  onDirtyChange: (dirty: boolean) => void;
  onSaved: (review: Review) => void;
  onDeleted: (id: number) => void;
}) {
  const [initial] = useState(() => toDraft(review));
  const [draft, setDraft] = useState(initial);
  const [market, setMarket] = useState<Market>({ state: "none" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dirty = JSON.stringify(draft) !== JSON.stringify(initial);
  useEffect(() => onDirtyChange(dirty), [dirty, onDirtyChange]);

  const { varietyId, eatenDate } = draft;
  useEffect(() => {
    if (varietyId === null || !eatenDate) {
      setMarket({ state: "none" });
      return;
    }
    let cancelled = false;
    setMarket({ state: "loading" });
    adminApi
      .get<MarketPrice>(`/reviews/market-price?varietyId=${varietyId}&eatenDate=${eatenDate}`)
      .then((price) => !cancelled && setMarket(price ? { state: "ok", price } : { state: "empty" }))
      .catch((caught: Error) => !cancelled && setMarket({ state: "error", message: caught.message }));
    return () => {
      cancelled = true;
    };
  }, [varietyId, eatenDate]);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((current) => ({ ...current, [key]: value }));
  const perKg = draft.price && draft.weightGram ? (Number(draft.price) / Number(draft.weightGram)) * 1000 : null;

  const save = async () => {
    const request = toRequest(draft);
    if (Array.isArray(request)) {
      setError(`비어 있는 칸: ${request.join(", ")}`);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const saved = review
        ? await adminApi.put<Review>(`/reviews/${review.id}`, request)
        : await adminApi.post<Review>("/reviews", request);
      if (saved) {
        onSaved(saved);
      }
    } catch (caught) {
      setError((caught as Error).message);
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!review || !window.confirm(`“${review.title}” 리뷰를 지울까요? 되돌릴 수 없습니다.`)) {
      return;
    }
    setSaving(true);
    try {
      await adminApi.delete(`/reviews/${review.id}`);
      onDeleted(review.id);
    } catch (caught) {
      setError((caught as Error).message);
      setSaving(false);
    }
  };

  return (
    <form
      className={styles.form}
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
    >
      <div className={styles.formHead}>
        <h2 className={styles.formTitle}>{review ? "리뷰 수정" : "새 리뷰"}</h2>
        {review && (
          <span className={styles.stamp}>
            작성 {shortDate(review.createdAt.slice(0, 10))} · 수정 {shortDate(review.updatedAt.slice(0, 10))}
          </span>
        )}
      </div>

      <div className={styles.grid2}>
        <Field label="과일명" required>
          <input
            className={ui.input}
            value={draft.fruitName}
            onChange={(event) => set("fruitName", event.target.value)}
            maxLength={100}
          />
        </Field>
        <Field label="가락시장 품종 연결" group>
          <VarietyPicker varieties={varieties} value={draft.varietyId} onChange={(id) => set("varietyId", id)} />
        </Field>
      </div>

      <div className={styles.gridDate}>
        <Field label="먹은 날" required>
          <input
            type="date"
            className={ui.input}
            value={draft.eatenDate}
            max={today()}
            onChange={(event) => set("eatenDate", event.target.value)}
          />
        </Field>
        <Field label="산 곳" required>
          <input
            className={ui.input}
            value={draft.store}
            onChange={(event) => set("store", event.target.value)}
            maxLength={100}
          />
        </Field>
        <Field label="산지">
          <input
            className={ui.input}
            value={draft.origin}
            onChange={(event) => set("origin", event.target.value)}
            maxLength={100}
          />
        </Field>
      </div>

      <div className={styles.grid3}>
        <Field label="산 가격 (원)" required>
          <input
            className={ui.input}
            inputMode="numeric"
            value={draft.price ? won(Number(draft.price)) : ""}
            onChange={(event) => set("price", digits(event.target.value))}
          />
        </Field>
        <Field label="무게 (g)" hint="모르면 비움">
          <input
            className={ui.input}
            inputMode="numeric"
            value={draft.weightGram}
            onChange={(event) => set("weightGram", digits(event.target.value))}
          />
        </Field>
        <div className={styles.perKg}>
          <span>kg당 (자동)</span>
          <b>{perKg === null ? "—" : `${won(perKg)}원`}</b>
        </div>
      </div>

      <div className={styles.lower}>
        <div className={styles.lowerMain}>
          <div className={styles.field}>
            <span className={styles.label}>
              별점<span className={styles.required}> *</span>
              <span className={styles.hint}> 0~5</span>
            </span>
            <div className={styles.ratings}>
              {[0, 1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  type="button"
                  className={rating === draft.rating ? styles.ratingSelected : styles.rating}
                  aria-pressed={rating === draft.rating}
                  onClick={() => set("rating", rating)}
                >
                  {rating}
                </button>
              ))}
            </div>
          </div>
          <Field label="제목" required hint="100자까지">
            <input
              className={ui.input}
              value={draft.title}
              onChange={(event) => set("title", event.target.value)}
              maxLength={100}
            />
          </Field>
          <Field label="본문" required>
            <textarea
              className={styles.textarea}
              value={draft.body}
              onChange={(event) => set("body", event.target.value)}
            />
          </Field>
        </div>

        <MarketPriceCard market={market} eatenDate={draft.eatenDate} />
      </div>

      <div className={styles.actions}>
        {review && (
          <button type="button" className={ui.danger} onClick={remove} disabled={saving}>
            삭제
          </button>
        )}
        <span className={error ? styles.error : styles.actionNote}>
          {error ?? "저장 후 빌드를 돌려야 공개면에 반영"}
        </span>
        <button type="button" className={ui.secondary} onClick={() => setDraft(initial)} disabled={!dirty || saving}>
          되돌리기
        </button>
        <button type="submit" className={ui.primary} disabled={saving || (review !== null && !dirty)}>
          {saving ? "저장 중" : "저장"}
        </button>
      </div>
    </form>
  );
}

/**
 * 이름표 + 입력 칸. 안에 버튼이 여럿 있는 칸(품종 연결)은 [group] 으로 label 대신 div 로 감싼다 —
 * label 이면 이름표 글자를 눌렀을 때 안의 첫 버튼("연결 해제")이 눌린다.
 */
function Field({
  label,
  required,
  hint,
  group,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  group?: boolean;
  children: ReactNode;
}) {
  const Wrapper = group ? "div" : "label";
  return (
    <Wrapper className={styles.field}>
      <span className={styles.label}>
        {label}
        {required && <span className={styles.required}> *</span>}
        {hint && <span className={styles.hint}> {hint}</span>}
      </span>
      {children}
    </Wrapper>
  );
}

function MarketPriceCard({ market, eatenDate }: { market: Market; eatenDate: string }) {
  return (
    <aside className={styles.market}>
      <div className={styles.marketHead}>
        <span className={styles.marketTitle}>그날 도매 시세</span>
        <span className={styles.hint}>자동 · 저장 안 함</span>
      </div>
      {market.state === "ok" ? (
        <>
          <div className={styles.hint}>
            {monthDayWeekday(market.price.date)} 경매
            {market.price.date !== eatenDate && " · 먹은 날 경매 없어 그 전 거래일 값"}
          </div>
          <div>
            <b className={styles.marketPrice}>{won(market.price.perKg)}</b>
            <span className={styles.hint}> 원 / kg · 등급 합산</span>
          </div>
          {market.price.grades.length > 1 && (
            <dl className={styles.grades}>
              {market.price.grades.map((grade) => (
                <div key={grade.grdCd}>
                  <dt>{grade.grdNm}</dt>
                  <dd>{won(grade.perKg)}원</dd>
                </div>
              ))}
            </dl>
          )}
        </>
      ) : (
        <div className={styles.marketEmpty}>
          {market.state === "none" && "품종을 연결하면 그날 시세를 불러옵니다"}
          {market.state === "loading" && "불러오는 중"}
          {market.state === "empty" && "시세 없음 · 먹은 날 포함 7일 안에 거래가 없음"}
          {market.state === "error" && `불러오지 못함: ${market.message}`}
        </div>
      )}
      <div className={styles.marketNote}>품종이나 먹은 날을 바꾸면 다시 불러옵니다.</div>
    </aside>
  );
}
