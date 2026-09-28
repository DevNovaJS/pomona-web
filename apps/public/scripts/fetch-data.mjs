/*
 * 빌드 직전에 백엔드 공개 API 를 한 번씩 받아 data/*.json 으로 저장한다. 페이지는 이 파일만 읽는다.
 *
 * 페이지에서 fetch 로 부르지 않는 이유:
 * - Next 는 빌드 때 받은 fetch 응답을 .next/cache 에 저장해 두고 다음 빌드에서 다시 꺼내 쓴다 → 전날 데이터로 페이지가 만들어진다
 * - 빌드 워커마다 따로 부르면 도중에 새벽 배치가 끝났을 때 페이지마다 다른 시점의 데이터가 섞인다
 *
 * 하나라도 실패하면 0 이 아닌 코드로 끝나 빌드가 멈춘다. 반쯤 받은 데이터로 배포하지 않는다.
 */
import { mkdir, writeFile } from "node:fs/promises";

const ENDPOINTS = {
  period: "/period",
  items: "/items",
  varieties: "/varieties",
  "latest-prices": "/prices/latest",
  "weekly-prices": "/prices/weekly",
  "retail-prices": "/retail-prices",
  volumes: "/volumes",
  "item-volumes": "/volumes/items",
  "trading-days": "/trading-days",
  origins: "/origins",
  "item-origins": "/origins/items",
  reviews: "/reviews",
};

const backend = process.env.BACKEND_URL;
if (!backend) {
  throw new Error("BACKEND_URL 이 없다");
}

await mkdir("data", { recursive: true });
await Promise.all(
  Object.entries(ENDPOINTS).map(async ([name, path]) => {
    const response = await fetch(`${backend}/api/public${path}`);
    if (!response.ok) {
      throw new Error(`GET /api/public${path} → ${response.status}`);
    }
    await writeFile(`data/${name}.json`, await response.text());
  }),
);
console.log(`${backend} 에서 ${Object.keys(ENDPOINTS).length}개 받음 → data/`);
