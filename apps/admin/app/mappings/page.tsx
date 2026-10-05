"use client";

import type { AdminVariety, RetailVariety, VarietyMapping } from "@pomona/shared";
import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import { normalize, retailCode, retailName, varietyCode, varietyName } from "@/lib/variety";
import ui from "../ui.module.css";
import styles from "./mappings.module.css";

type RetailFilter = "all" | "unmapped";

/**
 * 품종 매핑. 왼쪽 가락시장 품종과 오른쪽 소매 품종에서 하나씩 골라 연결한다. 연결하면 그 품종 페이지에 소매가가 붙는다.
 *
 * - 가락시장 품종 하나에 소매 짝은 하나. 이미 짝이 있는 품종을 다시 연결하면 새 짝으로 바뀐다
 * - 소매 품종 하나에 가락시장 품종 여럿은 된다(후지 ← 후지·미시마)
 * - 소매 품종은 30종 안팎이라 "연결 없음" 으로 거르면 남은 일이 보인다
 */
export default function MappingsPage() {
  const [varieties, setVarieties] = useState<AdminVariety[] | null>(null);
  const [retailVarieties, setRetailVarieties] = useState<RetailVariety[]>([]);
  const [mappings, setMappings] = useState<VarietyMapping[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [varietyQuery, setVarietyQuery] = useState("");
  const [retailQuery, setRetailQuery] = useState("");
  const [retailFilter, setRetailFilter] = useState<RetailFilter>("all");
  const [selectedVarietyId, setSelectedVarietyId] = useState<number | null>(null);
  const [selectedRetailId, setSelectedRetailId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      adminApi.get<AdminVariety[]>("/varieties"),
      adminApi.get<RetailVariety[]>("/mappings/retail-varieties"),
      adminApi.get<VarietyMapping[]>("/mappings"),
    ])
      .then(([loadedVarieties, loadedRetailVarieties, loadedMappings]) => {
        setVarieties(loadedVarieties ?? []);
        setRetailVarieties(loadedRetailVarieties ?? []);
        setMappings(loadedMappings ?? []);
      })
      .catch((caught: Error) => setLoadError(caught.message));
  }, []);

  if (loadError) {
    return <p className={ui.loadError}>불러오지 못했습니다: {loadError}</p>;
  }
  if (!varieties) {
    return <p className={ui.loading}>불러오는 중</p>;
  }

  const mappingOf = new Map(mappings.map((mapping) => [mapping.varietyId, mapping]));
  const mappedCount = new Map<number, number>();
  for (const mapping of mappings) {
    mappedCount.set(mapping.retailVariety.id, (mappedCount.get(mapping.retailVariety.id) ?? 0) + 1);
  }
  const unmappedCount = retailVarieties.filter((retail) => !mappedCount.has(retail.id)).length;

  const shownVarieties = varietyQuery.trim()
    ? varieties.filter((variety) => normalize(varietyName(variety)).includes(normalize(varietyQuery)))
    : varieties;
  const shownRetail = retailVarieties
    .filter((retail) => retailFilter === "all" || !mappedCount.has(retail.id))
    .filter((retail) => !retailQuery.trim() || normalize(retailName(retail)).includes(normalize(retailQuery)));

  const selectedVariety = varieties.find((variety) => variety.id === selectedVarietyId);
  const selectedRetail = retailVarieties.find((retail) => retail.id === selectedRetailId);
  const current = selectedVarietyId === null ? undefined : mappingOf.get(selectedVarietyId);
  const alreadyPaired = current !== undefined && current.retailVariety.id === selectedRetailId;

  const run = async (work: () => Promise<string>) => {
    setBusy(true);
    setError(null);
    try {
      setNotice(await work());
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const map = () =>
    run(async () => {
      if (!selectedVariety || !selectedRetail) {
        return "";
      }
      const saved = await adminApi.put<VarietyMapping>(`/mappings/${selectedVariety.id}`, {
        retailVarietyId: selectedRetail.id,
      });
      if (saved) {
        setMappings((list) => [saved, ...list.filter((mapping) => mapping.varietyId !== saved.varietyId)]);
      }
      setSelectedRetailId(null);
      return `${varietyName(selectedVariety)} ↔ ${retailName(selectedRetail)} 연결했습니다. 공개면은 빌드 후 소매가가 붙습니다.`;
    });

  const unmap = (mapping: VarietyMapping) =>
    run(async () => {
      await adminApi.delete(`/mappings/${mapping.varietyId}`);
      setMappings((list) => list.filter((candidate) => candidate.varietyId !== mapping.varietyId));
      return `${varietyName({ mclsfNm: mapping.itemName, sclsfNm: mapping.varietyName })} 연결을 풀었습니다. 공개면은 빌드 후 소매가가 빠집니다.`;
    });

  return (
    <>
      <div className={ui.titleRow}>
        <h1 className={ui.title}>품종 매핑</h1>
        <span className={ui.subtitle}>양쪽에서 하나씩 골라 연결. 연결되면 그 품종 페이지에 소매가가 붙음</span>
        {notice && <span className={ui.notice}>{notice}</span>}
      </div>

      <section className={styles.columns}>
        <article className={styles.panel}>
          <div className={styles.panelHead}>
            <h2 className={styles.panelTitle}>가락시장 품종</h2>
            <span className={styles.count}>{varieties.length}종 · 페이지 없는 소량 품종 포함</span>
          </div>
          <input
            type="search"
            className={ui.input}
            value={varietyQuery}
            onChange={(event) => setVarietyQuery(event.target.value)}
            placeholder="품목·품종 이름으로 찾기"
            aria-label="가락시장 품종 찾기"
          />
          <div className={styles.rows}>
            {shownVarieties.map((variety) => {
              const mapping = mappingOf.get(variety.id);
              return (
                <button
                  key={variety.id}
                  type="button"
                  className={variety.id === selectedVarietyId ? styles.rowSelected : styles.row}
                  onClick={() => setSelectedVarietyId(variety.id)}
                >
                  <span>
                    {varietyName(variety)}
                    <span className={ui.code}>{varietyCode(variety)}</span>
                  </span>
                  {mapping && <span className={styles.paired}>→ {mapping.retailVariety.vrtyNm}</span>}
                </button>
              );
            })}
            {shownVarieties.length === 0 && <span className={styles.empty}>“{varietyQuery}” 품종이 없습니다</span>}
          </div>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHead}>
            <h2 className={styles.panelTitle}>소매 품종</h2>
            <span className={styles.filters}>
              <button
                type="button"
                className={retailFilter === "all" ? styles.filterOn : styles.filter}
                onClick={() => setRetailFilter("all")}
              >
                전체 {retailVarieties.length}
              </button>
              <button
                type="button"
                className={retailFilter === "unmapped" ? styles.filterOn : styles.filter}
                onClick={() => setRetailFilter("unmapped")}
              >
                연결 없음 {unmappedCount}
              </button>
            </span>
          </div>
          <input
            type="search"
            className={ui.input}
            value={retailQuery}
            onChange={(event) => setRetailQuery(event.target.value)}
            placeholder="품목·품종 이름으로 찾기"
            aria-label="소매 품종 찾기"
          />
          <div className={styles.rows}>
            {shownRetail.map((retail) => {
              const count = mappedCount.get(retail.id) ?? 0;
              return (
                <button
                  key={retail.id}
                  type="button"
                  className={retail.id === selectedRetailId ? styles.rowSelected : styles.row}
                  onClick={() => setSelectedRetailId(retail.id)}
                >
                  <span>
                    {retailName(retail)}
                    <span className={ui.code}>{retailCode(retail)}</span>
                  </span>
                  <span className={count > 0 ? styles.paired : styles.unpaired}>
                    {count > 0 ? `연결 ${count}` : "연결 없음"}
                  </span>
                </button>
              );
            })}
            {shownRetail.length === 0 && <span className={styles.empty}>보여줄 소매 품종이 없습니다</span>}
          </div>
        </article>
      </section>

      <section className={styles.pairBar}>
        <span className={selectedVariety ? styles.pairName : styles.pairEmpty}>
          {selectedVariety ? varietyName(selectedVariety) : "왼쪽에서 가락시장 품종 고르기"}
        </span>
        <span className={styles.arrow}>↔</span>
        <span className={selectedRetail ? styles.pairName : styles.pairEmpty}>
          {selectedRetail ? retailName(selectedRetail) : "오른쪽에서 소매 품종 고르기"}
        </span>
        <button
          type="button"
          className={ui.primary}
          disabled={!selectedVariety || !selectedRetail || alreadyPaired || busy}
          onClick={map}
        >
          {alreadyPaired ? "이미 연결됨" : current ? "바꾸기" : "연결"}
        </button>
        {current && !alreadyPaired && (
          <span className={styles.pairNote}>지금 짝 {retailName(current.retailVariety)} 대신 연결합니다</span>
        )}
        {error && <span className={styles.error}>{error}</span>}
      </section>

      <section className={styles.mapped}>
        <div className={styles.panelHead}>
          <h2 className={styles.panelTitle}>연결된 품종</h2>
          <span className={styles.count}>{mappings.length}개 · 최근에 바꾼 순</span>
        </div>
        {mappings.length === 0 ? (
          <span className={styles.empty}>아직 연결한 품종이 없습니다</span>
        ) : (
          <div>
            <div className={styles.tableHead}>
              <span>가락시장 품종</span>
              <span />
              <span>소매 품종</span>
            </div>
            {mappings.map((mapping) => (
              <div key={mapping.varietyId} className={styles.tableRow}>
                <span>{varietyName({ mclsfNm: mapping.itemName, sclsfNm: mapping.varietyName })}</span>
                <span className={styles.arrow}>↔</span>
                <span>
                  {retailName(mapping.retailVariety)}
                  <span className={ui.code}>{retailCode(mapping.retailVariety)}</span>
                </span>
                <button type="button" className={styles.unmap} disabled={busy} onClick={() => unmap(mapping)}>
                  해제
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
