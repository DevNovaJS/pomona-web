"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.css";

// 셋업 확인용. /api/admin 이 백엔드로 넘어가는지 본다. 배치 관리 화면을 만들 때 바꾼다
export default function Home() {
  const [status, setStatus] = useState("불러오는 중");

  useEffect(() => {
    fetch("/api/admin/batch/status")
      .then((response) => setStatus(`백엔드 응답 ${response.status}`))
      .catch((error: unknown) => setStatus(`실패: ${String(error)}`));
  }, []);

  return (
    <main className={styles.main}>
      <h1 className={styles.title}>백오피스</h1>
      <p>{status}</p>
    </main>
  );
}
