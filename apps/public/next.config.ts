import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 빌드 때 백엔드 API를 불러 페이지마다 HTML을 굳힌다. 결과물(out/)을 Cloudflare Pages에 올린다
  output: "export",
  // 정적 파일만 올리므로 요청 때 이미지를 줄여 줄 서버가 없다
  images: { unoptimized: true },
  // shared 는 빌드하지 않은 TS·CSS 원본을 내보내므로 이 앱이 같이 컴파일한다
  transpilePackages: ["@pomona/shared"],
  // next dev 가 AI 에이전트 실행을 감지하면 AGENTS.md · CLAUDE.md 를 만드는 것을 끈다
  agentRules: false,
};

export default nextConfig;
