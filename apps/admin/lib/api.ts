/*
 * 백오피스 API 호출. 이 앱 주소의 /api/admin 으로 부르면 Next rewrites 가 백엔드로 넘긴다(next.config.ts).
 * 실패하면 백엔드 에러 본문의 message(없으면 상태 코드)로 Error 를 던진다.
 */

async function request<T>(method: string, path: string, body?: unknown): Promise<T | null> {
  const response = await fetch(`/api/admin${path}`, {
    method,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.message ?? `${method} ${path} → ${response.status}`);
  }
  // 204 와 본문 없는 202(기간 재수집 시작)는 null
  const text = await response.text();
  return text ? (JSON.parse(text) as T) : null;
}

export const adminApi = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body: unknown) => request<T>("POST", path, body),
  put: <T>(path: string, body: unknown) => request<T>("PUT", path, body),
  delete: (path: string) => request<null>("DELETE", path),
};
